'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

/**
 * ExpandableContent — universal click-to-expand wrapper for docs-content.
 *
 * Any block-level child (code block, mermaid diagram, table, image) inside
 * docs-content becomes expandable on click. No per-component changes needed.
 *
 * How it works:
 * - Event delegation on the wrapper div
 * - On click, finds the closest "expandable block" ancestor
 * - Clones it into a fixed fullscreen overlay
 * - Click outside or press Escape to close
 */

/** CSS selectors for expandable block types */
const EXPANDABLE_SELECTOR = [
  'div.my-4',                          // CodeBlock, PlainCodeBlock, MermaidDiagram, Callout
  'div.overflow-x-auto',               // table overflow wrappers
  'img.max-w-full',                    // images
].join(', ');

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
    style.textContent = `.docs-content ${EXPANDABLE_SELECTOR} { cursor: pointer; }`;
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
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={close}
        >
          <div
            className="bg-background rounded-lg border border-border overflow-auto max-w-[95vw] max-h-[92vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="sticky top-0 z-10 flex justify-end p-2 bg-background/80 backdrop-blur-sm border-b border-border">
              <button
                onClick={close}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                ✕ Закрыть
              </button>
            </div>
            {/* Cloned content */}
            <div
              className="p-6"
              style={{ fontSize: '15px' }}
              dangerouslySetInnerHTML={{ __html: expandedHtml }}
            />
          </div>
        </div>
      )}
    </>
  );
}