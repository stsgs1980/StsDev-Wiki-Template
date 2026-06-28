import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deleteDoc, saveDoc, createDoc, uploadDocs } from "@/lib/docs-actions";

// ── Fetch mock ───────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── deleteDoc ────────────────────────────────────────────────────────
describe("deleteDoc", () => {
  it("возвращает success: true при 200", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = await deleteDoc("test-page");
    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/docs/test-page", {
      method: "DELETE",
    });
  });

  it("возвращает success: false с error при 404", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Not found" }),
    });

    const result = await deleteDoc("ghost");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Not found");
  });

  it("обрабатывает сетевую ошибку", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await deleteDoc("net-err");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to fetch");
  });
});

// ── saveDoc ──────────────────────────────────────────────────────────
describe("saveDoc", () => {
  const doc = {
    meta: { title: "Title", section: "S", order: 1, slug: "test" },
    content: "# Hello",
  };

  it("отправляет PUT с корректным body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = await saveDoc(doc, "test", "docs: update test");
    expect(result.success).toBe(true);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/docs/test");
    expect(opts.method).toBe("PUT");

    const body = JSON.parse(opts.body);
    expect(body.title).toBe("Title");
    expect(body.content).toBe("# Hello");
    expect(body.commitMessage).toBe("docs: update test");
  });

  it("использует дефолтный commitMessage если не передан", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await saveDoc(doc, "test", "");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.commitMessage).toBe("docs: update test");
  });

  it("возвращает error при не-ok ответе", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Save failed" }),
    });

    const result = await saveDoc(doc, "test", "msg");
    expect(result.success).toBe(false);
  });
});

// ── createDoc ────────────────────────────────────────────────────────
describe("createDoc", () => {
  it("возвращает slug из ответа", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, slug: "my-new-page" }),
    });

    const result = await createDoc(
      "Title",
      "my-new-page",
      "Section",
      "100",
      "1",
      "# Content",
    );
    expect(result.success).toBe(true);
    expect(result.slug).toBe("my-new-page");
  });

  it("возвращает error при конфликте 409", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: "Slug already exists" }),
    });

    const result = await createDoc("T", "dup", "S", "100", "1", "C");
    expect(result.success).toBe(false);
    expect(result.error).toContain("already exists");
  });

  it('передаёт "Uncategorized" если section пустой', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, slug: "x" }),
    });

    await createDoc("T", "x", "", "", "0", "C");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.section).toBe("Uncategorized");
  });
});

// ── uploadDocs ───────────────────────────────────────────────────────
describe("uploadDocs", () => {
  it("отправляет FormData с файлами и section", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [{ slug: "uploaded-page" }] }),
    });

    const file = new File(["content"], "test.mdx", { type: "text/markdown" });
    const fileList = Object.assign([file], {
      length: 1,
      item: (i: number) => file,
    });

    const result = await uploadDocs(fileList, "Uploads");
    expect(result.success).toBe(true);
    expect(result.slug).toBe("uploaded-page");

    const formData = mockFetch.mock.calls[0][1].body;
    expect(formData).toBeInstanceOf(FormData);
  });

  it("возвращает success без slug если results пустой", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    const file = new File(["c"], "f.mdx");
    const fileList = Object.assign([file], { length: 1, item: () => file });

    const result = await uploadDocs(fileList, "S");
    expect(result.success).toBe(true);
    expect(result.slug).toBeUndefined();
  });

  it("возвращает error при не-ok ответе", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Upload failed" }),
    });

    const file = new File(["c"], "f.mdx");
    const fileList = Object.assign([file], { length: 1, item: () => file });

    const result = await uploadDocs(fileList, "S");
    expect(result.success).toBe(false);
  });
});
