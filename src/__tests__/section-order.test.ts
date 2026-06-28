import { describe, it, expect } from "vitest";
import { calculateSectionOrder } from "@/lib/section-order";
import type { NavSection } from "@/lib/mdx-utils";

function makeNav(sections: { title: string; order: number }[]): NavSection[] {
  return sections.map((s, i) => ({
    title: s.title,
    order: s.order,
    items: [
      { slug: `${s.title.toLowerCase()}-${i}`, title: s.title, order: 1 },
    ],
  }));
}

describe("calculateSectionOrder", () => {
  it("возвращает maxOrder + 100 для позиции end", () => {
    const nav = makeNav([
      { title: "A", order: 100 },
      { title: "B", order: 200 },
    ]);
    const result = calculateSectionOrder(nav, "end", "", "New");

    expect(result.sectionOrder).toBe(300);
    expect(result.needsRenumber).toBe(false);
  });

  it("возвращает maxOrder + 100 для пустой навигации", () => {
    const result = calculateSectionOrder([], "end", "", "First");
    expect(result.sectionOrder).toBe(100);
  });

  it("вставляет before с усреднением order", () => {
    const nav = makeNav([
      { title: "A", order: 100 },
      { title: "B", order: 200 },
    ]);
    const result = calculateSectionOrder(nav, "before", "B", "New");

    expect(result.sectionOrder).toBe(150);
    expect(result.needsRenumber).toBe(false);
  });

  it("вставляет after с усреднением order", () => {
    const nav = makeNav([
      { title: "A", order: 100 },
      { title: "B", order: 300 },
    ]);
    const result = calculateSectionOrder(nav, "after", "A", "New");

    expect(result.sectionOrder).toBe(200);
    expect(result.needsRenumber).toBe(false);
  });

  it("before первой секции — усреднение с 0", () => {
    const nav = makeNav([{ title: "A", order: 100 }]);
    const result = calculateSectionOrder(nav, "before", "A", "New");

    expect(result.sectionOrder).toBe(50);
  });

  it("after последней секции — усреднение с refOrder + 200", () => {
    const nav = makeNav([{ title: "A", order: 100 }]);
    const result = calculateSectionOrder(nav, "after", "A", "New");

    // neighborOrder = refOrder + 200 = 300, sectionOrder = (100 + 300) / 2 = 200
    expect(result.sectionOrder).toBe(200);
  });

  it("коллизия при before — запускает ренумерацию", () => {
    const nav = makeNav([
      { title: "A", order: 100 },
      { title: "B", order: 100 },
    ]);
    const result = calculateSectionOrder(nav, "before", "B", "New");

    expect(result.needsRenumber).toBe(true);
    expect(result.sectionOrder).toBeDefined();
    // Новая секция должна быть в renumberedSections
    expect(result.renumberedSections["New"]).toBeDefined();
  });

  it("коллизия при after — запускает ренумерацию", () => {
    const nav = makeNav([
      { title: "A", order: 100 },
      { title: "B", order: 100 },
    ]);
    const result = calculateSectionOrder(nav, "after", "A", "New");

    expect(result.needsRenumber).toBe(true);
  });

  it("несуществующий ref — fallback на length * 100", () => {
    const nav = makeNav([{ title: "A", order: 100 }]);
    const result = calculateSectionOrder(nav, "before", "NonExistent", "New");

    expect(result.sectionOrder).toBe(100);
    expect(result.needsRenumber).toBe(false);
  });

  it("ренумерация даёт уникальные 100-шаговые order", () => {
    // Одинаковые order → коллизия после after A: (100+100)/2 = 100 = refOrder
    const nav = makeNav([
      { title: "A", order: 100 },
      { title: "B", order: 100 },
    ]);
    const result = calculateSectionOrder(nav, "after", "A", "New");

    expect(result.needsRenumber).toBe(true);
    const values = Object.values(result.renumberedSections);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("пустой ref при before/after ведёт себя как end", () => {
    const nav = makeNav([{ title: "A", order: 100 }]);
    const result = calculateSectionOrder(nav, "before", "", "New");

    expect(result.sectionOrder).toBe(200);
    expect(result.needsRenumber).toBe(false);
  });
});
