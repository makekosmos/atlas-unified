# HANDOFF — игры в Atlas

Состояние на 04.11.2026, ~19:25. Задача: довести «Добавить игры» до рабочего
сценария (найти/просканировать/выбрать exe → подтверждение → запуск → время).
Ничего не закоммичено.

## 1. Что запущено (на момент передачи)

| процесс | pid | данные |
| --- | --- | --- |
| `atlas.exe` (nsh-хост) | 89168 (с 19:23, уже с фиксом диспетчера, см. §4.1) | `MUNDUS_DATA_DIR=.dev-data\mundus`, `ATLAS_NSH_DEV_SERVER=ws://127.0.0.1:8790/ws` |
| `nsh` dev-сервер | 118780 | `atlas-unified/ui`, порт 8790 |
| `mundus-engine` (dev) | 28096 | `.dev-data\mundus` |
| `manager-gpui` (dev) | 63600 | тот же data dir |
| `mundus-engine` (установленный) | 45652 / 98432 | `%APPDATA%\Mundus` — к нему Atlas НЕ подключён |

Логи: `.dev-logs/atlas-dev.log` (stderr Atlas, там `atlas:`-диагностика),
`.dev-logs/atlas-nsh-server.log` (сборки UI), `.dev-logs/atlas-life.log`
(trace окна), `.dev-logs/cortex-engine-core.log` (Engine).

## 2. Как поднять заново

```powershell
# 1. Engine + Manager на dev-данных (корень cortex)
cd C:\Users\kirill\Coding\kosmos-rs\cortex
$env:MUNDUS_DATA_DIR="C:\Users\kirill\Coding\kosmos-rs\.dev-data\mundus"
pnpm run dev            # или --engine-only

# 2. nsh-сервер
cd ..\atlas-unified\ui
nsh dev --server-only --port 8790 .

# 3. Atlas с hot reload
cd ..
$env:MUNDUS_DATA_DIR="C:\Users\kirill\Coding\kosmos-rs\.dev-data\mundus"
$env:ATLAS_NSH_DEV_SERVER='ws://127.0.0.1:8790/ws'
.\target\debug\atlas.exe *> ..\.dev-logs\atlas-dev.log
```

Сборка Rust (сломанные rustup-прокси + TEMP):

```powershell
$tc="$env:USERPROFILE\.rustup\toolchains\1.99.1-x86_64-pc-windows-msvc\bin"
$env:RUSTC="$tc\rustc.exe"; $env:RUSTDOC="$tc\rustdoc.exe"
$env:TEMP="C:\Users\kirill\Coding\kosmos-rs\.dev-tmp"; $env:TMP=$env:TEMP
& "$tc\cargo.exe" build --bin atlas *> ..\.dev-logs\build-atlas.log; Get-Content ..\.dev-logs\build-atlas.log -Tail 20
```

Проверки: `nsh check .` и `nsh test .` в `atlas-unified/ui` (30/31, известный
фейл — journal context menu / clipboard); Rust — `cargo test --bin atlas -- games::` (5/5).

## 3. Что уже сделано

UI (`atlas-unified/ui`):
- `modal.tsx` — общий `Modal`: scrim `absolute inset-0` с `onPress` (клик вне
  карточки закрывает), карточка 16px, hairline-бордер, заголовок 15/600,
  опциональные «Шаг назад»/«Закрыть карточку», слот `footer`.
- `games-add.tsx` — модалка «Добавить игры» без поиска и футера: 460px меню из
  трёх строк с иконками (Найти автоматически / Просканировать папку / Выбрать
  exe), затем карточка расширяется до 560px (`LayoutAnimation`) и показывает
  прогресс скана, а после него — стопку найденных игр по одной: «Добавить» /
  «Пропустить» (или свайп вправо/влево, `PanResponder` + transition на
  transform), в конце сводка «добавлено · пропущено». Пустой разбор (все
  найденные игры уже в библиотеке) и ошибка скана тоже остаются панелью
  результата (`reviewDone` в `game-library.ts`): модалка больше не схлопывается
  назад в меню после нажатия.
- `glyph.tsx` + `icons.ts` — иконки Hugeicons этого app: `prepare-assets.ps1`
  собирает их из `assets/icons/*.svg` в data-URI (`search`, `folder`, `file`,
  `check`, `close`); после добавления новой иконки скрипт надо перезапустить.
- `game-confirm.tsx` — второй шаг: правимое название, путь, источник, заметка
  про метаданные; «Назад» возвращает в пикер.
- `game-library.ts` — сигналы `pendingAdd`, `launchError`, `scanCompletedAt`,
  `beginConfirm`, `confirmAdd`, `receiveLaunch`, `guessTitle` (кэша прошлого
  поиска больше нет: модалка показывает только свежий скан). Стопка разбора
  найденного — там же: `deck`/`deckTotal`/`deckAdded`/`deckSkipped`,
  `decideDeck(accept)` (принятая карточка сразу уходит в Engine через
  `games.import`), `startDeck()` вызывается из `receiveDiscovery` по готовому
  скану.
- `games.tsx` — список с кнопкой «Запустить», строка ошибки запуска, модалка
  «Какой файл запускать» при нескольких exe, приём drop.
- `App.tsx` — события `launched`, сигнал `pickSource`, проброс `onLaunch`.

Rust (`atlas-unified/src`):
- `nsh_bridge/games.rs` — команды `games.pick`, `games.browse`,
  `games.browse-folder`, `games.launch`, `games.clear-pick`, диагностика
  `eprintln!("atlas: …")`.
- `nsh_bridge/games_worker.rs` — `Request::Launch` → spawn exe с
  `current_dir(parent)`, событие `launched {ok,path,error}`.
- `nsh_bridge/games_discovery.rs` — `games.discover_installed` (Steam/Epic/GOG).
- `games.rs` — рекурсивный `exes_in` (глубина ≤3, ≤40 файлов, отсев
  installer/redist/unins/setup/crashpad), 3 юнит-теста.

## 4. Проблемы

### 4.1 «Просканировать папку» — корень найден и исправлен (проверить)

**Причина:** диспетчер команд в `src/nsh_bridge.rs` (match по имени команды,
ветка `"games.pick" | "games.browse" | … => self.games.command(...)`) не
содержал `games.browse-folder` — сообщение падало в `_ => {}` и молча
игнорировалось. В `games.rs` обработчик был, поэтому ноль диагностики в логе.

**То же касалось `games.launch`** — кнопка «Запустить» тоже никогда не доходила
до Rust (см. 4.2).

Исправлено: в ветку добавлены `"games.browse-folder"` и `"games.launch"`.
Бинарь собран (`cargo build --bin atlas`, 1m 02s) и Atlas перезапущен
19:23. Вживую ещё не нажимали. Если после клика папка не открывается —
смотреть `.dev-logs/atlas-dev.log`: должно появиться
`atlas: games.browse-folder asked` и `atlas: opening the folder prompt`.
Возможные следующие причины (если строки есть, а окна нет):
- `pick_paths(cx, true, …)` вызывается из `setTimeout(run, 0)` (в
  `games-add.tsx` `runAfterPress`) — проверить, что контекст компонента жив;
- `cx.prompt_for_paths` с `directories: true` на Windows: проверить, что
  `PathPromptOptions{files:false, directories:true}` открывает выбор папки, а не
  файла;
- после выбора папки воркер шлёт `Request::PickPath`, на >1 exe UI показывает
  модалку «Какой файл запускать».

### 4.2 Запуск игры

Та же причина (диспетчер) — до фикса кнопка «Запустить» не работала вообще.
После пересборки проверить: процесс игры стартует, при ошибке в списке
появляется `launchError`. Ничего не проверено вживую.

### 4.3 Время игр всегда «Время ещё не посчитано»

`games.tsx` берёт время из события `usage` (`ProgramUsage.foregroundMs`,
`livePrograms`), т.е. из учёта программ Engine; сопоставление по пути exe или
имени процесса (`usageFor`). На dev-данных учёта нет вообще (свежая БД), плюс
неясно, видит ли Engine процесс игры сразу после spawn. Варианты: (а) ждать
закрытия игры и проверять, что Engine записал usage; (б) если не пишет —
считать время локально в воркере (таймер от spawn до выхода процесса) и
показывать его, а Engine-usage оставить источником, когда есть.

### 4.4 Метаданные игры

Реализован Engine RPC `games.metadata.resolve` без обязательных ключей:
Steam ID-first и поиск, затем настроенный порядок GOG/Epic/Lutris; результат и
горизонтальные изображения кэшируются в `<data_dir>/games/metadata`, TTL и
порядок источников берутся из `<data_dir>/game-metadata.json` (создаётся при
первом запросе). Atlas создаёт запись игры сразу, затем обогащает её в фоновом
потоке; при неоднозначном совпадении предлагает варианты с картинками. В окне
игры можно вставить URL/путь собственной горизонтальной картинки. Нет матча —
UI показывает локально сгенерированный SVG-плейсхолдер.

RAWG и его поле ключа удалены. Проверки: Engine metadata — 3/3, Atlas game
bridge — 7/7, `nsh check .` и `check-source-size` проходят; `nsh test .` —
33/34 (единственный сбой — известный `App.test.tsx:156`, clipboard/context-menu
тест дневника). Обновлённые Engine, NSH dev server и Atlas запущены. UI
мышью не тестировался без согласия. Реальный внешний lookup вручную не запускался;
Steam/GOG/Epic/Lutris — публичные внешние источники, ответы могут меняться.

### 4.5 Паника a11y

В `.dev-logs/atlas-life.log` дважды:

```
panic panicked at accesskit_consumer-0.38.0/src/tree.rs:225:
TreeUpdate includes duplicate child #6019029188407155883
```

Поймано около 19:0x при работе с играми. Причина — дублирующиеся id в дереве
доступности (вероятно, два элемента с одинаковым id в модалках: одинаковые
`Row`/`SharedButton` в списке, либо два `Modal` одновременно). Не
расследовано; если модалки начнут «пропадать» или приложение падать — начинать
отсюда. Воспроизведение: открыть «Добавить игры», потыкать действия, смотреть
хвост `atlas-life.log`. После переделки модалки (меню → скан → карточки)
вручную не воспроизводилось, но 04.11 ~20:06 паника появилась снова
(`#1628498226191068164`), и тот инстанс `atlas.exe` уже не отвечал. Не
исключено, что её сбивает HMR-обновление модалки, а не сама разметка.

### 4.6 Dev Engine и игры

`games.discover_installed` работает, потому что оно в самом Engine и
ограничено клиентом `atlas-gpui`. Остальные `games.*`/`arrancador.*`
делегируются пакетному воркеру Arcadia, которого в `.dev-data\mundus` нет.
Если понадобится импорт/карточки через Arcadia — ставить пакет в dev-данные
или гонять против установленного Engine (но у него нет `discover_installed` в
0.10.23).

### 4.7 Незакоммиченное дерево

```
M  Cargo.lock Cargo.toml src/games.rs src/nsh_bridge.rs src/nsh_bridge/macos.rs
M  src/nsh_bridge/macos/actions.rs ui/App.tsx ui/chrome.tsx ui/games.test.tsx ui/games.tsx
?? src/nsh_bridge/games.rs src/nsh_bridge/games_discovery.rs src/nsh_bridge/games_worker.rs
?? ui/modal.tsx ui/games-add.tsx ui/game-confirm.tsx ui/game-library.ts
```

`ui/bundle.js` — собранный nsh-сервером файл, руками не править.

## 5. Ловушки, на которые уже наступали

- **nsh-дев перезагружает только UI.** Команды моста — Rust в `atlas.exe`
  (`src/nsh_bridge.rs` и `src/nsh_bridge/*.rs`): их правка требует
  `cargo build --bin atlas` (~1 мин) и перезапуска приложения; пока exe
  запущен, линкер не может его заменить (`error: failed to remove file`).
- Новая команда в `games.rs` бесполезна, пока её имя не добавлено в
  `match`-диспетчер в `src/nsh_bridge.rs`: иначе `_ => {}` молча её глотает,
  без ошибки и без диагностики. Именно так «Просканировать папку» и
  «Запустить» не работали.
- HMR не переживает правки модулей: после изменений в TSX хост молча умирает
  (exit 1, ошибка про `hot-N.js`) — перезапустить `nsh dev` и `atlas.exe`.
- Футер модалки — ровно один ряд. `w-full`, спейсер или подсказка `Text` рядом
  выбивают последнюю кнопку из дерева доступности.
- Backdrop модалки — сосед карточки, а не её предок; иначе нажатия внутри
  карточки закрывают окно.
- Процессы сессии не пишут в `%APPDATA%\Mundus` — только `.dev-data\mundus`.
- `cargo fmt`/`rustfmt` тут висят; пропускать.
- Не гонять UI мышью без согласия пользователя.
- nsh реактивен как Solid: тело компонента выполняется один раз, поэтому
  сигналы читать только внутри JSX (атрибут/потомок) — значение, снятое в теле
  в `const`, замирает на моменте монтирования.
- Ширина — это кадр, а не style: `transition` её не анимирует. Расширение
  модалки делает `LayoutAnimation.configureNext(LayoutAnimation.create(...))`
  перед сменой состояния (`resize()` в `games-add.tsx`); transform/opacity
  анимируются и обычным `transitionProperty`.

## 6. Чеклист следующего шага

1. Пересобрать `atlas.exe`, перезапустить Atlas (env см. §2).
2. «+» → «Просканировать папку»: появляется нативный выбор папки; в
   `.dev-logs/atlas-dev.log` строка `atlas: games.browse-folder asked`.
3. Выбрать папку с игрой → выбрать exe (если несколько) → экран подтверждения
   с названием и путём → «Добавить» → карточка в списке.
4. «+» → «Найти автоматически»: модалка расширяется, идёт прогресс по
   Steam/Epic/GOG, затем карточки найденного по одной («Добавить»/«Пропустить»,
   свайп) и сводка. Проверить на живом Engine: игры реально добавляются.
5. «Запустить» → процесс игры стартует; ошибка показывается строкой над списком.
6. Закрыть игру, посмотреть, появилось ли время (см. 4.3).
7. `nsh check .`, `nsh test .`, `cargo test --bin atlas -- games::`.
