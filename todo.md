# Atlas todo

## Расшифровка голосовых записей

Цель: превращать запись в текст. Локальная модель уже есть в движке, отдельный
сервис не нужен.

### Что уже готово в движке

- Операция `speech.transcribe` в `cortex/runtime/crates/engine-dictation/src/host_capture.rs`.
- Локальные движки: whisper.cpp (sidecar или прямой запуск) и Parakeet ONNX.
- `list_local_models` отдаёт список моделей, `local_status` — прогретость.
- Параметр `delivery: "text_only"` возвращает текст в ответе и не вставляет его
  в активное окно. Это главное: `input.insert_text` нам не нужен.

Ответ на успех:

```json
{"uuid": "...", "text": "расшифровка", "state": "idle", "injected": false}
```

### Что нужно сделать в Atlas

1. `src/audio.rs`: добавить `Clip::to_wav()`. Движок ждёт WAV в base64, а мы
   храним Opus в контейнере `AO1`. Декодер `audiopus` уже есть.
2. `src/store/`: метод `Engine::speech_transcribe(wav_b64, duration_sec)`,
   вызов через общий `rpc("speech.transcribe", …)`.
3. `src/nsh_bridge.rs`: команда `voice.transcribe`, событие `voiceTranscribed`
   с текстом и `voiceFailed` при ошибке.
4. `ui/JournalPage.tsx`: кнопка «Расшифровать» на плашке голоса.
5. Проверка готовности: `list_local_models` до показа кнопки. Если модели нет,
   кнопку не показывать. Движок в этом случае отвечает
   `LOCAL_MODEL_NOT_READY_MSG`.

### Открытые вопросы

- Расшифровывать сразу после записи или по кнопке?
- Куда класть текст: заменить содержимое записи или положить подписью под
  плашкой?
- Что делать с ошибкой сети и очереди: движок держит `pending` на диске и умеет
  `retry`.

## Поиск по записям

Поле поиска в боковой панели. Пока не делаем.
