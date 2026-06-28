---
title: "Nous Portal — Единая подписка для Hermes Agent"
section: "Nous Portal"
sectionOrder: 60
order: 1
slug: "nous-portal"
---

# Nous Portal — Единая подписка для Hermes Agent

**Версия документа:** 1.0
**Дата:** 2026-06-28
**Источник:** https://hermes-agent.nousresearch.com/docs/integrations/nous-portal

---

## 1. Обзор

[Nous Portal](https://portal.nousresearch.com) — рекомендуемый способ запуска Hermes Agent. Один OAuth заменяет отдельные аккаунты и API ключи для всех моделей, поиска, генерации изображений и TTS.

**Быстрый старт:**
```powershell
hermes setup --portal
```

---

## 2. Что входит в подписку

### 2.1. 300+ моделей, один счёт

| Семейство | Модели |
|---|---|
| **Anthropic Claude** | Opus 4.7, Opus 4.6, Sonnet 4.6, Haiku 4.5 |
| **OpenAI** | GPT-5.5, GPT-5.5 Pro, GPT-5.4 Mini, GPT-5.4 Nano, GPT-5.3 Codex |
| **Google Gemini** | Gemini 3 Pro Preview, Gemini 3 Flash Preview, Gemini 3.1 Pro Preview |
| **DeepSeek** | DeepSeek V4 Pro |
| **Qwen** | Qwen3.7-Max, Qwen3.6-35B-A3B |
| **xAI** | Grok 4.3 |
| **NVIDIA** | Nemotron-3 Super 120B-A12B |
| **Hermes** | Hermes-4-70B, Hermes-4-405B (для чата, не для агента) |

**Важно:** Hermes 4 — это модели для чата/рассуждений, НЕ для tool-calling. Для агента используйте agentic модели.

### 2.2. Nous Tool Gateway

| Инструмент | Партнёр | Описание |
|---|---|---|
| Web search & extract | Firecrawl | Поиск и извлечение страниц |
| Image generation | FAL | 9 моделей: FLUX 2, GPT Image, Ideogram V3... |
| Text-to-speech | OpenAI TTS | Голосовой режим |
| Cloud browser | Browser Use | Headless Chromium |
| Cloud terminal | Modal | Serverless sandbox |

**Без портала:** 5 отдельных аккаунтов, 5 разных API ключей.
**С порталом:** Одна подписка, всё включено.

### 2.3. Nous Chat

[chat.nousresearch.com](https://chat.nousresearch.com) — веб-интерфейс с тем же каталогом моделей.

---

## 3. Настройка

### 3.1. Новая установка

```powershell
hermes setup --portal
```

Что происходит:
1. Открывается браузер для OAuth входа
2. Refresh token сохраняется в `~/.hermes/auth.json`
3. Выбор модели из каталога
4. Nous как провайдер в `config.yaml`
5. Tool Gateway включается

### 3.2. Добавление к существующей установке

```powershell
hermes model
# Выбрать "Nous Portal" из списка провайдеров
# Браузер откроется, войдите
```

Portal станет ещё одним провайдером, не заменит существующие.

### 3.3. Headless / SSH

Для удалённых хостов:
```bash
ssh -L 8080:localhost:8080 user@host
# Затем hermes setup --portal
```

---

## 4. Ежедневное использование

### 4.1. Проверка статуса

```powershell
hermes portal info     # Статус входа, модель, gateway
hermes portal tools    # Каталог Tool Gateway
hermes portal open     # Открыть страницу подписки
```

### 4.2. Переключение моделей

Внутри сессии:
```
/model anthropic/claude-sonnet-4.6
/model openai/gpt-5.5-pro
/model google/gemini-3-pro-preview
```

### 4.3. Смешивание gateway с собственными бэкендами

```powershell
hermes tools
# Web search       → "Nous Subscription"
# Image generation → "Nous Subscription"
# Browser          → "Browserbase" (ваш аккаунт)
# TTS              → "Nous Subscription"
```

Tool Gateway включается per-tool, не обязательно всё сразу.

---

## 5. Конфигурация

### 5.1. После `hermes setup --portal`

```yaml
# config.yaml
model:
  provider: nous
  default: anthropic/claude-sonnet-4.6
  base_url: https://inference-api.nousresearch.com/v1

web:
  backend: nous

image_gen:
  provider: nous

tts:
  provider: nous

browser:
  backend: nous
```

### 5.2. Хранение токенов

- **Refresh token:** `~/.hermes/auth.json`
- **Не в** `config.yaml` — секреты и конфигурация разделены

### 5.3. Автоматическое обновление токенов

Hermes чеканит короткоживущие JWT из refresh token автоматически. При 401 — автоматический retry. При инвалидации refresh token — карантин + сообщение "re-authentication required".

---

## 6. Профили

Portal refresh token автоматически разделяется между всеми профилями. Войти один раз — все профили используют один токен.

```powershell
hermes -p work model    # Профиль work
hermes -p personal model  # Профиль personal
# Оба используют один Portal login
```

---

## 7. Hermes 4 — замечание

**Hermes 4 (70B, 405B)** — frontier модели для чата и рассуждений.

**НЕ рекомендуются для Hermes Agent** — не оптимизированы для tool-calling.

Для агента используйте:
```
/model anthropic/claude-sonnet-4.6
/model openai/gpt-5.5-pro
/model google/gemini-3-pro-preview
/model deepseek/deepseek-v4-pro
```

---

## 8. Управление подпиской

- **Веб:** [portal.nousresearch.com/manage-subscription](https://portal.nousresearch.com/manage-subscription)
- **CLI:** `hermes portal open`

---

## 9. Troubleshooting

| Проблема | Решение |
|---|---|
| `hermes portal info` показывает "not logged in" | `hermes portal` (повторить OAuth) |
| "re-authentication required" | `hermes auth add nous` |
| Модель не отображается в `/model` | Попробовать slug: `/model anthropic/claude-opus-4.6` |
| Счёт не на портале | `hermes model` → выбрать Nous Portal |

---

## 10. Ссылки

- **Portal:** https://portal.nousresearch.com
- **Tool Gateway:** https://hermes-agent.nousresearch.com/docs/user-guide/features/tool-gateway
- **Subscription Proxy:** https://hermes-agent.nousresearch.com/docs/user-guide/features/subscription-proxy
- **Voice Mode:** https://hermes-agent.nousresearch.com/docs/user-guide/features/voice-mode
- **Providers:** https://hermes-agent.nousresearch.com/docs/integrations/providers
