# StsDev Wiki Template

**Стандартизированный шаблон базы знаний** на базе Next.js 16 — MDX-контент, подсветка синтаксиса, тёмная/светлая темы, встроенный редактор, статический деплой на GitHub Pages.

## Принцип стандартизированного шаблона

Этот репозиторий — не просто проект, а **шаблон (template)**, который клонируется и используется как основа для создания баз знаний. Все решения принимаются из этого принципа:

- **Универсальность** — функциональность должна работать для любого контента, а не для конкретных документов. Пример: click-to-expand реализован на уровне контейнера `.docs-content` через event delegation, а не в каждом компоненте отдельно.
- **Предсказуемость** — новые MDX-файлы работают из коробки без дополнительных настроек. Достаточно создать `.mdx` с frontmatter — страница автоматически появится в навигации, поиске, TOC.
- **Минимальные зависимости от контента** — шаблон не должен требовать предварительной настройки под конкретную структуру документа. Любой стандартный Markdown/GFM рендерится корректно.
- **Регрессионный контроль** — каждый компонент (code block, mermaid, таблица, callout, изображение) покрывается showcase-файлом, который служит эталоном для проверки после изменений.
- **Деплой без сервера** — по умолчанию шаблон деплоится как статический сайт на GitHub Pages. Серверные маршруты (редактор, API) отключаются в CI автоматически.

## Features

- **MDX Content** — each page as a `.mdx` file with frontmatter (title, section, order, slug)
- **Syntax Highlighting** — Prism-based, One Dark / One Light matching the theme
- **Mermaid Diagrams** — adapt to the current theme (dark/light)
- **Dark and Light Themes** — toggle with one button, state persisted in localStorage
- **Full-text Search (Cmd+K)** — instant search across all pages
- **In-app Editing** — WYSIWYG MDX editor, page creation, file upload
- **Git Integration** — auto-commit on save from the application
- **Table of Contents (TOC)** — auto-generated, active section highlighting
- **Cross-navigation** — "Previous / Next" buttons between pages
- **GitHub Pages** — static deployment via GitHub Actions (server routes removed in CI)
- **GFM Support** — GitHub Flavored Markdown via remark-gfm (tables, strikethrough, task lists, autolinks)
- **Responsive Design** — mobile navigation with drawer menu

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Theming | next-themes (class-based) |
| Content Rendering | next-mdx-remote/rsc (Server Component) + remark-gfm |
| Editor | @mdxeditor/editor (WYSIWYG + source) |
| Code Highlighting | react-syntax-highlighter (Prism) |
| Diagrams | Mermaid.js (dynamic import) |
| Frontmatter | gray-matter |
| Icons | Lucide React |

## Local Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Linting
bun run lint
```

Open http://localhost:3000 — the documentation will load with the dark theme by default.

## Project Structure

```
src/
  app/
    layout.tsx                # Root layout + ThemeProvider
    page.tsx                  # Redirect to first page
    globals.css               # CSS variables for light/dark themes
    docs/
      [slug]/
        page.tsx              # Server page (SSG/SSR)
        docs-shell.tsx        # Client shell (sidebar, TOC, search)
        edit/page.tsx         # In-app editing
      new/page.tsx            # Create new page
    api/docs/                 # REST API for document CRUD
  components/
    docs/                     # Documentation components
    mdx/                      # MDX rendering and editor
    ui/                       # shadcn/ui components
  content/
    docs/                     # MDX content files
  lib/
    mdx-utils.ts              # Utilities for reading MDX files
    api-handlers.ts           # API handlers (CRUD + git)
```

## Верификация шаблона

Перед релизом шаблона необходимо убедиться, что все компоненты работают. Для этого используется **showcase-файл** — MDX-страница, содержащая все типы поддерживаемого контента:

1. Клонировать шаблон: `git clone <repo> && cd StsDev-Wiki-Template && bun install && bun run dev`
2. Открыть showcase-страницу и проверить визуально: code blocks (светлая/тёмная тема), mermaid-диаграммы, таблицы, изображения, callout'ы
3. Проверить universal click-to-expand — клик по любому блоку раскрывает его в overlay
4. Проверить поиск (Cmd+K) — showcase-страница находится
5. Проверить переключение тем — нет белой вспышки, контраст WCAG AA
6. Билд без ошибок: `bun run build`
7. Статический билд: `GITHUB_PAGES=true npx next build`

## Deployment

### GitHub Pages (static)

The CI workflow automatically removes server routes (API, edit, new) and builds a static site:

```bash
# Manual deployment
GITHUB_PAGES=true npx next build
```

### Vercel / server mode

```bash
bun run build
bun run start
```

In server mode, in-app editing and the API are available.

Built with: Next.js 16 + TypeScript + Tailwind CSS
