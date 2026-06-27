import { notFound } from "next/navigation";
import type { Metadata } from "next";
import React from "react";
import { getDocBySlug, getNavigation, extractHeadings } from "@/lib/mdx-utils";
import MDXContent from "@/components/mdx/mdx-content";
import DocsShell from "./docs-shell";
import { getVersion } from "@/lib/version";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fully dynamic — no ISR cache, always reads fresh files from disk.
// This ensures newly created pages are immediately accessible.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const doc = getDocBySlug(slug);
    return {
      title: `${doc.meta.title} — StsDev Wiki`,
      description: `Documentation: ${doc.meta.title} (${doc.meta.section})`,
    };
  } catch {
    return { title: "StsDev Wiki" };
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
  const headings = extractHeadings(doc.content);
  const section = doc.meta.section;
  const canEdit = process.env.CAN_EDIT !== "false";

  // Get adjacent pages filtered to the current section context
  const WIKI_SECTION = "О Sts Wiki";
  const contextNav =
    section === WIKI_SECTION
      ? navigation.filter((s) => s.title === WIKI_SECTION)
      : navigation.filter((s) => s.title !== WIKI_SECTION);
  const contextSlugs = contextNav.flatMap((s) => s.items.map((i) => i.slug));
  const contextIdx = contextSlugs.indexOf(slug);
  const adjacent = {
    prev:
      contextIdx > 0
        ? {
            slug: contextSlugs[contextIdx - 1],
            title: getDocBySlug(contextSlugs[contextIdx - 1]).meta.title,
          }
        : undefined,
    next:
      contextIdx < contextSlugs.length - 1
        ? {
            slug: contextSlugs[contextIdx + 1],
            title: getDocBySlug(contextSlugs[contextIdx + 1]).meta.title,
          }
        : undefined,
  };

  // Pre-render MDX on the server — MDXRemote is an async Server Component
  // and cannot be used inside a Client Component ('use client').
  const renderedContent = <MDXContent source={doc.content} />;

  const version = getVersion();

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
      version={version.version}
    />
  );
}
