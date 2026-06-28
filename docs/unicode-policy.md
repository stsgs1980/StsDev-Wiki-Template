---
title: "Standard: No-Unicode Policy v2.3"
section: "No-Unicode Policy"
sectionOrder: 40
order: 1
slug: "unicode-policy"
---


> ID: STD-DOC-003
> Version: 2.3.0
> Level: **[C] Critical** + **[W] Warning** + **[I] Info**
> Related: Markdown Standard (STD-DOC-002)

Standard for character, icon, and graphics usage. Design System / Engineering Governance level.

---

## 1. Purpose

This standard establishes rules for using Unicode graphic characters across all product layers: interface, content, code, system communications.

### Goals:

- ensure visual consistency
- maintain professional product level
- guarantee controllability through design system
- exclude uncontrolled visual artifacts
- provide automated enforcement via ESLint where possible

---

## 2. Responsibility Separation

| Document | Level | Scope |
|----------|-------|-------|
| **No-Unicode Policy v2.2** (this document) | [C] Critical, [W] Warning, [I] Info | UI, production code, AI-chat, prototypes |
| **MARKDOWN_STANDARD v2.3** | [C] Critical | README.md, project documentation |

---

## 3. Strictness Levels

The standard applies a **tiered approach** instead of absolute prohibition:

| Level | Notation | Context | Action |
|-------|----------|---------|--------|
| Critical | [C] | UI, production code | Blocks merge |
| Warning | [W] | AI-chat only | Warning in review (see MARKDOWN_STANDARD) |
| Info | [I] | Internal notes, prototypes | Recommendation |

### Level Application:

| Context | Level | Rationale |
|---------|-------|-----------|
| UI components | [C] Critical | Direct impact on user |
| API responses, errors | [C] Critical | Displayed in interface |
| Production code | [C] Critical | May reach UI |
| Project documentation | [C] Critical | See MARKDOWN_STANDARD |
| README files | [C] Critical | See MARKDOWN_STANDARD |
| Internal notes | [I] Info | Developers only |
| Prototypes / MVP | [I] Info | Temporary code |
| Logs, debug | [I] Info | Not visible to user |
| AI-communication (chat) | [W] Warning | Professional agent communication style |

**Note for AI-communication:** AI-agent responses in chat must not contain emoji and Unicode graphics. This ensures a consistent professional style alongside code and documentation. User messages are not regulated by this standard.

---

## 4. What is Prohibited

### 4.1. Prohibited Character Categories

| Category | Examples | Level |
|----------|----------|-------|
| Emoji | any pictograms: emotions, objects, UI-symbols | [C] |
| Unicode-icons | status symbols, actions, notifications | [C] |
| Decorative symbols | pseudographics, markers, highlights | [W] |

### 4.2. Scope by Layers

| Layer | Critical [C] | Info [I] |
|-------|--------------|----------|
| Interface (UI) | buttons, menus, tables, notifications | - |
| API | responses, errors, statuses | - |
| Content | texts in product | drafts |
| Code | UI-strings, messages | debug-code |
| Logging | - | console.log, trace |

---

## 5. Reasons for Restrictions

| Problem | Description |
|---------|-------------|
| Inconsistent render | Unicode displays differently on different OS, browsers, devices |
| Lack of control | Cannot centrally change style, manage themes |
| No scalability | No size control, no responsiveness |
| Professional standard violation | Reduces trust, breaks visual hierarchy |
| Automated enforcement difficulty | Unicode characters in code cannot be reliably caught by manual review alone |

---

## 6. Allowed Characters

### 6.1. Basic Set

| Category | Range | Examples |
|----------|-------|----------|
| ASCII letters | a-z, A-Z | text, TEXT |
| Cyrillic | a-ya, A-YA | tekst, TEKST |
| Digits | 0-9 | 123 |
| Punctuation | . , ; : ! ? - _ | standard |
| Whitespace | space, tab, newline | formatting |

### 6.2. Whitelist for Diagrams (code [I] only)

For technical diagrams in code, allowed:

| Symbol | Usage |
|--------|-------|
| `->` | right arrow |
| `<-` | left arrow |
| `=>` | implication |
| `<=` | reverse implication |
| `\|` | vertical line |
| `+` | line junction |
| `-` | horizontal line |
| `v` | down arrow |
| `^` | up arrow |
| `>` | pointer |
| `<` | reverse pointer |

### 6.3. Code Formatting in Comments and Documentation

When formatting code in comments and embedded documentation:

| Element | Format |
|---------|--------|
| Inline code | `` `code` `` |
| Code block | `` ```language `` |

**Rules:**

- Specify language for code blocks (syntax highlighting)
- Do not use HTML tags for code coloring
- Color is IDE/renderer responsibility

### 6.4. Example Allowed Diagram (level [I])

```text
+-------------------+
|    Component A    |
+---------+---------+
          |
          v
+-------------------+
|    Component B    |
+---------+---------+
          |
          +-----> Component C
```

---

## 7. Icon Standard

### 7.1. Basic Rule

Any visual symbol in UI = **SVG only**

### 7.2. SVG Requirements

- be part of Design System
- use design tokens
- support theming
- be optimized (SVGO)
- have unified stroke/fill style

### 7.3. Icon Libraries

| Library | Status | Usage |
|---------|--------|-------|
| Lucide | Primary | All project icons |
| Brand logos | Required | Technologies, integrations |

### 7.4. Brand Logos

When mentioning technologies, use official SVG:

| Technology | Requirement |
|------------|-------------|
| Next.js | Official SVG logo |
| TypeScript | Official SVG logo |
| Tailwind CSS | Official SVG logo |
| Prisma ORM | Official SVG logo |

---

## 8. AI Prompts

### 8.1. Correct Formulation

```text
Output must contain only:
- ASCII characters (a-z, A-Z, 0-9, standard punctuation)
- Cyrillic characters (a-ya, A-YA)
- Whitelisted diagram symbols (for [I] level): -> <- => <= \| + - v ^ > <
```

### 8.2. Document Cleaning Before Analysis

```javascript
// Remove emoji and Unicode graphics
text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]/gu, '')
```

### 8.3. Final Sanitization

```javascript
// For [C] level (code/UI) - ASCII + Cyrillic only (typography strictly prohibited)
text.replace(/[^\x20-\x7E\u0400-\u04FF]/g, '')

// For [I] level - with whitelist for diagrams
// Note: 'v' removed from explicit enumeration as it's in basic ASCII range \x20-\x7E
text.replace(/[^\x20-\x7E\u0400-\u04FF\-\>\<\=\|\+\^]/g, '')

// ATTENTION: Level [W] (documentation) is regulated by MARKDOWN_STANDARD v2.3.
// There typographic characters (em dash, en dash, degree, copyright) ARE ALLOWED in plain text, therefore this
// strict sanitization is NOT applied to .md files.
```

### 8.4. Chat Dialogue Requirements

This subsection defines the rules for AI-agent chat dialogue with the user (the `[W] Warning` context from Section 3). The rules apply to every message the agent emits in the chat channel: plain answers, code blocks, tables, lists, structured reports, worklog summaries, and tool-call narratives. User messages are NOT regulated — only agent output.

**8.4.1. Character Set for Chat Output**

| Allowed | Prohibited |
|---------|-----------|
| ASCII letters, digits, standard punctuation | Emoji (any range, including ZWJ sequences) |
| Cyrillic letters (Russian, Ukrainian, etc.) | Unicode pictographs (arrows, stars, checkmarks, crosses) |
| Whitelisted ASCII diagram symbols inside code blocks only: `<` `>` `=` `|` `+` `-` `^` `v` | Dingbats, Miscellaneous Symbols, Mathematical Operators used as decoration |
| Typographic characters from STD-DOC-003 §6.1 basic set (em dash, en dash, degree, plus-minus) in PLAIN text only | Typographic characters in code blocks, headings, file names, table headers |
| Status text tags: `[OK]`, `[FAIL]`, `[TODO]`, `[WARNING]`, `[INFO]`, `[DRAFT]`, `[BLOCKED]`, `[DEPRECATED]` | Unicode status icons: checkmark, cross, hourglass, lock, warning sign |

**8.4.2. Structural Rules for Chat Messages**

1. **No emoji as bullet markers or status indicators.** Use `-` for unordered lists (per STD-DOC-002 §5.2), and text tags from §8.4.1 for statuses.
2. **No Unicode pseudo-graphics for trees or boxes in plain chat text.** Tree structures (file trees, call hierarchies) MUST use ASCII indentation with `+--`, `|`, and `\-` inside a fenced `text` code block. Box-drawing characters (U+2500–U+257F) are PROHIBITED in chat output.
3. **Code blocks MUST specify a language** (per STD-DOC-002 §5.4). Unknown language — use `text` or `bash` fallback. This applies equally to inline command examples and to multi-line code.
4. **File paths in chat MUST be quoted** with backticks (e.g. `src/lib/utils.ts`) — never wrapped in guillemets or decorated with arrow glyphs.
5. **Headings inside long chat answers** (more than ~30 lines) MUST use Markdown `##` / `###` syntax, not Unicode decorators or horizontal rules made of `━`, `═`, etc.
6. **Tables MUST use standard Markdown pipe syntax** — never Unicode box-drawing characters to simulate table borders.

**8.4.3. Tone and Pacing**

- The agent answers in the user's input language (per project Language Consistency Rule).
- Code, file paths, identifiers, command names, and configuration keys remain in their original language (English, Latin, etc.) even if the surrounding chat is in another language.
- When the agent makes a mistake or discovers an inconsistency in its own prior output, it MUST explicitly acknowledge the correction in plain text ("Correction:", "Update:") rather than with emoji or symbols.
- When the agent refuses a request (security, policy, capability), the refusal MUST be in plain text with a brief reason — no warning glyphs, no crossed-out emoji.

**8.4.4. Forbidden Chat Patterns**

| Pattern | Why forbidden | Correct replacement |
|---------|----------------|---------------------|
| `✅ Done` or `❌ Failed` as a status line | Unicode pictograph in chat | `[OK] Done` / `[FAIL] Failed` |
| `→` (arrow) as a bullet or separator | Unicode arrow used as decoration | `->` (inside code block) or `:` (in plain text) |
| `📁 Folder:` or `🔒 Locked:` | Emoji as section marker | `Folder:` / `Locked:` or `[LOCKED]` |
| Box-drawing tree: `├── src` `│   └── ...` | Unicode pseudo-graphics in chat | ASCII tree in `text` block: `+-- src` `\  +-- ...` |
| `⚠️ Warning: ...` | Emoji as warning marker | `[WARNING] ...` |
| Horizontal rule made of `━` × N | Unicode decoration | Markdown `---` |
| Table with `│` and `─` borders | Unicode pseudo-graphics table | Standard Markdown pipe table |

**8.4.5. Enforcement**

Chat dialogue is enforced at level `[W] Warning`: violations do not block the agent's response, but are reviewed in periodic quality audits and reported in the agent's worklog entry for the session. Repeated violations escalate to Tech Lead per Section 9.1 of STD-DOC-002.

**8.4.6. Relationship to Other Sections**

- §4 (What is Prohibited) defines the character categories — §8.4 narrows them to chat output specifically.
- §6 (Allowed Characters) defines the whitelist — §8.4.1 restates the chat-relevant subset.
- §10.1 (ESLint rule `no-unicode-policy`) does NOT run on chat output (chat is not a file). Enforcement is manual / audit-based.
- §13.3 (Compliance Checklist for AI-communication) is the operational checklist — §8.4 is the normative specification behind it.

---

## 9. Fallback Strategy

### 9.1. When SVG Unavailable

| Situation | Solution |
|-----------|----------|
| SVG load error | Text alternative (hidden, aria-label) |
| Email clients | Text + styled span |
| Terminal / CLI | Text + ANSI colors |
| Plain text | Text only |

### 9.2. Fallback Implementation

```html
<!-- SVG with fallback via onerror -->
<span class="icon">
  <svg onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"
       aria-hidden="true">
    <!-- icon content -->
  </svg>
  <span class="icon-fallback" style="display:none">Save</span>
</span>
```

```css
.icon-fallback {
  display: none;
}
/* Fallback shown via JS onerror on SVG element */
```

---

## 10. Control and Enforcement

### 10.1. ESLint Custom Rule: `no-unicode-policy`

This is the primary automated enforcement mechanism for the No-Unicode Policy. The rule file lives at `eslint-rules/no-unicode-policy.js` in the project root and exports multiple sub-rules covering different contexts and severity levels.

#### 10.1.1. Full Rule Implementation

```javascript
// eslint-rules/no-unicode-policy.js
module.exports = {
  configs: {
    recommended: {
      plugins: ["no-unicode-policy"],
      rules: {
        "no-unicode-policy/no-emoji": "error",
        "no-unicode-policy/no-unicode-graphics": "error",
        "no-unicode-policy/no-emoji-in-md": "warn",
        "no-unicode-policy/no-unicode-graphics-in-md": "warn",
      },
    },
  },
  rules: {
    // -------------------------------------------------------
    // Rule 1: no-emoji
    // Context: Production code (.ts, .tsx, .js, .jsx)
    // Level: [C] Critical — blocks merge
    // Detects emoji in string literals, template literals, and JSX text nodes.
    // -------------------------------------------------------
    "no-emoji": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow emoji in production code (STD-DOC-003 section 4.1, level [C])",
          category: "Unicode Policy",
          recommended: true,
        },
        messages: {
          emojiInLiteral:
            "Emoji are prohibited in production code [C]. Use SVG icons or text alternatives instead. (STD-DOC-003 section 4.1)",
          emojiInTemplate:
            "Emoji are prohibited in template literals [C]. Use SVG icons or text alternatives instead. (STD-DOC-003 section 4.1)",
          emojiInJSX:
            "Emoji are prohibited in JSX text [C]. Use SVG icons or text alternatives instead. (STD-DOC-003 section 4.1)",
        },
      },
      create(context) {
        const emojiPattern =
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}]/u;

        return {
          Literal(node) {
            if (typeof node.value === "string" && emojiPattern.test(node.value)) {
              context.report({ node, messageId: "emojiInLiteral" });
            }
          },
          TemplateLiteral(node) {
            for (const quasi of node.quasis) {
              if (
                quasi.value &&
                quasi.value.cooked &&
                emojiPattern.test(quasi.value.cooked)
              ) {
                context.report({ node, messageId: "emojiInTemplate" });
                break;
              }
            }
          },
          JSXText(node) {
            if (node.value && emojiPattern.test(node.value)) {
              context.report({ node, messageId: "emojiInJSX" });
            }
          },
        };
      },
    },

    // -------------------------------------------------------
    // Rule 2: no-unicode-graphics
    // Context: Production code (.ts, .tsx, .js, .jsx)
    // Level: [C] Critical — blocks merge
    // Detects Unicode graphic characters (beyond emoji) used as visual elements:
    // box-drawing characters, block elements, geometric shapes, arrows, etc.
    // -------------------------------------------------------
    "no-unicode-graphics": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow Unicode graphic characters in production code (STD-DOC-003 section 4.1, level [C])",
          category: "Unicode Policy",
          recommended: true,
        },
        messages: {
          unicodeGraphicsInLiteral:
            "Unicode graphic characters are prohibited in production code [C]. Use SVG icons instead. (STD-DOC-003 section 4.1)",
          unicodeGraphicsInTemplate:
            "Unicode graphic characters are prohibited in template literals [C]. Use SVG icons instead. (STD-DOC-003 section 4.1)",
          unicodeGraphicsInJSX:
            "Unicode graphic characters are prohibited in JSX text [C]. Use SVG icons instead. (STD-DOC-003 section 4.1)",
        },
      },
      create(context) {
        // Box-drawing, block elements, geometric shapes, arrows, misc symbols
        const unicodeGraphicsPattern =
          /[\u{2500}-\u{257F}\u{2580}-\u{259F}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2200}-\u{22FF}\u{2300}-\u{23FF}\u{2400}-\u{243F}\u{2440}-\u{244A}\u{25CC}\u{2800}-\u{28FF}\u{2B50}\u{2B55}\u{2934}\u{2935}]/u;

        return {
          Literal(node) {
            if (
              typeof node.value === "string" &&
              unicodeGraphicsPattern.test(node.value)
            ) {
              context.report({ node, messageId: "unicodeGraphicsInLiteral" });
            }
          },
          TemplateLiteral(node) {
            for (const quasi of node.quasis) {
              if (
                quasi.value &&
                quasi.value.cooked &&
                unicodeGraphicsPattern.test(quasi.value.cooked)
              ) {
                context.report({ node, messageId: "unicodeGraphicsInTemplate" });
                break;
              }
            }
          },
          JSXText(node) {
            if (node.value && unicodeGraphicsPattern.test(node.value)) {
              context.report({ node, messageId: "unicodeGraphicsInJSX" });
            }
          },
        };
      },
    },

    // -------------------------------------------------------
    // Rule 3: no-emoji-in-md
    // Context: Markdown files (.md)
    // Level: [W] Warning — does not block merge
    // Scans raw .md text (excluding code blocks) for emoji.
    // -------------------------------------------------------
    "no-emoji-in-md": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Disallow emoji in Markdown documentation (STD-DOC-003 section 4.1 + STD-DOC-002, level [C])",
          category: "Unicode Policy",
          recommended: true,
        },
        messages: {
          emojiInMd:
            "Emoji are prohibited in documentation [W]. Use text tags like [OK], [FAIL] instead. (STD-DOC-003 section 4.1, STD-DOC-002 section 4.4)",
        },
      },
      create(context) {
        const emojiPattern =
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}]/u;

        return {
          Program(node) {
            const sourceCode =
              context.sourceCode || context.getSourceCode();
            const text = sourceCode.getText();

            // Remove fenced code blocks — they are handled by the
            // code-block-level rules (no-emoji, no-unicode-graphics)
            const textWithoutCodeBlocks = text.replace(
              /```[\s\S]*?```/g,
              ""
            );

            const lines = textWithoutCodeBlocks.split("\n");
            lines.forEach((line, index) => {
              if (emojiPattern.test(line)) {
                context.report({
                  loc: { line: index + 1, column: 0 },
                  messageId: "emojiInMd",
                });
              }
            });
          },
        };
      },
    },

    // -------------------------------------------------------
    // Rule 4: no-unicode-graphics-in-md
    // Context: Markdown files (.md)
    // Level: [W] Warning — does not block merge
    // Scans raw .md text (excluding code blocks) for Unicode graphics.
    // -------------------------------------------------------
    "no-unicode-graphics-in-md": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Disallow Unicode graphic characters in Markdown documentation (STD-DOC-003 section 4.1 + STD-DOC-002, level [W])",
          category: "Unicode Policy",
          recommended: true,
        },
        messages: {
          unicodeGraphicsInMd:
            "Unicode graphic characters are prohibited in documentation [W]. Use ASCII art in code blocks or text alternatives. (STD-DOC-003 section 4.1, STD-DOC-002 section 6.2)",
        },
      },
      create(context) {
        const unicodeGraphicsPattern =
          /[\u{2500}-\u{257F}\u{2580}-\u{259F}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2200}-\u{22FF}\u{2300}-\u{23FF}]/u;

        return {
          Program(node) {
            const sourceCode =
              context.sourceCode || context.getSourceCode();
            const text = sourceCode.getText();

            // Remove fenced code blocks
            const textWithoutCodeBlocks = text.replace(
              /```[\s\S]*?```/g,
              ""
            );

            const lines = textWithoutCodeBlocks.split("\n");
            lines.forEach((line, index) => {
              if (unicodeGraphicsPattern.test(line)) {
                context.report({
                  loc: { line: index + 1, column: 0 },
                  messageId: "unicodeGraphicsInMd",
                });
              }
            });
          },
        };
      },
    },
  },
};
```

#### 10.1.2. Rule Architecture and Severity Mapping

The ESLint rules in `no-unicode-policy.js` are designed to mirror the tiered strictness levels from section 3 of this standard. The mapping between standard levels and ESLint severity is fundamental to understanding how the nested standards work:

| Standard Level | ESLint Severity | Effect on CI | Example Rule |
|----------------|-----------------|--------------|--------------|
| [C] Critical | `error` | Blocks merge | `no-unicode-policy/no-emoji` |
| [W] Warning | `warn` | Reports but does not block | `no-unicode-policy/no-emoji-in-md` |
| [I] Info | `off` | Not enforced by ESLint | No rule (manual convention only) |

**Why this mapping matters:** The same underlying violation (e.g., an emoji character) triggers different ESLint severities depending on context. An emoji in a React component is `error` (it will appear in the UI — [C] Critical). The same emoji in a README is `warn` (it is documentation — [W] Warning). The rule implementation is context-aware through separate rule names, not through runtime severity logic.

#### 10.1.3. Character Ranges Covered

The rules detect characters in the following Unicode ranges:

**Emoji detection (`no-emoji`, `no-emoji-in-md`):**

| Range | Description |
|-------|-------------|
| U+1F600-U+1F64F | Emoticons |
| U+1F300-U+1F5FF | Miscellaneous Symbols and Pictographs |
| U+1F680-U+1F6FF | Transport and Map Symbols |
| U+1F1E0-U+1F1FF | Flags (Regional Indicator Symbols) |
| U+2600-U+27BF | Miscellaneous Symbols |
| U+FE00-U+FEFF | Variation Selectors |
| U+1F900-U+1F9FF | Supplemental Symbols and Pictographs |
| U+1FA00-U+1FA6F | Chess Symbols |
| U+1FA70-U+1FAFF | Symbols and Pictographs Extended-A |
| U+2702-U+27B0 | Dingbats |

**Unicode graphics detection (`no-unicode-graphics`, `no-unicode-graphics-in-md`):**

| Range | Description |
|-------|-------------|
| U+2500-U+257F | Box Drawing |
| U+2580-U+259F | Block Elements |
| U+25A0-U+25FF | Geometric Shapes |
| U+2190-U+21FF | Arrows |
| U+2200-U+22FF | Mathematical Operators |
| U+2300-U+23FF | Miscellaneous Technical |
| U+2800-U+28FF | Braille Patterns |
| U+2B50, U+2B55 | Stars and circles |

### 10.2. ESLint Configuration Integration

The `no-unicode-policy.js` rule is designed to work with both flat config (ESLint 9+) and legacy config (ESLint 8). See **STD-DOC-002 section 10.3** for the complete configuration examples. The key points of integration are:

1. **Production code files** (`.ts`, `.tsx`, `.js`, `.jsx`): Rules `no-emoji` and `no-unicode-graphics` are set to `error`
2. **Markdown files** (`.md`): Rules `no-emoji-in-md` and `no-unicode-graphics-in-md` are set to `warn`
3. **Code blocks inside Markdown** (`.md/**`): Production rules apply — `no-emoji` and `no-unicode-graphics` are set to `error` because code examples in documentation should follow the same standards as production code

This three-tier configuration ensures that the nested standards are enforced correctly at each level without conflicting with each other.

### 10.3. Interaction with `no-irregular-whitespace`

ESLint has a built-in rule `no-irregular-whitespace` that catches some Unicode whitespace characters (NBSP, ZWSP, line/paragraph separators, etc.). This rule complements the custom `no-unicode-policy` rules:

| Rule | What it catches | Where it applies |
|------|-----------------|------------------|
| `no-unicode-policy/no-emoji` | Emoji pictograms | String literals, template literals, JSX |
| `no-unicode-policy/no-unicode-graphics` | Box-drawing, arrows, geometric shapes | String literals, template literals, JSX |
| `no-irregular-whitespace` | NBSP, ZWSP, line/paragraph separator, BOM | All source code |

**Recommendation:** Enable `no-irregular-whitespace: "error"` alongside the custom rules. It catches whitespace-related Unicode issues that the custom rules do not cover.

### 10.4. Code Review

| Level | Action |
|-------|--------|
| [C] violation | PR rejected |
| [I] violation | Recommendation (optional) |

### 10.5. Design Review

- icon system compliance
- brand logo usage
- fallback presence

---

## 11. Exceptions

### 11.1. Unconditionally Allowed

| Category | Examples |
|----------|----------|
| Letters | a-z, A-Z, a-ya, A-YA |
| Digits | 0-9 |
| Punctuation | . , ; : ! ? - _ ( ) [ ] { } |
| Whitelist symbols [I] | `-> <- => <= \| + - v ^ > <` |

### 11.2. Exceptions by Agreement

| Situation | Requirement |
|-----------|-------------|
| External requirements | Email newsletters with emoji - coordinate with marketing |
| Localization | Languages with non-ASCII characters (Chinese, Arabic) |
| Accessibility | Unicode characters for screen readers |

### 11.3. Approval Process

1. Create issue with justification
2. Get approval from Tech Lead
3. Document exception in code
4. Add to whitelist if necessary

### 11.4. ESLint Inline Disable Policy

When an exception is approved (section 11.3), the corresponding ESLint rule can be disabled inline. The disable comment must reference the approved exception.

```typescript
// eslint-disable-next-line no-unicode-policy/no-emoji -- Approved exception: ISSUE-1234, email campaign requires emoji
const emailSubject = "Welcome to our platform!";
```

**Rules for inline disables:**

1. Each `eslint-disable` must reference a specific approved issue number
2. Disables of [C]-level rules without an approved issue are rejected in code review
3. `eslint-disable` without a specific rule name is prohibited
4. Disables should be scoped to the smallest possible range (prefer `eslint-disable-next-line` over `eslint-disable`)

---

## 12. Application by Project Types

| Project Type | Application Level | ESLint Config |
|--------------|-------------------|---------------|
| Enterprise | Full [C] everywhere | All rules as `error` |
| B2B SaaS | [C] in UI, [W] in documentation | Production rules `error`, Markdown rules `warn` |
| B2C product | [C] in UI, [W] in documentation | Production rules `error`, Markdown rules `warn` |
| MVP / Prototype | [I] everywhere | All rules `off` (manual convention only) |
| Internal tool | [I] in code, [W] in README | Production rules `off`, Markdown rules `warn` |
| Open Source | [C] in UI, [W] in documentation | Production rules `error`, Markdown rules `warn` |

---

## 13. Compliance Checklist

### Before merge (code [C]):

- [ ] No emoji in UI components
- [ ] No Unicode-icons in production code
- [ ] Icons implemented via SVG
- [ ] Brand logos are official SVG
- [ ] Fallback exists for critical icons
- [ ] AI prompts use correct formulation
- [ ] ESLint runs without errors (`npx eslint 'src/**/*.{ts,tsx}' --max-warnings=0`)
- [ ] No inline disables without approved issue numbers

### For documentation [W]:

- [ ] See MARKDOWN_STANDARD v2.3
- [ ] ESLint warnings in .md files reviewed

### For AI-communication (chat) [W]:

- [ ] No emoji in AI-agent responses
- [ ] No Unicode-graphics in chat
- [ ] Status indicators use text tags: `[OK]`, `[FAIL]`, `[TODO]`, `[WARNING]`, `[INFO]`
- [ ] File paths quoted with backticks, not decorated with arrow glyphs
- [ ] Tree structures use ASCII (`+--`, `|`, `\-`) inside `text` code blocks
- [ ] Tables use Markdown pipe syntax, never Unicode box-drawing
- [ ] Code blocks specify a language (`text`/`bash` as fallback)
- [ ] Headings use `##` / `###`, not Unicode decorators
- [ ] Refusals and corrections are in plain text, not warning glyphs

---

## 14. Stack Signature Format

- Placement: bottom right corner (for root `README.md` and `CHANGELOG.md` only)
- Format: `Built with: <project technologies>` (specific stack defined by project, not standard)
- Example (for Next.js projects): `Built with: Next.js 16 + TypeScript + Tailwind CSS`
- Allowed: Latin, Cyrillic, digits, + and : characters
- Prohibited: emoji, Unicode graphics

**Note:** The standard defines the format (structure), not specific technologies. Default value for projects of this stack see in `templates/README_TEMPLATE.md`.

---

## 15. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-Q4 | Initial version, absolute prohibition |
| 2.0 | 2025-01 | Tiered approach, whitelist, fallback strategy, MARKDOWN_STANDARD link, code formatting rules |
| 2.1 | 2025-01 | Sync with MARKDOWN_STANDARD v2.1 (allow typography in text for [W], fix regex for diagrams, clarify stack signature) |
| 2.1.1 | 2025-01 | Fixed invalid CSS `:loaded` to `onerror`, added TemplateLiteral and JSXText checks to ESLint rule, removed emoji from document body, removed double separator |
| 2.1.2 | 2025-01 | Added AI-communication (chat) as [W] level context; AI-agent responses must not contain emoji and Unicode graphics; user messages not regulated |
| 2.1.3 | 2025-01 | Stack signature parameterized: standard defines format `Built with: <technologies>`, specific stack is project responsibility; default value moved to README_TEMPLATE |
| 2.2.0 | 2026-06 | Major ESLint integration update: expanded custom rule `no-unicode-policy.js` with 4 sub-rules (no-emoji, no-unicode-graphics, no-emoji-in-md, no-unicode-graphics-in-md); added severity mapping table (section 10.1.2); added Unicode range reference table (section 10.1.3); added ESLint config integration notes (section 10.2); added `no-irregular-whitespace` interaction notes (section 10.3); added inline disable policy with issue reference requirement (section 11.4); added project type to ESLint config mapping (section 12); updated compliance checklist with ESLint items; added automated enforcement difficulty to section 5; updated cross-references to STD-DOC-002 v2.3 |
| 2.3.0 | 2026-06 | Added Section 8.4 "Chat Dialogue Requirements" — normative specification for AI-agent chat output: character set, structural rules, forbidden patterns, enforcement. Expanded §13 checklist "For AI-communication (chat) [W]" from 2 items to 9 items aligned with §8.4. |

---

**Document complies with No-Unicode Policy v2.3**

---

## 15A. Known Issues and Proposed Solutions

This section documents discovered inconsistencies, missing content, and proposed corrections. Each issue has an ID, status, and proposed action. Issues resolved in the current version are marked `[RESOLVED]`; outstanding issues are marked `[OPEN]`.

### UNI-001 `[RESOLVED in v2.3.0]`: No normative section for chat dialogue

**Problem:** Prior to v2.3.0, chat dialogue was mentioned only in §3 (Strictness Levels) as one `[W]` context line, and in §13 as a 2-item checklist. There was no normative specification of what is allowed/prohibited in AI-agent chat output. Agents had no concrete reference to apply.

**Resolution:** Added §8.4 "Chat Dialogue Requirements" with six subsections: character set, structural rules, tone/pacing, forbidden patterns table, enforcement, and relationship to other sections. Expanded §13 checklist from 2 to 9 items aligned with §8.4.

### UNI-002 `[OPEN]`: ESLint rule does not cover chat output

**Problem:** The custom ESLint rule `no-unicode-policy.js` (§10.1) runs on source files (`.ts`, `.tsx`) and Markdown files (`.md`). Chat output is not a file — it never passes through ESLint. Enforcement is therefore manual and audit-based, which is inconsistent with the automated enforcement model used for code and documentation.

**Proposed solution:** Implement a chat-output linter as a separate tool (e.g., `lint-chat.js`) that takes agent responses from the chat log and runs the same Unicode checks. Integrate into the agent's post-response hook. Until then, §8.4.5 documents the manual enforcement policy.

### UNI-003 `[OPEN]`: Version reference in `DESIGN-001-design-system.md` is stale

**Problem:** `DESIGN-001-design-system.md` (STD-DESIGN-001) header and §8 reference "No-Unicode Policy v2.1". The actual version of this standard is v2.3.0.

**Proposed solution:** Update `DESIGN-001-design-system.md` header and §8 to reference "No-Unicode Policy v2.3". See STD-DESIGN-001 Known Issues entry DES-001 for the cross-reference.

### UNI-004 `[OPEN]`: Registry version mismatch in `META-001-standard-id-system.md`

**Problem:** The registry in `META-001-standard-id-system.md` (STD-META-001 §4) lists STD-DOC-003 as v2.1.3. The actual version of this standard is v2.3.0.

**Proposed solution:** Update STD-META-001 §4.4 to reflect v2.3.0 for STD-DOC-003. See STD-META-001 Known Issues entry META-002 for the cross-reference.

---

## 16. Cross-References

| Standard | Relationship |
|----------|-------------|
| STD-DOC-002 | Markdown Standard: delegates character rules to this standard; keeps .md-specific formatting rules. Section 10 (ESLint Integration) in STD-DOC-002 references the custom rule defined in this document (section 10.1). The `eslint.config.js` examples in STD-DOC-002 section 10.3 import the `no-unicode-policy.js` rule file defined in this document. |
| STD-META-001 | Standard ID System: registry entry for STD-DOC-003 must be kept in sync with the version in this document's header. |
| STD-DESIGN-001 | Design System Standard: §8 (Icon and Graphics Rules) and §9 (Markdown Compliance) reference this standard's character and icon rules. |
