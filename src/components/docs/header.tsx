'use client';

import React from 'react';
import Link from 'next/link';
import { SearchButton } from './search-dialog';
import ThemeToggle from './theme-toggle';
import { Menu, X, ExternalLink, Plus, Upload } from 'lucide-react';

interface HeaderProps {
  onSearchOpen: () => void;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  currentSlug?: string;
  canEdit?: boolean;
}

export default function Header({
  onSearchOpen,
  onMobileMenuToggle,
  isMobileMenuOpen,
  currentSlug,
  canEdit = true,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-[49px] flex items-center border-b border-border bg-background">
      <div className="flex items-center w-full px-4">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMobileMenuToggle}
            className="xl:hidden p-1.5 -ml-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          <Link href="/docs/approaches-overview/" className="flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-foreground"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[15px] font-semibold text-foreground">
              StsDev Wiki
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            <span className="px-3 py-1 text-[14px] font-medium text-foreground bg-muted rounded-full">
              Docs
            </span>
          </nav>
        </div>

        {/* Right: Actions + Theme + Search */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Create new page — only in server mode */}
          {canEdit && (
            <Link
              href="/docs/new/"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              title="Create page"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Create</span>
            </Link>
          )}

          {/* Edit current page — only in server mode */}
          {canEdit && currentSlug && (
            <Link
              href={`/docs/${currentSlug}/edit/`}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              title="Edit this page"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              <span className="hidden lg:inline">Edit</span>
            </Link>
          )}

          <ThemeToggle />
          <SearchButton onClick={onSearchOpen} />

          <a
            href="#"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
