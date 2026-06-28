# Contributing Rules (StsDev Wiki Template)

## Version Bumping

**Each change that modifies project behaviour, fixes bugs, or adds features MUST bump the version in `package.json`.**

Use [Conventional Commits](https://www.conventionalcommits.org/) to determine the bump level:

| Commit prefix | Bump type | Example |
|---|---|---|
| `feat:` | **minor** (x.Y.Z) | `1.1.0` |
| `fix:` | **patch** (x.y.Z) | `1.0.1` |
| `docs:` (README only) | skip | no bump |
| `chore:` / `style:` | skip | no bump |
| `refactor:` | **patch** (x.y.Z) | `1.0.1` |
| `perf:` | **patch** (x.y.Z) | `1.0.1` |
| `BREAKING CHANGE:` | **major** (X.y.z) | `2.0.0` |

### How to bump

```bash
# Patch (bug fix, small refactor)
bun version patch

# Minor (new feature, backward-compatible)
bun version minor

# Major (breaking change)
bun version major
```

**Rule:** Never commit a functional change without updating `package.json` version. If the diff of a PR touches `src/`, `prisma/`, `mini-services/`, or `docs/` content files, the version field MUST change.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`

Scope (optional): `sidebar`, `toc`, `editor`, `search`, `theme`, `api`, `mdx`, `css`

## Code Style

- **TypeScript** throughout, strict mode
- **Tailwind CSS 4** + shadcn/ui components, no indigo/blue unless specified
- **ESLint** + **Prettier** with tailwindcss plugin
- **markdownlint** for `.md` / `.mdx` content files
- Run `bun run lint:all` before committing

## Content Files

- `.mdx` and `.md` files live in `docs/` at project root
- Each file must have YAML frontmatter: `title`, `section`, `order`
- Optional: `sectionOrder`, `slug` (defaults to filename)
- If both `.md` and `.mdx` exist for the same slug, `.mdx` takes priority

## Pull Request Checklist

- [ ] Version bumped in `package.json` (if functional change)
- [ ] `bun run lint:all` passes
- [ ] `bun run test` passes (all tests green)
- [ ] `bun run build` succeeds
- [ ] New content pages work in navigation and search
- [ ] Responsive layout verified (mobile + desktop)
- [ ] Dark and light themes render correctly
