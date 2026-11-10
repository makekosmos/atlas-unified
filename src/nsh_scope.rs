//! The HEX dot scope from dictation, sized to whatever field the app gives it.
//!
//! `atlas.scope` paints a GPUI image the WGSL shader rendered for the current
//! frame. The app sets `level` (0..100, already on the decibel scale the
//! recorder reports) and `active`; the component takes the box NSH hands it,
//! lays the dot grid out over that box, and asks for the next frame while it
//! is on screen.

use std::{
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use gpui::{img, prelude::*, AnyElement, App, ImageSource, RenderImage, Window};
use imago_nsh::{ComponentContext, NativeComponent};
use serde_json::Value;

use crate::scope::{
    gpu::{GpuScopeRenderer, Layout},
    Frame, Scope, Stage, Tuning,
};

/// Thirty frames a second: the plate is a phosphor trail, not a 60 Hz game.
const RENDER_EVERY: Duration = Duration::from_millis(33);
/// Dictation maps a 0..1 meter to -55..0 dBFS; below this the meter is silence.
const SILENCE: f32 = 0.12;
/// Dot pitch bounds: dictation's 2.6 pt plate reads well, and past 5 pt the
/// grid stops looking like a field of dots.
const PITCH_MIN: f32 = 2.6;
const PITCH_MAX: f32 = 5.0;
/// Dots the simulation keeps up with at 240 Hz on the main thread.
const DOT_BUDGET: f32 = 1750.0;
/// Device pixels per pt: the texture is drawn at logical size, so this keeps
/// the dots sharp on a retina panel.
const SCALE: f32 = 2.0;

pub(crate) struct AtlasScope {
    context: ComponentContext,
    scope: Scope,
    renderer: Option<Arc<Mutex<GpuScopeRenderer>>>,
    image: Option<Arc<RenderImage>>,
    /// 0..1, the recorder's decibel level.
    level: f32,
    active: bool,
    /// The recording ended: the braid clears from the middle out.
    done: bool,
    /// The box NSH gave the container, in pt.
    size: (f32, f32),
    tuned_for: (f32, f32),
    last_tick: Instant,
    last_render: Option<Instant>,
    failed: bool,
}

impl AtlasScope {
    pub(crate) fn new(context: ComponentContext) -> Self {
        Self {
            context,
            scope: Scope::new(Tuning::default()),
            renderer: None,
            image: None,
            level: 0.0,
            active: false,
            done: false,
            size: (0.0, 0.0),
            tuned_for: (0.0, 0.0),
            last_tick: Instant::now(),
            last_render: None,
            failed: false,
        }
    }

    fn renderer(&mut self) -> Option<Arc<Mutex<GpuScopeRenderer>>> {
        if self.renderer.is_none() && !self.failed {
            match GpuScopeRenderer::new() {
                Ok(renderer) => self.renderer = Some(Arc::new(Mutex::new(renderer))),
                Err(error) => {
                    eprintln!("[atlas-scope] no GPU scope: {error:#}");
                    self.failed = true;
                }
            }
        }
        self.renderer.clone()
    }

    /// Lay the grid out over the field: as many dots as the box takes within
    /// the budget, never tighter than dictation's plate.
    fn pitch(&self) -> f32 {
        let (width, height) = self.size;
        let area = (width * height).max(1.0);
        (area / DOT_BUDGET).sqrt().clamp(PITCH_MIN, PITCH_MAX)
    }

    fn tune(&mut self) {
        let (width, height) = self.size;
        if width < 1.0 || height < 1.0 || self.tuned_for == self.size {
            return;
        }
        let pitch = self.pitch();
        let tuning = Tuning {
            // +1 so the outer dots sit on the box edge, not half a pitch in.
            columns: (width / pitch).round().max(3.0) + 1.0,
            rows: (height / pitch).round().max(3.0) + 1.0,
            width,
            height,
            spacing: pitch,
            // One braid wave per 70 pt: the plate's 1.6 cycles over 112 pt.
            helix_cycles: (width / 70.0).clamp(1.6, 32.0),
            ..Tuning::default()
        };
        self.scope.tune(tuning);
        self.tuned_for = self.size;
    }

    fn advance(&mut self, now: Instant) {
        let dt = now
            .duration_since(self.last_tick)
            .as_secs_f32()
            .clamp(0.0, 0.1);
        self.last_tick = now;
        let loudness = if self.level < SILENCE {
            -120.0
        } else {
            -55.0 + self.level * 40.0
        };
        let stage = if self.done {
            Stage::Done
        } else {
            Stage::Recording
        };
        self.scope.advance(
            dt,
            Frame {
                stage,
                visible: true,
                loudness,
                reduce_motion: false,
            },
        );
    }

    fn layout(&self) -> Layout {
        Layout {
            width: self.size.0,
            height: self.size.1,
            scale: SCALE,
            pitch: self.pitch(),
            // The composer already draws the field: the scope is dots only.
            plate: false,
        }
    }
}

impl NativeComponent for AtlasScope {
    fn render(&mut self, window: &mut Window, _cx: &mut App) -> Option<AnyElement> {
        self.tune();
        if self.size.0 < 1.0 || self.size.1 < 1.0 {
            return None;
        }
        let now = Instant::now();
        self.advance(now);
        let due = self
            .last_render
            .is_none_or(|last| now.duration_since(last) >= RENDER_EVERY);
        if due {
            self.last_render = Some(now);
            let layout = self.layout();
            if let Some(renderer) = self.renderer() {
                let rendered = renderer
                    .lock()
                    .ok()
                    .and_then(|mut renderer| renderer.render(&self.scope, layout).ok());
                if let Some(image) = rendered {
                    if let Some(previous) = self.image.replace(image) {
                        let _ = window.drop_image(previous);
                    }
                }
            }
        }
        // The braid breathes even when the level is still: keep frames coming.
        self.context.redraw();
        let image = self.image.clone()?;
        Some(
            gpui::div()
                .size_full()
                .child(img(ImageSource::Render(image)).size_full())
                .into_any_element(),
        )
    }

    fn placed(&mut self, bounds: Option<gpui::Bounds<gpui::Pixels>>) {
        if let Some(bounds) = bounds {
            let size = (f32::from(bounds.size.width), f32::from(bounds.size.height));
            if size != self.size {
                self.size = size;
                self.image = None;
            }
        }
    }

    fn set_prop(&mut self, name: &str, value: Option<&Value>, _window: &mut Window, _cx: &mut App) {
        match name {
            "level" => {
                self.level = value
                    .and_then(Value::as_f64)
                    .map(|level| (level / 100.0).clamp(0.0, 1.0) as f32)
                    .unwrap_or(0.0);
            }
            "active" => self.active = value.and_then(Value::as_bool).unwrap_or(false),
            "done" => self.done = value.and_then(Value::as_bool).unwrap_or(false),
            _ => {}
        }
    }
}
