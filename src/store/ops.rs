//! The Engine operation names this app calls. The wire vocabulary is
//! `section.verb` — Cortex `service/definitions/request.rs` is the authority,
//! and an operation missing here is one Atlas does not use.
//!
//! Keeping them in one list makes the contract reviewable and turns a typo in
//! a call site into a compile error instead of an `unknown operation`.

pub(super) const TYPES_REGISTER: &str = "types.register";

pub(super) const OBJECTS_LIST: &str = "objects.list";
pub(super) const OBJECTS_GET: &str = "objects.get";
pub(super) const OBJECTS_SNAPSHOT: &str = "objects.snapshot";
pub(super) const OBJECTS_UPSERT: &str = "objects.upsert";
pub(super) const OBJECTS_DELETE: &str = "objects.delete";

pub(super) const LINKS_LIST: &str = "links.list";
pub(super) const LINKS_REPLACE: &str = "links.replace";
pub(super) const LINKS_DELETE: &str = "links.delete";
