---
title: "Voice mode"
section: "Voice mode"
sectionOrder: 130
order: 1
slug: "voice-mode"
---

# DOC-013: Голосовой режим (Voice Mode)

## Источник
- https://hermes-agent.nousresearch.com/docs/user-guide/features/voice-mode

---

## 1. Обзор

| Функция | Платформа | Описание |
|---------|-----------|----------|
| **Interactive Voice** | CLI | Нажмите Ctrl+B для записи, агент автоматически определяет тишину и отвечает |
| **Auto Voice Reply** | Telegram, Discord | Агент отправляет голосовые аудио-ответы вместе с текстом |
| **Voice Channel** | Discord | Бот присоединяется к VC, слушает пользователей, озвучивает ответы |

---

## 2. Предварительные требования

### Python пакеты:

```bash
# CLI голосовой режим (микрофон + воспроизведение)
cd ~/.hermes/hermes-agent && uv pip install -e ".[voice]"

# Discord + Telegram (включая discord.py[voice] для VC)
cd ~/.hermes/hermes-agent && uv pip install -e ".[messaging]"

# Премиум TTS (ElevenLabs)
cd ~/.hermes/hermes-agent && uv pip install -e ".[tts-premium]"

# Локальный TTS (NeuTTS, опционально)
python -m pip install -U neutts[all]

# Всё сразу
cd ~/.hermes/hermes-agent && uv pip install -e ".[all]"
```

| Extra | Пакеты | Для чего |
|-------|--------|----------|
| `voice` | `sounddevice`, `numpy` | CLI голосовой режим |
| `messaging` | `discord.py[voice]`, `python-telegram-bot`, `aiohttp` | Боты Discord и Telegram |
| `tts-premium` | `elevenlabs` | ElevenLabs TTS |

### Системные зависимости:

```bash
# macOS
brew install portaudio ffmpeg opus
brew install espeak-ng   # для NeuTTS

# Ubuntu/Debian
sudo apt install portaudio19-dev ffmpeg libopus0
sudo apt install espeak-ng   # для NeuTTS
```

| Зависимость | Назначение | Для чего |
|-------------|------------|----------|
| **PortAudio** | Ввод с микрофона и воспроизведение | CLI голосовой режим |
| **ffmpeg** | Конвертация аудио форматов | Все платформы |
| **Opus** | Кодек Discord voice | Голосовые каналы Discord |
| **espeak-ng** | Фонемизатор | Локальный NeuTTS |

### API ключи (добавить в `~/.hermes/.env`):

```bash
# Speech-to-Text — локальный провайдер не требует ключа!
# pip install faster-whisper          # Бесплатно, локально, рекомендуется
GROQ_API_KEY=your-key                 # Groq Whisper — быстрый, бесплатный тариф
VOICE_TOOLS_OPENAI_KEY=your-key       # OpenAI Whisper — платный

# Text-to-Speech (опционально — Edge TTS и NeuTTS работают без ключа)
ELEVENLABS_API_KEY=***           # ElevenLabs — премиум качество
```

**Совет:** Если `faster-whisper` установлен, голосовой режим работает **без API ключей** для STT. Модель (~150 MB) скачивается автоматически.

---

## 3. CLI голосовой режим

### Быстрый старт:

```powershell
hermes                # Запуск интерактивного CLI
```

Затем в CLI:

```
/voice          Включение/выключение голосового режима
/voice on       Включение голосового режима
/voice off      Выключение голосового режима
/voice tts      Включение TTS вывода
/voice status   Показать текущее состояние
```

### Как работает:

1. Запустите CLI с `hermes` и включите голосовой режим через `/voice on`
2. **Нажмите Ctrl+B** — раздаётся сигнал (880Hz), начинается запись
3. **Говорите** — индикатор уровня показывает ввод: `● [___-------] >`
4. **Перестаньте говорить** — через 3 секунды тишины запись автоматически останавливается
5. Раздаются **два сигнала** (660Hz), подтверждающие окончание записи
6. Аудио транскрибируется через Whisper и отправляется агенту
7. Если TTS включён, ответ агента озвучивается
8. Запись **автоматически возобновляется** — говорите снова без нажатия клавиш

### Детекция тишины:

Двухстадийный алгоритм:
1. **Подтверждение речи** — ожидание аудио выше порога RMS (200) минимум 0.3с
2. **Детекция окончания** — после подтверждения речи, срабатывает через 3.0 секунды непрерывной тишины

Настройки в `config.yaml`:
```yaml
voice:
  record_key: "ctrl+b"
  silence_threshold: 200
  silence_duration: 3.0
  beep_enabled: true
```

### Streaming TTS:

При включённом TTS агент произносит ответ **предложение за предложением** по мере генерации текста:
- Буферизует текст до полных предложений (мин. 20 символов)
- Удаляет markdown форматирование и блоки `<think>`
- Генерирует и воспроизводит аудио в реальном времени

### Фильтр галлюцинаций:

Whisper иногда генерирует фантомный текст из тишины ("Thank you for watching", "Subscribe" и т.д.). Агент фильтрует их по набору из 26 известных фраз-галлюцинаций.

---

## 4. Gateway голосовые ответы (Telegram и Discord)

### Команды (работают в Telegram и Discord):

```
/voice          Включение/выключение голосовых ответов
/voice on       Голосовые ответы только на голосовые сообщения
/voice tts      Голосовые ответы на ВСЕ сообщения
/voice off      Выключение голосовых ответов
/voice status   Показать текущую настройку
```

### Режимы:

| Режим | Команда | Поведение |
|-------|---------|-----------|
| `off` | `/voice off` | Только текст (по умолчанию) |
| `voice_only` | `/voice on` | Озвучивает ответ только на голосовое сообщение |
| `all` | `/voice tts` | Озвучивает ответ на каждое сообщение |

### Доставка по платформам:

| Платформа | Формат | Примечания |
|-----------|--------|------------|
| **Telegram** | Голосовой пузырь (Opus/OGG) | Воспроизводится инлайн в чате |
| **Discord** | Нативный голосовой пузырь (Opus/OGG) | Воспроизводится как голосовое сообщение пользователя |

---

## 5. Голосовые каналы Discord

### Настройка:

#### 1. Права Discord бота:

В [Discord Developer Portal](https://discord.com/developers/applications) добавьте права:

| Право | Назначение | Обязательно |
|-------|------------|-------------|
| **Connect** | Подключение к голосовым каналам | Да |
| **Speak** | Воспроизведение TTS в голосовых каналах | Да |
| **Use Voice Activity** | Детекция когда пользователи говорят | Рекомендуется |

**Обновлённый integer прав:** `274881432640`

#### 2. Привилегированные намерения (Privileged Gateway Intents):

Включите все три:
- **Presence Intent**
- **Server Members Intent**
- **Message Content Intent** (обязательно)

#### 3. Кодек Opus:

```bash
# macOS
brew install opus

# Ubuntu/Debian
sudo apt install libopus0
```

### Команды (в текстовом канале Discord):

```
/voice join      Бот присоединяется к текущему голосовому каналу
/voice channel   Алиас для /voice join
/voice leave     Бот отключается от голосового канала
/voice status    Показать голосовой режим и подключённый канал
```

### Как работает:

1. **Слушает** аудио поток каждого пользователя независимо
2. **Детектирует тишину** — 1.5с тишины после минимум 0.5с речи
3. **Транскрибирует** аудио через Whisper STT
4. **Обрабатывает** через полный пайплайн агента
5. **Озвучивает** ответ обратно в голосовом канале

### Защита от эха:

Бот автоматически приостанавливает прослушивание во время воспроизведения TTS ответа.

### Управление доступом:

Только пользователи из `DISCORD_ALLOWED_USERS` могут взаимодействовать через голос.

---

## 6. Конфигурация

### config.yaml:

```yaml
# Запись голоса (CLI)
voice:
  record_key: "ctrl+b"
  max_recording_seconds: 120
  auto_tts: false
  beep_enabled: true
  silence_threshold: 200
  silence_duration: 3.0

# Speech-to-Text
stt:
  enabled: true
  provider: "local"              # "local" (бесплатно) | "groq" | "openai" | "mistral" | "xai"
  local:
    model: "base"                # tiny, base, small, medium, large-v3

# Text-to-Speech
tts:
  provider: "edge"               # "edge" (бесплатно) | "elevenlabs" | "openai" | "neutts"
  edge:
    voice: "en-US-AriaNeural"    # 322 голоса, 74 языка
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"
```

### Переменные окружения:

```bash
# STT провайдеры (локальный не требует ключа)
GROQ_API_KEY=...
VOICE_TOOLS_OPENAI_KEY=...

# TTS провайдеры (Edge TTS и NeuTTS не требуют ключа)
ELEVENLABS_API_KEY=***
```

---

## 7. Сравнение STT провайдеров

| Провайдер | Модель | Скорость | Качество | Стоимость | Ключ |
|-----------|--------|----------|----------|-----------|------|
| **Local** | `base` | Зависит от CPU/GPU | Хорошее | Бесплатно | Нет |
| **Local** | `small` | Средняя | Лучше | Бесплатно | Нет |
| **Local** | `large-v3` | Медленная | Лучшее | Бесплатно | Нет |
| **Groq** | `whisper-large-v3-turbo` | Очень быстрая (~0.5с) | Хорошее | Бесплатный тариф | Да |
| **Groq** | `whisper-large-v3` | Быстрая (~1с) | Лучше | Бесплатный тариф | Да |
| **OpenAI** | `whisper-1` | Быстрая (~1с) | Хорошее | Платный | Да |
| **OpenAI** | `gpt-4o-transcribe` | Средняя (~2с) | Лучшее | Платный | Да |
| **Mistral** | `voxtral-mini-latest` | Быстрая | Хорошее | Платный | Да |
| **xAI** | `grok-stt` | Быстрая | Хорошее | Платный | Да |

**Приоритет (автоматический fallback):** local > groq > openai

---

## 8. Сравнение TTS провайдеров

| Провайдер | Качество | Стоимость | Задержка | Ключ нужен |
|-----------|----------|-----------|---------|------------|
| **Edge TTS** | Хорошее | Бесплатно | ~1с | Нет |
| **ElevenLabs** | Отличное | Платный | ~2с | Да |
| **OpenAI TTS** | Хорошее | Платный | ~1.5с | Да |
| **NeuTTS** | Хорошее | Бесплатно | Зависит от CPU/GPU | Нет |

---

## 9. Устранение неполадок

### "No audio device found" (CLI):

PortAudio не установлен:
```bash
brew install portaudio          # macOS
sudo apt install portaudio19-dev  # Ubuntu
```

### Бот не отвечает в каналах Discord:

Бот требует @упоминания по умолчанию. Убедитесь что:
1. Выберите **пользователя бота**, а не роль
2. Используйте DM — упоминание не нужно
3. Или установите `DISCORD_REQUIRE_MENTION=false` в `.env`

### Бот присоединяется к VC, но не слышит:

- Проверьте что ваш ID есть в `DISCORD_ALLOWED_USERS`
- Убедитесь что вы не замьючены в Discord

### Бот слышит, но не отвечает:

- Проверьте доступность STT: установите `faster-whisper` или настройте `GROQ_API_KEY`
- Проверьте настройку LLM модели
- Просмотрите логи: `tail -f ~/.hermes/logs/gateway.log`

### Whisper возвращает мусорный текст:

Фильтр галлюцинаций ловит большинство случаев. Если всё ещё получаете фантомные транскрипции:
- Используйте более тихую обстановку
- Настройте `silence_threshold` (выше = менее чувствительно)
- Попробуйте другую STT модель
