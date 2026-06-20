import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { execSync } from 'child_process';
import { revalidatePath } from 'next/cache';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'docs');

function gitCommitAll(message: string): void {
  try {
    execSync('git add -A src/content/docs/', { cwd: process.cwd(), stdio: 'pipe' });
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: process.cwd(),
      stdio: 'pipe',
    });
    try {
      execSync('git push', { cwd: process.cwd(), stdio: 'pipe', timeout: 10000 });
    } catch {
      // Push failed silently
    }
  } catch {
    // Git not available or no changes
  }
}

/**
 * PUT /api/docs/reorder-section — reorder sections by reassigning sectionOrder values
 *
 * Body: { sections: { [sectionName: string]: number } }
 * Each section gets its new sectionOrder value.
 * This updates ALL documents in each section with the new sectionOrder.
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { sections } = body as { sections: Record<string, number> };

  if (!sections || typeof sections !== 'object') {
    return NextResponse.json(
      { error: 'sections object is required' },
      { status: 400 }
    );
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'));
  const updatedSections = new Set<string>();

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    const section = data.section || 'Uncategorized';

    if (section in sections) {
      const newOrder = sections[section];
      data.sectionOrder = newOrder;

      // Rebuild the file
      const newFrontmatter = Object.entries(data)
        .map(([key, value]) => {
          if (typeof value === 'string') return `${key}: "${(value as string).replace(/"/g, '\\"')}"`;
          if (typeof value === 'number') return `${key}: ${value}`;
          if (typeof value === 'boolean') return `${key}: ${value}`;
          if (value === null || value === undefined) return `${key}: null`;
          return `${key}: ${JSON.stringify(value)}`;
        })
        .join('\n');

      const newContent = `---\n${newFrontmatter}\n---\n\n${content}`;
      fs.writeFileSync(filePath, newContent, 'utf-8');
      updatedSections.add(section);
    }
  }

  if (updatedSections.size > 0) {
    gitCommitAll(`docs: reorder sections — ${[...updatedSections].join(', ')}`);
  }

  revalidatePath('/docs');

  return NextResponse.json({
    success: true,
    updatedSections: [...updatedSections],
  });
}
