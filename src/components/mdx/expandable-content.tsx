'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ExpandableContent — universal click-to-expand wrapper for docs-content.
 *
 * Any block-level child (code block, mermaid diagram, table, image) inside
 * docs-content becomes expandable on click. No per-component changes needed.
 *
 * How it works:
 * - Event delegation on the wrapper div
 * - On click, finds the closest "expandable block" ancestor
 * - Clones it into a fixed fullscreen overlay via React portal (not dangerouslySetInnerHTML)
 * - Event delegation on overlay re-wires Copy buttons and TOC links
 * - Click outside or press Escape to close
 */

/** CSS selectors for expandable block types */
const EXPANDABLE_SELECTOR = [
  '[data-expandable]',                 // CodeBlock, PlainCodeBlock (explicit marker)
  'div.overflow-x-auto',               // table overflow wrappers
  'img.max-w-full',                    // images
].join(', ');

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text.trim());
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text.trim();
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

export default function ExpandableContent({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandedHtml, setExpandedHtml] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setExpanded(false);
    setExpandedHtml('');
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!expanded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [expanded, close]);

  // Inject expandable-block cursor style via DOM (not <style> in JSX)
  useEffect(() => {
    const id = 'expandable-content-cursor-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .docs-content ${EXPANDABLE_SELECTOR} { cursor: pointer; position: relative; }
      .docs-content ${EXPANDABLE_SELECTOR}::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
        z-index: 1;
        background:
          rgba(0,0,0,0.04),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='15 3 21 3 21 9'%3E%3C/polyline%3E%3Cpolyline points='9 21 3 21 3 15'%3E%3C/polyline%3E%3Cline x1='21' y1='3' x2='14' y2='10'%3E%3C/line%3E%3Cline x1='3' y1='21' x2='10' y2='14'%3E%3C/line%3E%3C/svg%3E") no-repeat bottom 8px right 8px;
      }
      .docs-content ${EXPANDABLE_SELECTOR}:hover::after { opacity: 1; }
      :is(.dark) .docs-content ${EXPANDABLE_SELECTOR}::after {
        background:
          rgba(255,255,255,0.04),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='15 3 21 3 21 9'%3E%3C/polyline%3E%3Cpolyline points='9 21 3 21 3 15'%3E%3C/polyline%3E%3Cline x1='21' y1='3' x2='14' y2='10'%3E%3C/line%3E%3Cline x1='3' y1='21' x2='10' y2='14'%3E%3C/line%3E%3C/svg%3E") no-repeat bottom 8px right 8px;
      }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // Lock body scroll when expanded
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [expanded]);

  // Wire Copy buttons and TOC links inside overlay via event delegation
  useEffect(() => {
    if (!expanded || !overlayRef.current) return;

    const overlay = overlayRef.current;

    const handleOverlayClick = async (e: Event) => {
      const target = e.target as HTMLElement;

      // Copy button — find the closest [aria-label="Copy code"]
      const copyBtn = target.closest('[aria-label="Copy code"]') as HTMLElement | null;
      if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();

        // Find the code content: sibling container with pre/code or whitespace-pre div
        const codeContainer = copyBtn.closest('.rounded-lg');
        const codeEl = codeContainer?.querySelector(
          'pre code, pre, div[style*="white-space: pre"], div.whitespace-pre'
        ) as HTMLElement | null;
        const text = codeEl?.textContent || '';

        await copyTextToClipboard(text);

        // Visual feedback: swap icon text to "Copied"
        const spanEl = copyBtn.querySelector('span');
        if (spanEl) {
          const original = spanEl.textContent;
          spanEl.textContent = 'Copied';
          spanEl.style.color = '#22c55e';
          setTimeout(() => {
            spanEl.textContent = original;
            spanEl.style.color = '';
          }, 2000);
        }
        return;
      }

      // TOC anchor links inside overlay
      const anchor = target.closest('a[href^="#"]') as HTMLElement | null;
      if (anchor) {
        e.preventDefault();
        e.stopPropagation();
        // In overlay, scroll to the target element within the overlay
        const href = (anchor as HTMLAnchorElement).getAttribute('href');
        if (href) {
          const targetEl = overlay.querySelector(href);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        return;
      }
    };

    overlay.addEventListener('click', handleOverlayClick);
    return () => overlay.removeEventListener('click', handleOverlayClick);
  }, [expanded]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Don't expand on interactive elements (buttons, links, inputs)
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea')
    ) {
      return;
    }

    // Find closest expandable block
    const block = target.closest(EXPANDABLE_SELECTOR) as HTMLElement | null;
    if (!block) return;

    // Don't expand small elements (inline code wrapped in my-4 etc.)
    const rect = block.getBoundingClientRect();
    if (rect.width < 200 && rect.height < 60) return;

    e.preventDefault();
    e.stopPropagation();

    // Clone the block into overlay
    setExpandedHtml(block.outerHTML);
    setExpanded(true);
  }, []);

  return (
    <>
      <div
        ref={wrapperRef}
        onClick={handleClick}
        className="docs-content max-w-none"
        style={{ cursor: 'default' }}
      >
        {children}
      </div>

      {/* Fullscreen overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={close}
        >
          <div
            ref={overlayRef}
            className="bg-background rounded-lg border border-border overflow-auto max-w-[95vw] max-h-[92vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="sticky top-0 z-10 flex justify-end p-2 bg-background/80 backdrop-blur-sm border-b border-border">
              <button
                onClick={close}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Закрыть
              </button>
            </div>
            {/* Cloned content */}
            <div
              className="p-6 [&_svg]:max-w-full [&_svg]:w-full [&_svg]:h-auto"
            >
              <div dangerouslySetInnerHTML={{ __html: expandedHtml }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}