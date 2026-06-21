'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

/**
 * CodeBlock — code display with syntax highlighting.
 *
 * Architecture:
 * - Theme-aware: switches oneDark/oneLight based on resolvedTheme
 * - No SSR flash: renders a skeleton placeholder until mounted
 * - Copy button with clipboard API + fallback
 * - Line numbers + optional filename header
 * - CSS custom properties from globals.css (no hardcoded colors)
 */
export function CodeBlock({
  children,
  language = 'text',
  filename,
  showLineNumbers = true,
}: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;
  const codeBg = isDark ? '#0f0f1a' : '#fafafa';
  const headerBg = isDark ? '#15151f' : '#f0f0f0';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const lineNumberColor = isDark ? '#3a3a4a' : '#c8c8c8';
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for contexts where clipboard API is unavailable
      const textarea = document.createElement('textarea');
      textarea.value = children.trim();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Before mount: render a theme-aware placeholder using CSS custom properties
  // to avoid SSR/client mismatch + white flash in dark mode.
  if (!mounted) {
    return (
      <div
        className="my-4 rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--code-border)' }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ background: 'var(--code-header-bg)', borderColor: 'var(--code-border)' }}
        >
          <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
            {filename || language}
          </span>
        </div>
        <div
          className="p-4 font-mono text-[13px] leading-relaxed whitespace-pre overflow-x-auto"
          style={{ background: 'var(--code-bg)', color: 'var(--foreground)' }}
        >
          {children.trim()}
        </div>
      </div>
    );
  }

  // Shared syntax highlighter props
  const highlighterProps = {
    style: (isDark ? oneDark : oneLight) as object,
    language,
    PreTag: 'div' as const,
    showLineNumbers,
    customStyle: {
      margin: 0,
      borderRadius: 0,
      background: codeBg,
      fontSize: '13px',
      padding: '16px',
      border: 'none',
    },
    lineNumberStyle: {
      minWidth: '2.5em',
      paddingRight: '1em',
      color: lineNumberColor,
      userSelect: 'none' as const,
      background: 'transparent',
    },
    codeTagProps: {
      style: {
        fontFamily:
          'var(--font-mono), ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      },
    },
  };

  const headerBar = (
    <div
      className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
      style={{ background: headerBg, borderColor: borderColor }}
    >
      <span
        className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
      >
        {filename || language}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
            isDark
              ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
          }`}
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="my-4 rounded-lg overflow-hidden"
      style={{ border: `1px solid ${borderColor}` }}
      data-expandable
    >
      {headerBar}
      <SyntaxHighlighter {...highlighterProps}>
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * Inline code component — for single-line code snippets within paragraphs.
 * Example: `const x = 1`
 */
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-muted text-foreground/90 text-sm font-mono">
      {children}
    </code>
  );
}

/**
 * Plain code block — for fenced code blocks without a language specifier.
 * Rendered as a monospace scrollable block (not inline code).
 */
export function PlainCodeBlock({ children }: { children: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;
  const codeBg = isDark ? '#0f0f1a' : '#fafafa';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = children.trim();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyButton = (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
        isDark
          ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
      }`}
      aria-label="Copy code"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-500">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );

  if (!mounted) {
    return (
      <div
        className="my-4 rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--code-border)' }}
        data-expandable
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ background: 'var(--code-header-bg)', borderColor: 'var(--code-border)' }}
        >
          <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>terminal</span>
          <div className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400">
            <Copy className="h-3.5 w-3.5" />
            <span>Copy</span>
          </div>
        </div>
        <div
          className="p-4 font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre"
          style={{ background: 'var(--code-bg)', color: 'var(--foreground)' }}
        >
          {children.trim()}
        </div>
      </div>
    );
  }

  return (
    <div
      className="my-4 rounded-lg overflow-hidden"
      style={{ border: `1px solid ${borderColor}` }}
      data-expandable
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{
          background: isDark ? '#15151f' : '#f0f0f0',
          borderColor: borderColor,
        }}
      >
        <span
          className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        >
          terminal
        </span>
        {copyButton}
      </div>
      <div
        className="p-4 font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre"
        style={{
          background: codeBg,
          color: isDark ? '#e5e5e5' : '#333',
        }}
      >
        {children.trim()}
      </div>
    </div>
  );
}

/**
 * Mermaid diagram component
 */
export function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const renderDiagram = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        const isDark = resolvedTheme === 'dark';
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          themeVariables: isDark
            ? {
                background: '#0a0a0f',
                primaryColor: '#1e1e30',
                primaryTextColor: '#E6E6E6',
                primaryBorderColor: 'rgba(125,211,252,0.35)',
                lineColor: 'rgba(125,211,252,0.5)',
                secondaryColor: '#1a1a2a',
                tertiaryColor: '#15151f',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '13px',
                nodeBorder: 'rgba(125,211,252,0.3)',
                mainBkg: '#1e1e30',
                clusterBkg: '#0d0d14',
              }
            : {
                background: '#ffffff',
                primaryColor: '#dbeafe',
                primaryTextColor: '#1e293b',
                primaryBorderColor: '#93c5fd',
                lineColor: '#64748b',
                secondaryColor: '#e0e7ff',
                tertiaryColor: '#f8fafc',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '13px',
                nodeBorder: '#93c5fd',
                mainBkg: '#dbeafe',
                clusterBkg: '#f0f9ff',
                edgeLabelBackground: '#ffffff',
              },
        });
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code.trim());
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [code, resolvedTheme, mounted]);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-border bg-muted p-4 overflow-x-auto">
        <pre className="text-sm text-muted-foreground font-mono">{code}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 rounded-lg border border-border bg-muted/50 p-4 overflow-auto"
      data-expandable
    >
      {svg ? (
        <div
          dangerouslySetInnerHTML={{ __html: svg }}
          className="[&>svg]:max-w-full"
        />
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
        </div>
      )}
    </div>
  );
}

/**
 * Callout component for tips, warnings, info blocks.
 * Usage in MDX:
 *   <Callout type="info">Important information</Callout>
 *   <Callout type="warning">Be careful!</Callout>
 */
const calloutStyles: Record<string, { icon: string; borderColor: string; bgColor: string }> = {
  info: {
    icon: 'i',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-500/5',
  },
  warning: {
    icon: '!',
    borderColor: 'border-yellow-500/40',
    bgColor: 'bg-yellow-500/5',
  },
  tip: {
    icon: '*',
    borderColor: 'border-green-500/40',
    bgColor: 'bg-green-500/5',
  },
  danger: {
    icon: 'x',
    borderColor: 'border-red-500/40',
    bgColor: 'bg-red-500/5',
  },
};

export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warning' | 'tip' | 'danger';
  title?: string;
  children: React.ReactNode;
}) {
  const style = calloutStyles[type] || calloutStyles.info;

  return (
    <div
      className={`my-4 rounded-lg border-l-4 ${style.borderColor} ${style.bgColor} p-4`}
    >
      {title && (
        <div className="font-semibold text-foreground mb-1">{title}</div>
      )}
      <div className="text-muted-foreground text-[15px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

/**
 * Badge component for labels/tags
 */
export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantStyles: Record<string, string> = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
