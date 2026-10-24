//! core.task 0.1.0 mapping (KOS-397): `read` turns an Engine object into a
//! `Todo`; Atlas-only fields stay in extensions.
mod read;
mod write;

pub use read::read;
pub use write::write_at;

/// core.task 0.1.0: the Engine's task contract. Atlas-specific metadata stays
/// in `extensions`.
pub const TASK_TYPE: &str = "core.task";
pub const TASK_VERSION: &str = "0.1.0";
