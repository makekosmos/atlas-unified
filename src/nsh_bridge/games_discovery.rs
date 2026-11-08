use std::collections::HashSet;

use serde_json::{json, Value};

use crate::store::Engine;

const PROVIDERS: [(&str, &str); 3] = [("steam", "Steam"), ("epic", "Epic Games"), ("gog", "GOG")];

pub(super) fn run(engine: &Engine, emit: &impl Fn(&str, Value)) {
    let mut candidates = Vec::new();
    let mut errors = Vec::new();
    let mut seen = HashSet::new();
    let mut fatal = false;
    for (index, (provider, label)) in PROVIDERS.into_iter().enumerate() {
        emit(
            "discovered",
            json!({"progress":{"provider":provider,"phase":"scanning","completed":index,"total":PROVIDERS.len(),"found":candidates.len()}}),
        );
        let mut provider_error = None;
        let mut legacy_aggregate = false;
        let mut aggregate_failed = false;
        let response = match engine.rpc("games.discover_installed", json!({"provider":provider})) {
            Ok(value) => Some(value),
            Err(error) if requires_legacy_fallback(&error.to_string()) => {
                legacy_aggregate = true;
                aggregate_failed = true;
                match engine.rpc("games.discover_installed", json!({})) {
                    Ok(value) => Some(value),
                    Err(fallback_error) => {
                        aggregate_failed = true;
                        provider_error = Some(fallback_error.to_string());
                        None
                    }
                }
            }
            Err(error) => {
                provider_error = Some(error.to_string());
                None
            }
        };
        let provider_found = response.map_or(0, |value| {
            let games = if let Some(games) = value.as_array() {
                legacy_aggregate = true;
                Some(games)
            } else if value.get("provider").and_then(Value::as_str) == Some(provider) {
                value.get("candidates").and_then(Value::as_array)
            } else {
                None
            };
            games.map_or_else(
                || {
                    provider_error = Some("Engine вернул неверный список игр".to_owned());
                    0
                },
                |games| append_candidates(games, &mut seen, &mut candidates),
            )
        });
        let phase = if let Some(message) = provider_error {
            errors.push(
                json!({"provider":if aggregate_failed {"Engine"} else {label},"message":message}),
            );
            "error"
        } else {
            "complete"
        };
        fatal |= aggregate_failed;
        emit(
            "discovered",
            json!({"progress":{"provider":if legacy_aggregate {"gog"} else {provider},"phase":phase,"completed":if legacy_aggregate {PROVIDERS.len()} else {index+1},"total":PROVIDERS.len(),"found":candidates.len(),"providerFound":provider_found,"aggregate":legacy_aggregate}}),
        );
        if legacy_aggregate {
            break;
        }
    }
    if errors.is_empty() {
        emit("discovered", json!(candidates));
    } else {
        emit(
            "discovered",
            json!({"candidates":candidates,"errors":errors,"fatal":fatal}),
        );
    }
}

fn append_candidates(
    games: &[Value],
    seen: &mut HashSet<String>,
    candidates: &mut Vec<Value>,
) -> usize {
    let before = candidates.len();
    for game in games {
        let Some(path) = game.get("exePath").and_then(Value::as_str) else {
            continue;
        };
        if !path.is_empty() && seen.insert(path.replace('/', "\\").to_lowercase()) {
            candidates.push(game.clone());
        }
    }
    candidates.len() - before
}

fn requires_legacy_fallback(error: &str) -> bool {
    error.to_ascii_lowercase().contains("invalid-request")
}

#[cfg(test)]
mod tests {
    use super::requires_legacy_fallback;

    #[test]
    fn uses_legacy_discovery_after_provider_parameters_are_rejected() {
        assert!(requires_legacy_fallback(
            "Unknown: games.discover_installed: invalid-request"
        ));
        assert!(!requires_legacy_fallback("transport: request timed out"));
    }
}
