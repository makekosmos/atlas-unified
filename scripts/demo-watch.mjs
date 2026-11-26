// Что изменилось в исходниках Atlas — для `pnpm demo --watch`.
//
// Следим только за тем, что вшивается в бинарник: `src/`, `assets/`
// (`include_bytes!`), `windows/` (манифест и иконка), `build.rs` и манифесты
// cargo. Каталог `ui/` не трогаем: его пересобирает nsh dev-сервер, и
// перезапуск окна на каждую правку только мешал бы hot reload.
// `target/` и `.dev-logs/` вне списка — смотреть за ними незачем.

import { watch } from "node:fs";
import { join } from "node:path";

const roots = ["src", "assets", "windows"];
const files = ["build.rs", "Cargo.toml", "Cargo.lock"];

/// Calls `onChange` once per burst of edits. Returns a closer.
export function watchSources(root, onChange) {
  const watchers = [];
  let timer = null;
  const touched = (name) => {
    // Правка — это несколько событий, а сохранение через временный файл даёт
    // ещё пачку (`.#name`, `name~`, `name.tmp`). Ждём, пока всё стихнет.
    if (name && /(^|[\\/])(\.#|.*~$|.*\.tmp$)/.test(name)) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      onChange();
    }, 400);
  };
  for (const directory of roots) {
    try {
      watchers.push(
        watch(join(root, directory), { recursive: true }, (_, name) =>
          touched(name),
        ),
      );
    } catch {
      /* каталога может не быть: сборке он не нужен */
    }
  }
  for (const file of files) {
    try {
      watchers.push(watch(join(root, file), () => touched(file)));
    } catch {
      /* без правки манифеста следить не за чем */
    }
  }
  return () => {
    if (timer) clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
  };
}
