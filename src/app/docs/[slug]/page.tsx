import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import React from 'react';
import {
  getAllSlugs,
  getDocBySlug,
  getNavigation,
  getAdjacentPages,
  extractHeadings,
} from '@/lib/mdx-utils';
import MDXContent from '@/components/mdx/mdx-content';
import DocsShell from './docs-shell';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fully dynamic — no ISR cache, always reads fresh files from disk.
// This ensures newly created pages are immediately accessible.
// For GitHub Pages static export this flag is ignored (all pages built at deploy time).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const doc = getDocBySlug(slug);
    return {
      title: `${doc.meta.title} — StsDev Wiki`,
      description: `Documentation: ${doc.meta.title} (${doc.meta.section})`,
    };
  } catch {
    return { title: 'StsDev Wiki' };
  }
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  
  let doc;
  try {
    doc = getDocBySlug(slug);
  } catch {
    notFound();
  }

  const navigation = getNavigation();
  const adjacent = getAdjacentPages(slug);
  const headings = extractHeadings(doc.content);
  const section = doc.meta.section;
  const canEdit = process.env.GITHUB_PAGES !== 'true';

  // Pre-render MDX on the server — MDXRemote is an async Server Component
  // and cannot be used inside a Client Component ('use client').
  const renderedContent = <MDXContent source={doc.content} />;

  return (
    <DocsShell
      slug={slug}
      title={doc.meta.title}
      section={section}
      renderedContent={renderedContent}
      navigation={navigation}
      headings={headings}
      adjacent={adjacent}
      canEdit={canEdit}
    />
  );
}
