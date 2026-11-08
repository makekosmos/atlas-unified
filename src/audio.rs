//! Voice notes: the microphone in, Opus out, and back again.
//!
//! A note is Opus at 16 kbit/s in variable bitrate, `voip` mode: about 130 KB
//! for a minute of speech, which fits an Engine object payload. The blob is our
//! own container (`AO1`) around the raw packets, so nothing has to parse Ogg.
//!
//! Capture and playback each live on their own thread: a host stream is not
//! `Send` on every platform, and the bridge asks for a recording from the UI
//! thread.

use std::{
    sync::{
        atomic::{AtomicBool, AtomicU16, Ordering},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

use audiopus::{coder::Decoder, coder::Encoder, Application, Bitrate, Channels, SampleRate};

/// The rate the encoder runs at; Opus takes 8, 12, 16, 24 or 48 kHz.
pub const SAMPLE_RATE: u32 = 48_000;
/// 20 ms at [`SAMPLE_RATE`]: one Opus frame.
pub const FRAME_SAMPLES: usize = 960;
/// 16 kbit/s, variable: speech keeps its quality, silence costs almost nothing.
pub const BITRATE: i32 = 16_000;
/// Bars the UI draws; more would not fit a bubble.
pub const PEAK_BARS: usize = 32;
/// Silence longer than this ends a recording on its own.
pub const MAX_CLIP_MS: u32 = 10 * 60 * 1000;

const MAGIC: &[u8; 4] = b"AO1\0";
const VERSION: u8 = 1;

/// A recorded voice note: Opus packets plus what the UI needs to draw it.
#[derive(Clone, Debug, PartialEq)]
pub struct Clip {
    pub duration_ms: u32,
    /// Normalized 0..=100 loudness per bar, left to right.
    pub peaks: Vec<u8>,
    pub packets: Vec<Vec<u8>>,
}

impl Clip {
    pub fn is_empty(&self) -> bool {
        self.packets.is_empty() || self.duration_ms < 200
    }

    /// `AO1` header, then each packet behind a 16-bit length.
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(32 + self.packets.iter().map(Vec::len).sum::<usize>());
        out.extend_from_slice(MAGIC);
        out.push(VERSION);
        out.extend_from_slice(&SAMPLE_RATE.to_le_bytes());
        out.extend_from_slice(&(FRAME_SAMPLES as u16).to_le_bytes());
        out.extend_from_slice(&self.duration_ms.to_le_bytes());
        out.extend_from_slice(&(self.peaks.len() as u16).to_le_bytes());
        out.extend_from_slice(&self.peaks);
        out.extend_from_slice(&(self.packets.len() as u32).to_le_bytes());
        for packet in &self.packets {
            out.extend_from_slice(&(packet.len() as u16).to_le_bytes());
            out.extend_from_slice(packet);
        }
        out
    }

    pub fn from_bytes(bytes: &[u8]) -> Result<Self, String> {
        let mut at = 0usize;
        let take = |at: &mut usize, len: usize| -> Result<&[u8], String> {
            let end = at
                .checked_add(len)
                .filter(|end| *end <= bytes.len())
                .ok_or_else(|| "voice note ends early".to_string())?;
            let slice = &bytes[*at..end];
            *at = end;
            Ok(slice)
        };
        if take(&mut at, 4)? != MAGIC {
            return Err("voice note has no AO1 header".into());
        }
        let version = take(&mut at, 1)?[0];
        if version != VERSION {
            return Err(format!("voice note version {version} is not supported"));
        }
        let rate = u32::from_le_bytes(take(&mut at, 4)?.try_into().unwrap());
        if rate != SAMPLE_RATE {
            return Err(format!("voice note rate {rate} is not {SAMPLE_RATE}"));
        }
        let frame = u16::from_le_bytes(take(&mut at, 2)?.try_into().unwrap());
        if frame as usize != FRAME_SAMPLES {
            return Err(format!("voice note frame {frame} is not {FRAME_SAMPLES}"));
        }
        let duration_ms = u32::from_le_bytes(take(&mut at, 4)?.try_into().unwrap());
        let peaks_len = u16::from_le_bytes(take(&mut at, 2)?.try_into().unwrap()) as usize;
        let peaks = take(&mut at, peaks_len)?.to_vec();
        let count = u32::from_le_bytes(take(&mut at, 4)?.try_into().unwrap()) as usize;
        let mut packets = Vec::with_capacity(count);
        for _ in 0..count {
            let len = u16::from_le_bytes(take(&mut at, 2)?.try_into().unwrap()) as usize;
            packets.push(take(&mut at, len)?.to_vec());
        }
        Ok(Self {
            duration_ms,
            peaks,
            packets,
        })
    }

    pub fn to_base64(&self) -> String {
        base64::Engine::encode(&base64::engine::general_purpose::STANDARD, self.to_bytes())
    }

    pub fn from_base64(text: &str) -> Result<Self, String> {
        let bytes = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, text)
            .map_err(|error| format!("voice note is not base64: {error}"))?;
        Self::from_bytes(&bytes)
    }
}

fn encoder() -> Result<Encoder, String> {
    let mut encoder = Encoder::new(SampleRate::Hz48000, Channels::Mono, Application::Voip)
        .map_err(|error| format!("no Opus encoder: {error}"))?;
    encoder
        .set_bitrate(Bitrate::BitsPerSecond(BITRATE))
        .map_err(|error| format!("Opus bitrate refused: {error}"))?;
    encoder
        .set_vbr(true)
        .map_err(|error| format!("Opus VBR refused: {error}"))?;
    encoder
        .set_complexity(10)
        .map_err(|error| format!("Opus complexity refused: {error}"))?;
    encoder
        .set_signal(audiopus::Signal::Voice)
        .map_err(|error| format!("Opus signal refused: {error}"))?;
    Ok(encoder)
}

fn decoder() -> Result<Decoder, String> {
    Decoder::new(SampleRate::Hz48000, Channels::Mono)
        .map_err(|error| format!("no Opus decoder: {error}"))
}

/// Encodes whole frames; a short tail is padded with silence so nothing is lost.
pub fn encode(pcm: &[i16], encoder: &mut Encoder) -> Result<Vec<Vec<u8>>, String> {
    let mut packets = Vec::with_capacity(pcm.len() / FRAME_SAMPLES + 1);
    let mut buffer = vec![0u8; 4000];
    let mut frame = vec![0i16; FRAME_SAMPLES];
    for chunk in pcm.chunks(FRAME_SAMPLES) {
        frame[..chunk.len()].copy_from_slice(chunk);
        frame[chunk.len()..].fill(0);
        let len = encoder
            .encode(&frame[..], &mut buffer)
            .map_err(|error| format!("Opus encode failed: {error}"))?;
        packets.push(buffer[..len].to_vec());
    }
    Ok(packets)
}

pub fn decode(packets: &[Vec<u8>]) -> Result<Vec<i16>, String> {
    let mut decoder = decoder()?;
    let mut pcm = Vec::with_capacity(packets.len() * FRAME_SAMPLES);
    let mut frame = vec![0i16; FRAME_SAMPLES];
    for packet in packets {
        let samples = decoder
            .decode(Some(&packet[..]), &mut frame[..], false)
            .map_err(|error| format!("Opus decode failed: {error}"))?;
        pcm.extend_from_slice(&frame[..samples]);
    }
    Ok(pcm)
}

/// Loudness per bar: root mean square over an equal share of the clip, 0..=100.
pub fn peaks(pcm: &[i16], bars: usize) -> Vec<u8> {
    let bars = bars.max(1);
    if pcm.is_empty() {
        return vec![0; bars];
    }
    let share = pcm.len().div_ceil(bars);
    (0..bars)
        .map(|bar| {
            let start = bar * share;
            let end = (start + share).min(pcm.len());
            if start >= end {
                return 0;
            }
            let sum: f64 = pcm[start..end]
                .iter()
                .map(|sample| {
                    let value = *sample as f64 / i16::MAX as f64;
                    value * value
                })
                .sum();
            let rms = (sum / (end - start) as f64).sqrt().max(1e-6);
            // Same decibel window as the live meter: speech sits far below full
            // scale, and a linear lift leaves every bar at the floor.
            let db = 20.0 * rms.log10();
            (((db + 55.0) / 40.0).clamp(0.0, 1.0) * 100.0).round() as u8
        })
        .collect()
}

/// What the recording thread shares with the UI: samples in, level out.
struct Capture {
    samples: Mutex<Vec<i16>>,
    level: Arc<AtomicU16>,
    stopped: AtomicBool,
    error: Mutex<Option<String>>,
}

/// A recording in progress. Dropping it stops the microphone.
pub struct Recorder {
    capture: Arc<Capture>,
    started: std::time::Instant,
}

impl Recorder {
    /// Opens the default input device and starts listening.
    pub fn start() -> Result<Self, String> {
        let capture = Arc::new(Capture {
            samples: Mutex::new(Vec::new()),
            level: Arc::new(AtomicU16::new(0)),
            stopped: AtomicBool::new(false),
            error: Mutex::new(None),
        });
        let ready = Arc::new((Mutex::new(None::<String>), AtomicBool::new(false)));
        {
            let capture = capture.clone();
            let ready = ready.clone();
            thread::spawn(move || {
                let stream = start_stream(capture.clone());
                match stream {
                    Ok(stream) => {
                        ready.1.store(true, Ordering::Release);
                        while !capture.stopped.load(Ordering::Acquire) {
                            thread::sleep(Duration::from_millis(20));
                        }
                        drop(stream);
                    }
                    Err(error) => {
                        *ready.0.lock().unwrap() = Some(error);
                        ready.1.store(true, Ordering::Release);
                    }
                }
            });
        }
        // The device reports back through `ready`; a missing microphone shows here.
        for _ in 0..100 {
            if ready.1.load(Ordering::Acquire) {
                break;
            }
            thread::sleep(Duration::from_millis(10));
        }
        if let Some(error) = ready.0.lock().unwrap().take() {
            return Err(error);
        }
        Ok(Self {
            capture,
            started: std::time::Instant::now(),
        })
    }

    /// 0..=100, refreshed about fifty times a second.
    pub fn level(&self) -> u16 {
        self.capture.level.load(Ordering::Relaxed)
    }

    /// The same level, for a thread that only draws it.
    pub fn level_flag(&self) -> Arc<AtomicU16> {
        self.capture.level.clone()
    }

    pub fn elapsed_ms(&self) -> u32 {
        self.started.elapsed().as_millis().min(u32::MAX as u128) as u32
    }

    /// Stops the microphone and encodes what was heard.
    pub fn stop(self) -> Result<Clip, String> {
        self.capture.stopped.store(true, Ordering::Release);
        let pcm = std::mem::take(&mut *self.capture.samples.lock().unwrap());
        if let Some(error) = self.capture.error.lock().unwrap().take() {
            return Err(error);
        }
        let mut encoder = encoder()?;
        let packets = encode(&pcm, &mut encoder)?;
        Ok(Clip {
            duration_ms: (pcm.len() as u64 * 1000 / SAMPLE_RATE as u64) as u32,
            peaks: peaks(&pcm, PEAK_BARS),
            packets,
        })
    }
}

impl Drop for Recorder {
    fn drop(&mut self) {
        self.capture.stopped.store(true, Ordering::Release);
    }
}

/// Opens the microphone and feeds [`Capture`]; the stream lives on this thread.
fn start_stream(capture: Arc<Capture>) -> Result<cpal::Stream, String> {
    use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or_else(|| "no microphone".to_string())?;
    let supported = device
        .default_input_config()
        .map_err(|error| format!("microphone settings refused: {error}"))?;
    let channels = supported.channels() as usize;
    let rate = supported.sample_rate();
    let config: cpal::StreamConfig = supported.clone().into();

    let resample = Arc::new(Mutex::new(Linear::new(rate, SAMPLE_RATE)));
    let shared = capture.clone();
    let errors = capture.clone();
    let resample_cb = resample.clone();
    let stream = device
        .build_input_stream::<f32, _, _>(
            config,
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                let mono: Vec<f32> = data
                    .chunks(channels.max(1))
                    .map(|frame| frame.iter().sum::<f32>() / channels.max(1) as f32)
                    .collect();
                let samples = resample_cb.lock().unwrap().run(&mono);
                let mut buffer = shared.samples.lock().unwrap();
                buffer.extend(samples);
                // A stuck host must not eat the heap.
                let cap = SAMPLE_RATE as usize * MAX_CLIP_MS as usize / 1000;
                let over = buffer.len().saturating_sub(cap);
                if over > 0 {
                    buffer.drain(..over);
                }
                let tail = buffer.len().saturating_sub(FRAME_SAMPLES);
                let previous = shared.level.load(Ordering::Relaxed);
                shared
                    .level
                    .store(loudness(&buffer[tail..], previous), Ordering::Relaxed);
            },
            move |error| {
                *errors.error.lock().unwrap() = Some(format!("microphone stopped: {error}"));
            },
            None,
        )
        .map_err(|error| format!("microphone refused: {error}"))?;
    stream
        .play()
        .map_err(|error| format!("microphone did not start: {error}"))?;
    Ok(stream)
}

/// Level the way the dictation pill shows it: decibels over a 40 dB window,
/// with a fast attack and a slow release so onsets snap and pauses relax.
/// Ported from `dictation/gpui/src/session.rs` (`level_to_visual`,
/// `smooth_level`).
fn loudness(samples: &[i16], previous: u16) -> u16 {
    let next = if samples.is_empty() {
        0.0
    } else {
        let sum: f64 = samples
            .iter()
            .map(|sample| {
                let value = *sample as f64 / i16::MAX as f64;
                value * value
            })
            .sum();
        let rms = (sum / samples.len() as f64).sqrt().max(1e-6);
        let db = 20.0 * rms.log10();
        ((db + 55.0) / 40.0).clamp(0.0, 1.0)
    };
    let previous = previous as f64 / 100.0;
    let weight = if next > previous { 0.8 } else { 0.3 };
    let smoothed = (previous + (next - previous) * weight).clamp(0.0, 1.0);
    (smoothed * 100.0).round() as u16
}

/// Linear sample-rate conversion: speech at 16 kbit/s does not need better.
struct Linear {
    step: f64,
    position: f64,
    last: f32,
}

impl Linear {
    fn new(from: u32, to: u32) -> Self {
        Self {
            step: from as f64 / to as f64,
            position: 0.0,
            last: 0.0,
        }
    }

    fn run(&mut self, input: &[f32]) -> Vec<i16> {
        if (self.step - 1.0).abs() < f64::EPSILON {
            return input.iter().map(|value| to_i16(*value)).collect();
        }
        let mut out = Vec::with_capacity((input.len() as f64 / self.step) as usize + 2);
        for value in input {
            while self.position < 1.0 {
                let mixed = self.last + (*value - self.last) * self.position as f32;
                out.push(to_i16(mixed));
                self.position += self.step;
            }
            self.position -= 1.0;
            self.last = *value;
        }
        out
    }
}

fn to_i16(value: f32) -> i16 {
    (value.clamp(-1.0, 1.0) * i16::MAX as f32) as i16
}

/// Plays one clip at a time; a second `play` replaces the first.
pub struct Player {
    stop: Arc<AtomicBool>,
}

impl Player {
    /// Decodes and plays; `done` runs on the playback thread when it ends.
    pub fn play(clip: &Clip, done: impl FnOnce() + Send + 'static) -> Result<Self, String> {
        let pcm = Arc::new(decode(&clip.packets)?);
        let stop = Arc::new(AtomicBool::new(false));
        let flag = stop.clone();
        thread::spawn(move || {
            let played = open_output(pcm, flag);
            if let Err(error) = played {
                eprintln!("[atlas-voice] playback failed: {error}");
            }
            done();
        });
        Ok(Self { stop })
    }

    pub fn stop(&self) {
        self.stop.store(true, Ordering::Release);
    }
}

fn open_output(pcm: Arc<Vec<i16>>, stop: Arc<AtomicBool>) -> Result<(), String> {
    use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

    let host = cpal::default_host();
    let device = host
        .default_output_device()
        .ok_or_else(|| "no speaker".to_string())?;
    let supported = device
        .default_output_config()
        .map_err(|error| format!("speaker settings refused: {error}"))?;
    let channels = supported.channels() as usize;
    let rate = supported.sample_rate();
    let config: cpal::StreamConfig = supported.clone().into();
    let mut resample = Linear::new(SAMPLE_RATE, rate);
    let mono: Vec<f32> = resample
        .run(&pcm.iter().map(|s| *s as f32 / i16::MAX as f32).collect::<Vec<_>>())
        .into_iter()
        .map(|s| s as f32 / i16::MAX as f32)
        .collect();
    let audio = Arc::new(mono);
    let cursor = Arc::new(Mutex::new(0usize));
    let playing = cursor.clone();
    let flag = stop.clone();
    let stream = device
        .build_output_stream::<f32, _, _>(
            config,
            move |out: &mut [f32], _: &cpal::OutputCallbackInfo| {
                let mut cursor = playing.lock().unwrap();
                for frame in out.chunks_mut(channels.max(1)) {
                    let value = audio.get(*cursor).copied().unwrap_or(0.0);
                    *cursor += 1;
                    for sample in frame.iter_mut() {
                        *sample = value;
                    }
                }
                if *cursor >= audio.len() {
                    flag.store(true, Ordering::Release);
                }
            },
            move |error| eprintln!("[atlas-voice] speaker stopped: {error}"),
            None,
        )
        .map_err(|error| format!("speaker refused: {error}"))?;
    stream
        .play()
        .map_err(|error| format!("speaker did not start: {error}"))?;
    while !stop.load(Ordering::Acquire) {
        thread::sleep(Duration::from_millis(10));
    }
    drop(stream);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tone(ms: u32) -> Vec<i16> {
        let samples = SAMPLE_RATE as usize * ms as usize / 1000;
        (0..samples)
            .map(|index| {
                let t = index as f32 / SAMPLE_RATE as f32;
                ((t * 220.0 * std::f32::consts::TAU).sin() * 6000.0) as i16
            })
            .collect()
    }

    #[test]
    fn encodes_a_minute_of_speech_under_two_hundred_kilobytes() {
        let pcm = tone(60_000);
        let packets = encode(&pcm, &mut encoder().unwrap()).unwrap();
        let bytes: usize = packets.iter().map(Vec::len).sum();
        println!("one minute: {bytes} bytes, base64 {}", bytes.div_ceil(3) * 4);
        assert!(bytes < 200_000, "a minute took {bytes} bytes");
        assert!(bytes > 60_000, "a minute took {bytes} bytes");
    }

    #[test]
    fn keeps_the_clip_whole_through_base64() {
        let pcm = tone(400);
        let packets = encode(&pcm, &mut encoder().unwrap()).unwrap();
        let clip = Clip {
            duration_ms: 400,
            peaks: peaks(&pcm, PEAK_BARS),
            packets,
        };
        let back = Clip::from_base64(&clip.to_base64()).unwrap();
        assert_eq!(back, clip);
        assert!(!back.is_empty());
    }

    #[test]
    fn decodes_the_same_number_of_samples() {
        let pcm = tone(500);
        let packets = encode(&pcm, &mut encoder().unwrap()).unwrap();
        let decoded = decode(&packets).unwrap();
        assert_eq!(decoded.len(), pcm.len());
    }

    #[test]
    fn peaks_follow_loudness() {
        let mut pcm = tone(1000);
        let half = pcm.len() / 2;
        pcm[..half].fill(0);
        let bars = peaks(&pcm, 8);
        assert_eq!(bars.len(), 8);
        assert!(bars[..4].iter().all(|bar| *bar == 0));
        assert!(bars[4..].iter().all(|bar| *bar > 0));
    }

    /// Needs a microphone and the system's permission; run it by hand:
    /// `cargo test --bin atlas records_from_the_microphone -- --ignored`.
    #[test]
    #[ignore]
    fn records_from_the_microphone() {
        let recorder = Recorder::start().expect("microphone");
        std::thread::sleep(Duration::from_millis(1200));
        let level = recorder.level();
        let clip = recorder.stop().expect("clip");
        println!(
            "recorded {} ms in {} packets, level {level}, peaks {:?}",
            clip.duration_ms,
            clip.packets.len(),
            clip.peaks
        );
        assert!(clip.duration_ms >= 1000, "recorded {} ms", clip.duration_ms);
        assert!(!clip.packets.is_empty());
        assert_eq!(decode(&clip.packets).unwrap().len(), clip.packets.len() * FRAME_SAMPLES);
    }

    #[test]
    fn a_broken_blob_is_refused() {
        assert!(Clip::from_bytes(b"nope").is_err());
        assert!(Clip::from_bytes(
            &Clip {
                duration_ms: 0,
                peaks: vec![],
                packets: vec![],
            }
            .to_bytes()
        )
        .is_ok(), "an empty clip is valid");
        let mut bytes = Clip {
            duration_ms: 120,
            peaks: vec![1, 2],
            packets: vec![vec![1, 2, 3]],
        }
        .to_bytes();
        bytes.pop();
        assert!(Clip::from_bytes(&bytes).is_err(), "a cut packet is refused");
        assert!(Clip::from_base64("***").is_err());
    }
}
