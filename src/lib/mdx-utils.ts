/**
 * MDX Content Utilities
 * Reads .mdx files from src/content/docs, parses frontmatter,
 * generates navigation structure, and provides content for rendering.
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'docs');

export interface DocMeta {
  title: string;
  section: string;
  order: number;
  slug: string;
}

export interface DocPage {
  meta: DocMeta;
  content: string;  // Raw MDX content (without frontmatter)
}

export interface NavSection {
  title: string;
  items: { slug: string; title: string }[];
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * Get all MDX slugs (filenames without extension)
 */
export function getAllSlugs(): string[] {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'));
  return files.map((f) => f.replace(/\.mdx$/, ''));
}

/**
 * Get a single doc page by slug
 */
export function getDocBySlug(slug: string): DocPage {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    meta: {
      title: data.title || slug,
      section: data.section || 'Uncategorized',
      order: data.order ?? 0,
      slug: data.slug || slug,
    },
    content,
  };
}

/**
 * Get all docs with metadata
 */
export function getAllDocs(): DocPage[] {
  const slugs = getAllSlugs();
  return slugs.map((slug) => getDocBySlug(slug));
}

/**
 * Generate navigation structure from frontmatter data
 * Groups pages by section, sorts by order within each section
 */
export function getNavigation(): NavSection[] {
  const docs = getAllDocs();
  
  // Group by section
  const sectionMap = new Map<string, DocMeta[]>();
  for (const doc of docs) {
    const section = doc.meta.section;
    if (!sectionMap.has(section)) {
      sectionMap.set(section, []);
    }
    sectionMap.get(section)!.push(doc.meta);
  }

  // Sort each section's items by order
  const navSections: NavSection[] = [];
  for (const [sectionTitle, items] of sectionMap) {
    items.sort((a, b) => a.order - b.order);
    navSections.push({
      title: sectionTitle,
      items: items.map((item) => ({
        slug: item.slug,
        title: item.title,
      })),
    });
  }

  return navSections;
}

/**
 * Get all page IDs (slugs) in navigation order
 */
export function getAllPageIds(): string[] {
  const nav = getNavigation();
  return nav.flatMap((section) => section.items.map((item) => item.slug));
}

/**
 * Get the section title for a page
 */
export function getSectionForPage(slug: string): string {
  const doc = getDocBySlug(slug);
  return doc.meta.section;
}

/**
 * Get adjacent pages (prev/next) in navigation order
 */
export function getAdjacentPages(slug: string): {
  prev?: { slug: string; title: string };
  next?: { slug: string; title: string };
} {
  const allIds = getAllPageIds();
  const idx = allIds.indexOf(slug);
  return {
    prev: idx > 0 ? { slug: allIds[idx - 1], title: getDocBySlug(allIds[idx - 1]).meta.title } : undefined,
    next: idx < allIds.length - 1 ? { slug: allIds[idx + 1], title: getDocBySlug(allIds[idx + 1]).meta.title } : undefined,
  };
}

/**
 * Extract headings from MDX content (for TOC)
 */
export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const slugger = new GithubSlugger();
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/\*\*/g, '').replace(/`/g, '');
      const id = slugger.slug(text);
      headings.push({ id, text, level });
    }
  }
  return headings;
}

/**
 * Get page title by slug
 */
export function getPageTitle(slug: string): string {
  const doc = getDocBySlug(slug);
  return doc.meta.title;
}
