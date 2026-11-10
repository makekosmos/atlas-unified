# AGENTS.md — Atlas

Atlas desktop app на GPUI и NSH (задачи и календарь) для Mundus. История репозитория — `atlas-unified`, один бинарный
крейт `atlas` (публикация релизов отключена до отдельного решения). Главная платформа — Windows; Linux и macOS собираются и
проверяются в CI. Приложение ставится Engine из GitHub Releases этого репо.

## Карта

- `HANDOFF.md` — незавершённая работа по играм: что сделано, известные
  проблемы, чеклист. Читать первым, если задача про игры.
- `src/main.rs`, `src/app.rs`, `src/app/` — оболочка приложения и окна.
- `src/pages/` — экраны; `src/widgets.rs`, `src/chrome.rs`, `src/text_field.rs` —
  общий UI.
- `src/model/`, `src/store/` — состояние и транспорт к Engine
  (`src/store/transport.rs`: читает `engine.lock.json`, шлёт `POST /v1/rpc`).
- `src/theme.rs`, `src/palettes.rs`, `src/appearance/` — тема; общее визуальное
  ядро лежит в `imago-gpui` (репозиторий `makekosmos/imago`).
- `src/*_tests.rs` — тесты `#[gpui::test]` (UI, a11y, регрессии);
  `snapshots/` — эталон дерева доступности; `fixtures/engine/` — стенд
  контракта Engine.
- `src/bin/check-source-size.rs` — гейт размера файлов; `windows/`, `build.rs` —
  иконка, манифест, VERSIONINFO.

## Границы

- Все данные идут через операции Engine. Приложение никогда не открывает
  SQLite само (`cortex/docs/write-boundary.md`) и не хранит копию задач.
- Engine ищется по `engine.lock.json`; порядок кандидатов: `MUNDUS_DATA_DIR`,
  `KOSMOS_DATA_DIR`, `<config>/Mundus`, `<config>/Kosmos` — побеждает первая
  папка с lock-файлом (`src/store/transport.rs`, `src/brand.rs`). Старые
  `KOSMOS_*`/`Kosmos` — переходный запас под `MIGRATION(KOS-267)`.
- Переменные окружения для разработки: `ATLAS_DEMO=1` (демо без Engine,
  ничего не сохраняется), `ATLAS_DEVTASKS=N`, `ATLAS_ROUTE`,
  `ATLAS_OVERLAY`, `ATLAS_FPS`, `ATLAS_VSYNC`, `ATLAS_OFFSCREEN`,
  `ATLAS_EMIT_FIXTURES`. Без Engine и без `ATLAS_DEMO` приложение показывает
  ошибку подключения, а не тестовые карточки.

## Запуск

```text
cargo run                                   # против живого Engine
MUNDUS_DATA_DIR=<dir> cargo run             # другая папка данных
ATLAS_DEMO=1 cargo run                     # без Engine
pnpm demo                                  # демо + hot reload UI (nsh dev)
```

`pnpm demo` (`scripts/demo-dev.mjs`) поднимает `nsh dev --server-only` в `ui/`
на порту 8790, если порт свободен, и запускает Atlas с `ATLAS_DEMO=1` и
`ATLAS_NSH_DEV_SERVER`; выход из Atlas гасит сервер, поднятый скриптом.
Флаги: `--restart` (перезапустить dev-сервер), `--no-server` (сервер уже
поднят вручную), `--port N`, `--release`.
Логи: `.dev-logs/atlas-nsh-server.log`.

CLI `nsh` должен совпадать по версии с `nsh-base`, который линкует хост
(сейчас 0.4.0): старый CLI не знает компонентов вроде `RichEditor` и падает
на «`nsh/base` has no export». Скрипт берёт `~/.nsh-0.4.0/bin/nsh`, если он
есть, иначе `nsh` из `PATH`; путь можно задать через `NSH_BIN`.
`ATLAS_ROUTE=notes` открывает окно сразу на нужной странице.

Engine берётся из `makekosmos/cortex`: `pnpm run dev -- --engine-only` в корне
cortex (общая папка данных — `--data-dir DIR`, тот же `DIR` отдай приложению).
На Linux нужен `ld.lld` в `PATH` (`.cargo/config.toml`). Релизная сборка на
Windows требует `fxc.exe` из Windows SDK в `PATH` или `GPUI_FXC_PATH`:
шейдеры вшиваются при сборке.

## Экран человека

Рабочий стол, фокус, клавиатура и мышь принадлежат человеку. Агент их не
забирает: не активирует окна, не двигает курсор, не переключает Space.

- Демо для проверки: `pnpm demo --offscreen`. Окно уходит за край экрана
  (`ATLAS_OFFSCREEN=1`) и не берёт фокус, поэтому человек продолжает работу.
- Снимок окна: `pnpm shot /tmp/снимок.png`. Скрипт находит окно по имени
  процесса и снимает его через `screencapture -l`: снимок настоящий, даже
  если окно за другим окном или вне экрана.
- UI-тесты — headless (`nsh test`). `nsh test --target macos` поднимает окно
  на экране: без прямой просьбы человека его не запускать.
- Показать приложение человеку — только по его слову: `pnpm demo` без
  `--offscreen`.

Виртуальный дисплей штатными средствами macOS не создать: приватный
`CGVirtualDisplay` без нужных прав создаёт объект, но WindowServer его не
включает (проверено: `applySettings` вернул true, дисплея в
`CGGetActiveDisplayList` нет). Отдельный монитор возможен только через
сторонний драйвер вроде BetterDisplay, и это решение человека.

## Релизы

Версию бампает, тег ставит и релиз публикует только человек, и только когда
он об этом сказал. До этой команды агент делает ровно две вещи: коммит и
`git push`. Ни `gh workflow run build.yml`, ни `gh release create|upload`, ни
правка `version` в `Cargo.toml` — без явной команды.

Для проверки работы агент поднимает демо: `pnpm demo` (или `cargo run` с
`ATLAS_DEMO=1`). Это единственный запуск, который разрешён без спроса.

## Проверки

CI (`.github/workflows/build.yml`) запускается на каждый PR и на push в
`main`. На Windows, Linux и macOS: `cargo fmt --check`, `cargo test --release`
и release-сборка; clippy и гейт размера файлов — только на Windows; плюс
проверка правил версий (`python scripts/test_release.py`,
`scripts/test_release_notes.py`). `cargo shear` и `cargo deny` в CI не
запускаются, только локально через `hk`. Ночью (00:00 МСК = 21:00 UTC) тот же
workflow выпускает релиз, если исходники изменились.

Локальный гейт — `hk` (`hk.pkl`); pre-commit у него лёгкий (`cargo check` и
`cargo fmt --check`), полный гейт идёт на pre-push:

```text
cargo install hk --locked && hk install     # один раз на копию
hk run pre-push                             # или hk check --all
```

Гейт: `cargo nextest run --workspace --all-features`, `cargo shear`,
`cargo clippy --workspace --all-targets --all-features -- -D warnings`,
`cargo deny check advisories bans sources`, `check-source-size`.
`cargo-nextest`, `cargo-shear`, `cargo-deny` ставь через `cargo install`.
Не обходи хуки через `--no-verify`.

Снимок `snapshots/a11y-inbox.txt` — дерево Windows/Linux; на macOS тест
сравнивает с ним с поправкой на отсутствие кнопок окна. Меняя дерево
доступности, обнови снимок.

## Правила кода

- Мёртвый код удаляй сразу, вместе с тестами только на него. Не используй
  `#[allow(dead_code)]` и не добавляй `-A …` в clippy (`hk.pkl`, `build.yml`):
- Размер файла — не больше 300 строк (`src/bin/check-source-size.rs`);
  список `GRANDFATHERED` (`app.rs`, `chrome.rs`, `model.rs`, `pages.rs`) только
  сокращается: новый код клади в подмодули.
- `gpui` (псевдоним `gpui-kit`) и `gpui-component` закреплены точными
  версиями и должны совпадать с cortex/manager-gpui, memoria-gpui и dictation
  (там же закреплён и `gpui-base`; он здесь приходит транзитивно): две версии
  gpui в одной сборке — ошибка типов. Поднимай вместе. `imago-gpui` и
  `mundus-gpui-kit` закреплены по одному rev репозитория `makekosmos/imago`,
  `[patch.crates-io]` (`gpui-pre*`) — по другому; их меняют отдельно.
- В `[profile.release]` `debug-assertions` должен оставаться `false`:
  иначе gpui-pre-windows не скомпилирует шейдеры (комментарий в `Cargo.toml`).
- Цвета и шрифты — только через токены темы (`theme.rs`, `palettes.rs`).
  Сохраняй клавиатурный доступ, фокус и доступные имена элементов.
- Подписки, таймеры и слушатели снимай при уничтожении окна или view.
- Строки интерфейса — русские; смотри соседние экраны.

## Релиз

Release workflow оставляет сборку и CI включёнными. Публикация отключена до
отдельного решения; версию и тег вручную не меняй.
