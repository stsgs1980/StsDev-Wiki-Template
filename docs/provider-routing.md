---
title: "Provider Routing"
section: "Provider Routing"
sectionOrder: 180
order: 1
slug: "provider-routing"
---

# DOC-018: Маршрутизация провайдеров и резервное переключение

Источник: https://hermes-agent.nousresearch.com/docs/user-guide/features/provider-routing

---

## 1. Что такое Provider Routing

Provider Routing -- тонкая настройка маршрутизации запросов в Hermes Agent через OpenRouter. Позволяет контролировать, какой из базовых ИИ-провайдеров (Anthropic, Google, AWS Bedrock, Together AI и др.) обрабатывает запросы.

Управление доступно только при использовании OpenRouter. При прямом подключении к провайдеру (например, напрямую к Anthropic API) маршрутизация не действует.

---

## 2. Конфигурация

Секция `provider_routing` в файле `~/.hermes/config.yaml`:

```yaml
provider_routing:
  sort: "price"
  only: []
  ignore: []
  order: []
  require_parameters: false
  data_collection: null
```

---

## 3. Параметры

### 3.1. `sort`

Определяет способ ранжирования провайдеров.

| Значение | Описание |
|---|---|
| `"price"` | Самый дешевый провайдер |
| `"throughput"` | Максимальная пропускная способность (токенов/сек) |
| `"latency"` | Минимальное время до первого токена |

```yaml
provider_routing:
  sort: "price"
```

### 3.2. `only`

Белый список провайдеров. Указанные провайдеры используются исключительно, остальные игнорируются.

```yaml
provider_routing:
  only:
    - "Anthropic"
    - "Google"
```

### 3.3. `ignore`

Чёрный список провайдеров. Указанные провайдеры никогда не используются, даже если они самые дешёвые или быстрые.

```yaml
provider_routing:
  ignore:
    - "Together"
    - "DeepInfra"
```

### 3.4. `order`

Явный приоритет провайдеров. Провайдеры, указанные первыми, имеют приоритет. Незаявленные провайдеры используются как запасные.

```yaml
provider_routing:
  order:
    - "Anthropic"
    - "Google"
    - "AWS Bedrock"
```

### 3.5. `require_parameters`

При значении `true` OpenRouter маршрутизирует запросы только к провайдерам, поддерживающим все параметры запроса (`temperature`, `top_p`, `tools` и т.д.). Предотвращает тихое отбрасывание параметров.

```yaml
provider_routing:
  require_parameters: true
```

### 3.6. `data_collection`

Управляет использованием провайдерами ваших промптов для обучения. Варианты: `"allow"` или `"deny"`.

```yaml
provider_routing:
  data_collection: "deny"
```

---

## 4. Практические примеры

### 4.1. Оптимизация по стоимости

Маршрутизация на самый дешёвый провайдер. Подходит для массового использования и разработки:

```yaml
provider_routing:
  sort: "price"
```

### 4.2. Оптимизация по скорости

Приоритет провайдеров с минимальной задержкой для интерактивного использования:

```yaml
provider_routing:
  sort: "latency"
```

### 4.3. Оптимизация по пропускной способности

Для генерации длинных текстов, где важна скорость генерации токенов:

```yaml
provider_routing:
  sort: "throughput"
```

### 4.4. Фиксация на конкретных провайдерах

Все запросы идут через конкретного провайдера для обеспечения консистентности:

```yaml
provider_routing:
  only:
    - "Anthropic"
```

### 4.5. Исключение определённых провайдеров

Исключение провайдеров по соображениям приватности данных:

```yaml
provider_routing:
  ignore:
    - "Together"
    - "Lepton"
  data_collection: "deny"
```

### 4.6. Предпочтительный порядок с запасными

Приоритетные провайдеры используются первыми, при недоступности -- запасные:

```yaml
provider_routing:
  order:
    - "Anthropic"
    - "Google"
  require_parameters: true
```

### 4.7. Комбинированная конфигурация

Маршрутизация по стоимости с исключениями и обязательной поддержкой параметров:

```yaml
provider_routing:
  sort: "price"
  ignore: ["Together"]
  require_parameters: true
  data_collection: "deny"
```

---

## 5. Принцип работы

Настройки маршрутизации передаются в API OpenRouter через поле `extra_body.provider` в каждом вызове API. Действует для:

- **CLI-режим** -- конфигурация загружается из `~/.hermes/config.yaml` при запуске
- **Gateway-режим** -- тот же файл конфигурации, загружается при старте шлюза

Параметры конфигурации маппятся на внутренние переменные:

```
providers_allowed       <-- provider_routing.only
providers_ignored       <-- provider_routing.ignore
providers_order         <-- provider_routing.order
provider_sort           <-- provider_routing.sort
provider_require_parameters <-- provider_routing.require_parameters
provider_data_collection    <-- provider_routing.data_collection
```

---

## 6. Поведение по умолчанию

При отсутствии секции `provider_routing` OpenRouter использует собственную логику маршрутизации, которая автоматически балансирует стоимость и доступность.

---

## 7. Provider Routing vs. Fallback Providers

Provider Routing управляет **суб-провайдерами внутри OpenRouter**. Fallback Providers осуществляют автоматическое переключение на **абсолютно другой провайдер** при сбое основной модели.

| Аспект | Provider Routing | Fallback Providers |
|---|---|---|
| Область действия | Подпровайдеры внутри OpenRouter | Разные провайдеры/модели |
| Триггер | Всегда (при каждом запросе) | Ошибка основной модели |
| Конфигурация | `provider_routing` в config.yaml | `fallback_providers` в config.yaml |

---

## 8. Fallback Providers

Полноценная документация: https://hermes-agent.nousresearch.com/docs/user-guide/features/fallback-providers

### 8.1. Концепция

Fallback Providers -- механизм автоматического переключения на резервную модель/провайдера при сбое основного. Является вторым уровнем отказоустойчивости Hermes Agent после пулов учётных данных (Credential Pools).

### 8.2. Конфигурация

Через интерактивный менеджер:

```
hermes fallback
```

Или напрямую в `~/.hermes/config.yaml`:

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
```

Каждая запись требует указания `provider` и `model`.

### 8.3. Триггеры активации fallback

- HTTP 429 (rate limits) -- после исчерпания попыток повтора
- HTTP 500, 502, 503 (ошибки сервера) -- после исчерпания попыток повтора
- HTTP 401, 403 (ошибки аутентификации) -- немедленно
- HTTP 404 (не найдено) -- немедленно
- Некорректные ответы API -- при повторяющихся malformed/pустых ответах

### 8.4. Поведение при fallback

1. Разрешение учётных данных резервного провайдера
2. Создание нового API-клиента
3. Замена модели, провайдера и клиента in-place
4. Сброс счётчика повторов, продолжение диалога

Переключение бесшовное: история диалога, вызовы инструментов и контекст сохраняются.

### 8.5. Примеры конфигурации

OpenRouter как fallback для Anthropic:

```yaml
model:
  provider: anthropic
  default: claude-sonnet-4-6
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
```

Nous Portal как fallback для OpenRouter:

```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4
fallback_providers:
  - provider: nous
    model: nous-hermes-3
```

Локальная модель как fallback для облачной:

```yaml
fallback_providers:
  - provider: custom
    model: llama-3.1-70b
    base_url: http://localhost:8000/v1
    key_env: LOCAL_API_KEY
```

### 8.6. Область действия fallback

| Контекст | Поддержка |
|---|---|
| CLI-сессии | Да |
| Мессенджеры (Telegram, Discord и др.) | Да |
| Делегирование подагентов | Да (наследуют цепочку fallback родителя) |
| Cron-задачи | Да (наследуют сконфигурированные fallback-провайдеры) |

### 8.7. Важные особенности

- Fallback действует **в рамках одного хода** (turn-scoped): каждое новое сообщение пользователя начинается с восстановления основной модели
- Внутри одного хода fallback активируется максимум один раз
- Если fallback также завершается ошибкой, срабатывает стандартная обработка ошибок

---

## 9. Итоговая сводка

| Функция | Механизм | Расположение конфигурации |
|---|---|---|
| Provider Routing | Маршрутизация суб-провайдеров внутри OpenRouter | `provider_routing` в config.yaml |
| Fallback Providers | Автоматическое переключение на другой провайдер при сбое | `fallback_providers` в config.yaml |
