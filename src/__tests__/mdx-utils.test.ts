import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

// ── In-memory FS mock ───────────────────────────────────────────────
const memFS = new Map<string, string>();

vi.mock("fs", () => ({
  default: {
    readdirSync: (dir: string) => {
      const prefix = dir.endsWith("/") ? dir : dir + "/";
      return [...memFS.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length));
    },
    readFileSync: (p: string) => {
      const content = memFS.get(p);
      if (content === undefined)
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      return content;
    },
    writeFileSync: (p: string, data: string) => {
      memFS.set(p, data);
    },
    existsSync: (p: string) => memFS.has(p),
  },
}));

vi.mock("github-slugger", () => {
  let counter = 0;
  return {
    default: class GithubSlugger {
      slug(text: string) {
        counter++;
        return `${text
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")}-${counter}`;
      }
    },
  };
});

// ── Import after mocks ──────────────────────────────────────────────
import {
  getAllSlugs,
  getDocBySlug,
  getAllDocs,
  getNavigation,
  extractHeadings,
  getAdjacentPages,
  getPageTitle,
  getSectionForPage,
  getAllPageIds,
} from "@/lib/mdx-utils";

const CONTENT_DIR = path.join(process.cwd(), "docs");

function putMdx(
  slug: string,
  frontmatter: Record<string, unknown>,
  body: string,
) {
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => (typeof v === "string" ? `${k}: "${v}"` : `${k}: ${v}`))
    .join("\n");
  memFS.set(`${CONTENT_DIR}/${slug}.mdx`, `---\n${fm}\n---\n\n${body}`);
}

beforeEach(() => {
  memFS.clear();
});

// ── getAllSlugs ──────────────────────────────────────────────────────
describe("getAllSlugs", () => {
  it("возвращает пустой массив при пустой директории", () => {
    expect(getAllSlugs()).toEqual([]);
  });

  it("возвращает slugи без .mdx расширения", () => {
    putMdx("intro", { title: "Intro" }, "body");
    putMdx("api-ref", { title: "API" }, "body");
    const slugs = getAllSlugs();
    expect(slugs).toContain("api-ref");
    expect(slugs).toContain("intro");
    expect(slugs).toHaveLength(2);
  });

  it("игнорирует не-mdx файлы", () => {
    memFS.set(`${CONTENT_DIR}/readme.txt`, "hello");
    putMdx("only-mdx", { title: "MDX" }, "body");
    expect(getAllSlugs()).toEqual(["only-mdx"]);
  });
});

// ── getDocBySlug ─────────────────────────────────────────────────────
describe("getDocBySlug", () => {
  it("парсит frontmatter и возвращает контент", () => {
    putMdx(
      "test",
      { title: "Test", section: "Demo", order: 3, slug: "test" },
      "# Hello",
    );
    const doc = getDocBySlug("test");

    expect(doc.meta.title).toBe("Test");
    expect(doc.meta.section).toBe("Demo");
    expect(doc.meta.order).toBe(3);
    expect(doc.meta.slug).toBe("test");
    expect(doc.content.trim()).toBe("# Hello");
  });

  it("бросает ENOENT для несуществующего slug", () => {
    expect(() => getDocBySlug("ghost")).toThrow();
  });

  it("использует дефолты если frontmatter неполный", () => {
    putMdx("minimal", { title: "Min" }, "body");
    const doc = getDocBySlug("minimal");

    expect(doc.meta.section).toBe("Uncategorized");
    expect(doc.meta.sectionOrder).toBe(0);
    expect(doc.meta.order).toBe(0);
    expect(doc.meta.slug).toBe("minimal");
  });

  it("поддерживает section-order через дефис", () => {
    putMdx("legacy", { title: "L", "section-order": 42 }, "body");
    expect(getDocBySlug("legacy").meta.sectionOrder).toBe(42);
  });

  it("sectionOrder из frontmatter приоритетнее section-order", () => {
    putMdx(
      "prio",
      { title: "P", sectionOrder: 10, "section-order": 99 },
      "body",
    );
    expect(getDocBySlug("prio").meta.sectionOrder).toBe(10);
  });
});

// ── getAllDocs ───────────────────────────────────────────────────────
describe("getAllDocs", () => {
  it("возвращает массив всех документов", () => {
    putMdx("a", { title: "A" }, "body a");
    putMdx("b", { title: "B" }, "body b");
    const docs = getAllDocs();
    expect(docs).toHaveLength(2);
    expect(docs[0].content.trim()).toBe("body a");
    expect(docs[1].content.trim()).toBe("body b");
  });
});

// ── getNavigation ────────────────────────────────────────────────────
describe("getNavigation", () => {
  it("группирует документы по секциям", () => {
    putMdx(
      "s1-p1",
      {
        title: "S1P1",
        section: "Sec1",
        sectionOrder: 100,
        order: 1,
        slug: "s1-p1",
      },
      "a",
    );
    putMdx(
      "s2-p1",
      {
        title: "S2P1",
        section: "Sec2",
        sectionOrder: 200,
        order: 1,
        slug: "s2-p1",
      },
      "b",
    );
    putMdx(
      "s1-p2",
      {
        title: "S1P2",
        section: "Sec1",
        sectionOrder: 100,
        order: 2,
        slug: "s1-p2",
      },
      "c",
    );

    const nav = getNavigation();
    expect(nav).toHaveLength(2);
    expect(nav[0].title).toBe("Sec1");
    expect(nav[0].items).toHaveLength(2);
    expect(nav[1].title).toBe("Sec2");
  });

  it("сортирует секции по sectionOrder", () => {
    putMdx(
      "x",
      { title: "X", section: "Beta", sectionOrder: 200, order: 1, slug: "x" },
      "",
    );
    putMdx(
      "y",
      { title: "Y", section: "Alpha", sectionOrder: 100, order: 1, slug: "y" },
      "",
    );

    const nav = getNavigation();
    expect(nav[0].title).toBe("Alpha");
    expect(nav[1].title).toBe("Beta");
  });

  it("сортирует элементы внутри секции по order", () => {
    putMdx(
      "second",
      {
        title: "Second",
        section: "S",
        sectionOrder: 100,
        order: 2,
        slug: "second",
      },
      "",
    );
    putMdx(
      "first",
      {
        title: "First",
        section: "S",
        sectionOrder: 100,
        order: 1,
        slug: "first",
      },
      "",
    );

    const nav = getNavigation();
    expect(nav[0].items[0].title).toBe("First");
    expect(nav[0].items[1].title).toBe("Second");
  });

  it("возвращает сниппет из контента", () => {
    putMdx(
      "snip",
      {
        title: "Snip",
        section: "S",
        sectionOrder: 100,
        order: 1,
        slug: "snip",
      },
      "# Title\n\nSome **bold** text and `code` here\n\nMore content",
    );

    const nav = getNavigation();
    const snippet = nav[0].items[0].snippet;
    expect(snippet).not.toContain("#");
    expect(snippet).not.toContain("**");
    expect(snippet).toContain("Some bold text");
  });

  it("использует минимальный sectionOrder из файлов в секции", () => {
    putMdx(
      "a",
      { title: "A", section: "Mix", sectionOrder: 50, order: 1, slug: "a" },
      "",
    );
    putMdx(
      "b",
      { title: "B", section: "Mix", sectionOrder: 30, order: 2, slug: "b" },
      "",
    );

    const nav = getNavigation();
    expect(nav[0].order).toBe(30);
  });
});

// ── extractHeadings ──────────────────────────────────────────────────
describe("extractHeadings", () => {
  it("извлекает h2 и h3 из MDX контента", () => {
    const content =
      "## Заголовок 2\n\nтекст\n\n### Подзаголовок\n\nещё текст\n\n## Ещё h2";
    const headings = extractHeadings(content);

    expect(headings).toHaveLength(3);
    expect(headings[0].level).toBe(2);
    expect(headings[0].text).toBe("Заголовок 2");
    expect(headings[1].level).toBe(3);
    expect(headings[2].level).toBe(2);
  });

  it("игнорирует h1", () => {
    const headings = extractHeadings("# H1\n\n## H2");
    expect(headings).toHaveLength(1);
    expect(headings[0].level).toBe(2);
  });

  it("убирает **bold** и `code` из текста заголовка", () => {
    const headings = extractHeadings("## **Bold** header with `code`");
    expect(headings[0].text).toBe("Bold header with code");
  });

  it("генерирует уникальные id для одинаковых заголовков", () => {
    const headings = extractHeadings("## Test\n\n## Test");
    expect(headings[0].id).not.toBe(headings[1].id);
  });
});

// ── getAdjacentPages ─────────────────────────────────────────────────
describe("getAdjacentPages", () => {
  beforeEach(() => {
    putMdx(
      "first",
      {
        title: "First",
        section: "S",
        sectionOrder: 100,
        order: 1,
        slug: "first",
      },
      "",
    );
    putMdx(
      "middle",
      {
        title: "Middle",
        section: "S",
        sectionOrder: 100,
        order: 2,
        slug: "middle",
      },
      "",
    );
    putMdx(
      "last",
      {
        title: "Last",
        section: "S",
        sectionOrder: 100,
        order: 3,
        slug: "last",
      },
      "",
    );
  });

  it("возвращает prev и next для среднего элемента", () => {
    const adj = getAdjacentPages("middle");
    expect(adj.prev?.slug).toBe("first");
    expect(adj.next?.slug).toBe("last");
  });

  it("нет prev для первого элемента", () => {
    const adj = getAdjacentPages("first");
    expect(adj.prev).toBeUndefined();
    expect(adj.next?.slug).toBe("middle");
  });

  it("нет next для последнего элемента", () => {
    const adj = getAdjacentPages("last");
    expect(adj.prev?.slug).toBe("middle");
    expect(adj.next).toBeUndefined();
  });
});

// ── getPageTitle / getSectionForPage / getAllPageIds ─────────────────
describe("getPageTitle", () => {
  it("возвращает title документа", () => {
    putMdx("t", { title: "My Title" }, "body");
    expect(getPageTitle("t")).toBe("My Title");
  });
});

describe("getSectionForPage", () => {
  it("возвращает секцию документа", () => {
    putMdx("s", { title: "T", section: "MySection" }, "body");
    expect(getSectionForPage("s")).toBe("MySection");
  });
});

describe("getAllPageIds", () => {
  it("возвращает плоский список slugов в порядке навигации", () => {
    putMdx(
      "z-last",
      { title: "Z", section: "B", sectionOrder: 200, order: 1, slug: "z-last" },
      "",
    );
    putMdx(
      "a-first",
      {
        title: "A",
        section: "A",
        sectionOrder: 100,
        order: 1,
        slug: "a-first",
      },
      "",
    );

    const ids = getAllPageIds();
    expect(ids).toEqual(["a-first", "z-last"]);
  });
});
