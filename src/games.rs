use std::path::{Path, PathBuf};

/// Exes and shortcuts inside a dropped folder (a few levels deep), or the file
/// itself.
pub(crate) fn exes_in_paths(paths: &[std::path::PathBuf]) -> Vec<String> {
    let mut found = Vec::new();
    for path in paths {
        for game in exes_in(&path.to_string_lossy()) {
            if !found.contains(&game) {
                found.push(game);
            }
        }
    }
    found
}

pub(crate) fn exes_in(path: &str) -> Vec<String> {
    let path = Path::new(path.trim().trim_start_matches("file:"));
    if path.is_file() {
        return if is_game_file(path) {
            vec![path.display().to_string()]
        } else {
            Vec::new()
        };
    }
    let mut found = Vec::new();
    walk(path, 0, &mut found);
    // The launcher is usually closer to the chosen folder than the binaries
    // buried in `bin/`; keep that order when the list is shown.
    found.sort_by_key(|(depth, path)| (*depth, path.to_lowercase()));
    found.into_iter().map(|(_, path)| path).collect()
}

/// Directories that hold installers, crash handlers and redistributables rather
/// than the game executable.
const NOISE_DIRS: &[&str] = &[
    "__installer",
    "_commonredist",
    "redist",
    "redistributables",
    "directx",
    "dotnet",
    "vcredist",
    "installer",
    "support",
];

const MAX_DEPTH: usize = 3;
const MAX_FILES: usize = 40;

fn walk(directory: &Path, depth: usize, found: &mut Vec<(usize, String)>) {
    let Ok(entries) = std::fs::read_dir(directory) else {
        return;
    };
    let mut children: Vec<PathBuf> = entries.flatten().map(|entry| entry.path()).collect();
    children.sort();
    for child in &children {
        if child.is_file() && is_game_file(child) && is_launcher_candidate(child) {
            found.push((depth, child.display().to_string()));
            if found.len() >= MAX_FILES {
                return;
            }
        }
    }
    if depth >= MAX_DEPTH {
        return;
    }
    for child in &children {
        if !child.is_dir() || is_noise_dir(child) {
            continue;
        }
        walk(child, depth + 1, found);
        if found.len() >= MAX_FILES {
            return;
        }
    }
}

fn is_noise_dir(path: &Path) -> bool {
    let Some(name) = path.file_name().and_then(|name| name.to_str()) else {
        return false;
    };
    let name = name.to_lowercase();
    name.starts_with('.') || NOISE_DIRS.contains(&name.as_str())
}

fn is_game_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case("exe") || ext.eq_ignore_ascii_case("lnk"))
}

/// Uninstallers, crash reporters and setup helpers are never what launches a
/// game.
fn is_launcher_candidate(path: &Path) -> bool {
    let Some(stem) = path.file_stem().and_then(|stem| stem.to_str()) else {
        return false;
    };
    let stem = stem.to_lowercase();
    !(stem.starts_with("unins")
        || stem.contains("uninstall")
        || stem.starts_with("setup")
        || stem.contains("crashreport")
        || stem.contains("crashpad")
        || stem == "dxsetup"
        || stem == "vcredist_x64"
        || stem == "vcredist_x86")
}

#[cfg(test)]
mod tests {
    use super::{exes_in, exes_in_paths};

    fn temp_dir() -> std::path::PathBuf {
        std::env::temp_dir().join(format!("atlas-games-{}", uuid::Uuid::new_v4()))
    }

    #[test]
    fn a_folder_lists_only_exe_and_shortcuts() {
        let root = temp_dir();
        std::fs::create_dir_all(&root).unwrap();
        std::fs::write(root.join("Hades.exe"), b"").unwrap();
        std::fs::write(root.join("readme.txt"), b"").unwrap();
        let found = exes_in(&root.display().to_string());
        assert_eq!(found.len(), 1);
        assert!(found[0].ends_with("Hades.exe"));
        std::fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn nested_binaries_are_found_below_the_chosen_folder() {
        let root = temp_dir();
        std::fs::create_dir_all(root.join("bin").join("win64")).unwrap();
        std::fs::create_dir_all(root.join("_CommonRedist")).unwrap();
        std::fs::write(root.join("Launcher.exe"), b"").unwrap();
        std::fs::write(root.join("bin").join("win64").join("Game.exe"), b"").unwrap();
        std::fs::write(root.join("_CommonRedist").join("Setup.exe"), b"").unwrap();
        std::fs::write(root.join("unins000.exe"), b"").unwrap();
        let found = exes_in(&root.display().to_string());
        assert_eq!(found.len(), 2);
        assert!(found[0].ends_with("Launcher.exe"));
        assert!(found[1].ends_with("Game.exe"));
        std::fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn selected_folders_are_combined_without_duplicates() {
        let root = temp_dir();
        std::fs::create_dir_all(&root).unwrap();
        std::fs::write(root.join("Hades.exe"), b"").unwrap();
        let found = exes_in_paths(&[root.clone(), root.clone()]);
        assert_eq!(found.len(), 1);
        assert!(found[0].ends_with("Hades.exe"));
        std::fs::remove_dir_all(&root).ok();
    }
}
