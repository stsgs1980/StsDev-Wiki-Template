"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/docs/header";
import Sidebar from "@/components/docs/sidebar";
import TOC from "@/components/docs/toc";
import SearchDialog from "@/components/docs/search-dialog";
import { ChevronLeft, ChevronRight, ArrowUp } from "lucide-react";
import type { NavSection, Heading } from "@/lib/mdx-utils";

const WIKI_SECTION = "О Sts Wiki";

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
  version?: string;
}

/**
 * Hook encapsulating search dialog and mobile menu state + Cmd+K shortcut.
 */
function useDocsShellUI() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    searchOpen,
    setSearchOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
  };
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
  version,
}: DocsShellProps) {
  const router = useRouter();
  const [activeHeading, setActiveHeading] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { searchOpen, setSearchOpen, mobileMenuOpen, setMobileMenuOpen } =
    useDocsShellUI();

  const handleNavigate = useCallback(
    (targetSlug: string) => {
      router.push(`/docs/${targetSlug}/`);
      setMobileMenuOpen(false);
    },
    [router, setMobileMenuOpen],
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
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
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

  const isWikiTab = section === WIKI_SECTION;

  // Filter navigation: wiki tab shows only "О Sts Wiki" section,
  // docs tab shows everything except "О Sts Wiki"
  const filteredNav = isWikiTab
    ? navigation.filter((s) => s.title === WIKI_SECTION)
    : navigation.filter((s) => s.title !== WIKI_SECTION);

  // Scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Header
        onSearchOpen={() => setSearchOpen(true)}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
        currentSlug={slug}
        canEdit={canEdit}
        version={version}
      />

      {/* Golden Split Grid — phi-layout: 1fr 1.618fr proportions
          Desktop (xl+): sidebar(280px) + content(1.618fr) + TOC(220px)
          Tablet: content(1.618fr) + TOC(1fr)
          Mobile: single column */}
      <div className="docs-golden-grid">
        {/* Sidebar — grid column 1 on xl+ */}
        <Sidebar
          currentSlug={slug}
          navigation={filteredNav}
          onNavigate={handleNavigate}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          canEdit={canEdit}
        />

        {/* Content — golden section (1.618fr) */}
        <main className="flex min-w-0 flex-col">
          <div
            ref={contentRef}
            className="px-6 py-8 xl:px-10 xl:py-12"
            style={{ gap: "var(--fib-3)" }}
          >
            {/* Breadcrumb */}
            <div className="text-foreground/60 mb-6 flex items-center gap-2 text-[var(--text-sm)]">
              <Link
                href="/docs/"
                className="hover:text-foreground transition-colors"
              >
                Docs
              </Link>
              <span>/</span>
              <span>{section}</span>
            </div>

            {/* Page Title */}
            <h1 className="text-foreground mb-4 leading-tight font-medium text-[var(--text-3xl)]">
              {title}
            </h1>

            {/* MDX Content — pre-rendered on server */}
            {renderedContent}
          </div>

          {/* Navigation — full width of main, pushed to bottom via mt-auto */}
          <div className="border-border mt-auto border-t px-6 py-6 xl:px-10">
            <div className="grid grid-cols-2 gap-4">
              {adjacent.prev ? (
                <button
                  onClick={() => handleNavigate(adjacent.prev!.slug)}
                  className="group border-border hover:border-ring hover:bg-muted/50 flex items-start gap-2 rounded-lg border p-4 text-left transition-colors"
                >
                  <ChevronLeft className="text-muted-foreground group-hover:text-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <div className="text-muted-foreground mb-1 text-[var(--text-xs)]">
                      Назад
                    </div>
                    <div className="text-foreground/80 group-hover:text-foreground text-[var(--text-base)]">
                      {adjacent.prev.title}
                    </div>
                  </div>
                </button>
              ) : (
                <div />
              )}
              {adjacent.next ? (
                <button
                  onClick={() => handleNavigate(adjacent.next!.slug)}
                  className="group border-border hover:border-ring hover:bg-muted/50 flex items-start justify-end gap-2 rounded-lg border p-4 text-left transition-colors"
                >
                  <div className="text-right">
                    <div className="text-muted-foreground mb-1 text-[var(--text-xs)]">
                      Далее
                    </div>
                    <div className="text-foreground/80 group-hover:text-foreground text-[var(--text-base)]">
                      {adjacent.next.title}
                    </div>
                  </div>
                  <ChevronRight className="text-muted-foreground group-hover:text-foreground mt-0.5 h-4 w-4 shrink-0" />
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
        navigation={filteredNav}
      />

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 fixed right-6 bottom-6 z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-lg transition-colors"
          aria-label="Наверх"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
