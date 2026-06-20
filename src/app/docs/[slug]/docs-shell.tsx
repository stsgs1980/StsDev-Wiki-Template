'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/docs/header';
import Sidebar from '@/components/docs/sidebar';
import TOC from '@/components/docs/toc';
import SearchDialog from '@/components/docs/search-dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { NavSection, Heading } from '@/lib/mdx-utils';

interface AdjacentPages {
  prev?: { slug: string; title: string };
  next?: { slug: string; title: string };
}

interface DocsShellProps {
  slug: string;
  title: string;
  section: string;
  renderedContent: React.ReactNode;
  navigation: NavSection[];
  headings: Heading[];
  adjacent: AdjacentPages;
  canEdit?: boolean;
}

export default function DocsShell({
  slug,
  title,
  section,
  renderedContent,
  navigation,
  headings,
  adjacent,
  canEdit = true,
}: DocsShellProps) {
  const router = useRouter();
  const [activeHeading, setActiveHeading] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleNavigate = useCallback(
    (targetSlug: string) => {
      router.push(`/docs/${targetSlug}/`);
      setMobileMenuOpen(false);
    },
    [router]
  );

  // Track active heading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    const timer = setTimeout(() => {
      headings.forEach((h) => {
        const el = document.getElementById(h.id);
        if (el) observer.observe(el);
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [headings]);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        onSearchOpen={() => setSearchOpen(true)}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
        currentSlug={slug}
        canEdit={canEdit}
      />

      {/* Golden Split Grid — phi-layout: 1fr 1.618fr proportions
          Desktop (xl+): sidebar(280px) + content(1.618fr) + TOC(220px)
          Tablet: content(1.618fr) + TOC(1fr)
          Mobile: single column */}
      <div className="docs-golden-grid">
        {/* Sidebar — grid column 1 on xl+ */}
        <Sidebar
          currentSlug={slug}
          navigation={navigation}
          onNavigate={handleNavigate}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Content — golden section (1.618fr) */}
        <main className="min-w-0">
          <div
            ref={contentRef}
            className="mx-auto max-w-[840px] px-6 xl:px-10 py-8 xl:py-12"
            style={{ gap: 'var(--fib-3)' }}
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] text-foreground/60 mb-6">
              <span>Docs</span>
              <span>/</span>
              <span>{section}</span>
            </div>

            {/* Page Title */}
            <h1 className="text-[32px] font-medium leading-tight text-foreground mb-4">
              {title}
            </h1>

            {/* MDX Content — pre-rendered on server */}
            {renderedContent}

            {/* Navigation */}
            <div className="mt-12 pt-6 border-t border-border grid grid-cols-2 gap-4">
              {adjacent.prev ? (
                <button
                  onClick={() => handleNavigate(adjacent.prev.slug)}
                  className="group flex items-start gap-2 p-4 rounded-lg border border-border hover:border-ring transition-colors text-left hover:bg-muted/50"
                >
                  <ChevronLeft className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                  <div>
                    <div className="text-[12px] text-muted-foreground mb-1">
                      Previous
                    </div>
                    <div className="text-[14px] text-foreground/80 group-hover:text-foreground">
                      {adjacent.prev.title}
                    </div>
                  </div>
                </button>
              ) : (
                <div />
              )}
              {adjacent.next ? (
                <button
                  onClick={() => handleNavigate(adjacent.next.slug)}
                  className="group flex items-start gap-2 p-4 rounded-lg border border-border hover:border-ring transition-colors text-left justify-end hover:bg-muted/50"
                >
                  <div className="text-right">
                    <div className="text-[12px] text-muted-foreground mb-1">
                      Next
                    </div>
                    <div className="text-[14px] text-foreground/80 group-hover:text-foreground">
                      {adjacent.next.title}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>

        {/* TOC — grid column 3 on xl+ */}
        <TOC headings={headings} activeId={activeHeading} />
      </div>

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
        navigation={navigation}
      />
    </div>
  );
}
