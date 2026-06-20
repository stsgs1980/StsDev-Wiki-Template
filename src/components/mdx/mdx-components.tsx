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
 * CodeBlock — terminal-style code display with syntax highlighting.
 *
 * Visual design: dark-zai skin, terminal chrome (traffic light dots),
 * cursor-blink on language label, neon accent on copy button.
 *
 * Architecture:
 * - Theme-aware: switches oneDark/oneLight based on resolvedTheme
 * - No SSR flash: renders a skeleton placeholder until mounted
 * - Copy button with clipboard API + fallback
 * - Line numbers + optional filename header
 * - Terminal window chrome (macOS-style dots)
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
  const labelColor = isDark ? '#878992' : '#6b7280';

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

  // Before mount: render a neutral placeholder to avoid SSR/client mismatch + theme flash.
  if (!mounted) {
    return (
      <div
        className="my-4 rounded-lg overflow-hidden"
        style={{ border: `1px solid rgba(0,0,0,0.08)` }}
      >
        {/* Terminal chrome header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ background: '#f0f0f0', borderColor: 'rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div className="zai-terminal-dots">
              <span className="zai-dot-close" />
              <span className="zai-dot-minimize" />
              <span className="zai-dot-maximize" />
            </div>
            <span className="text-xs text-gray-500 font-mono">
              {filename || language}
            </span>
          </div>
        </div>
        <div
          className="p-4 font-mono text-[13px] leading-relaxed whitespace-pre overflow-x-auto"
          style={{ background: '#fafafa', color: '#333' }}
        >
          {children.trim()}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`my-4 rounded-lg overflow-hidden group relative ${isDark ? 'zai-neon-border' : ''}`}
      style={{ border: `1px solid ${borderColor}` }}
    >
      {/* Terminal chrome header — macOS window style */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ background: headerBg, borderColor: borderColor }}
      >
        <div className="flex items-center gap-3">
          {/* Traffic light dots */}
          <div className="zai-terminal-dots">
            <span className="zai-dot-close" />
            <span className="zai-dot-minimize" />
            <span className="zai-dot-maximize" />
          </div>
          {/* Language label with cursor blink */}
          <span
            className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {filename || language}
            <span
              className="zai-cursor-blink inline-block w-[2px] h-[14px] ml-0.5"
              style={{ background: isDark ? '#7dd3fc' : '#0284c7' }}
            />
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors zai-focus-ring ${
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
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={language}
        PreTag="div"
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: codeBg,
          fontSize: '13px',
          padding: '16px',
          border: 'none',
        }}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: lineNumberColor,
          userSelect: 'none',
          background: 'transparent',
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'var(--font-mono), ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          },
        }}
      >
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
 * Includes terminal chrome for visual consistency.
 */
export function PlainCodeBlock({ children }: { children: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;
  const codeBg = isDark ? '#0f0f1a' : '#fafafa';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  // Placeholder before mount — always light to avoid flash
  if (!mounted) {
    return (
      <div
        className="my-4 rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div
          className="flex items-center gap-3 px-4 py-2.5 border-b"
          style={{ background: '#f0f0f0', borderColor: 'rgba(0,0,0,0.08)' }}
        >
          <div className="zai-terminal-dots">
            <span className="zai-dot-close" />
            <span className="zai-dot-minimize" />
            <span className="zai-dot-maximize" />
          </div>
          <span className="text-xs text-gray-500 font-mono">terminal</span>
        </div>
        <div
          className="p-4 font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre"
          style={{ background: '#fafafa', color: '#333' }}
        >
          {children.trim()}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`my-4 rounded-lg overflow-hidden ${isDark ? 'zai-neon-border' : ''}`}
      style={{ border: `1px solid ${borderColor}` }}
    >
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b"
        style={{
          background: isDark ? '#15151f' : '#f0f0f0',
          borderColor: borderColor,
        }}
      >
        <div className="zai-terminal-dots">
          <span className="zai-dot-close" />
          <span className="zai-dot-minimize" />
          <span className="zai-dot-maximize" />
        </div>
        <span
          className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        >
          terminal
          <span
            className="zai-cursor-blink inline-block w-[2px] h-[14px] ml-0.5"
            style={{ background: isDark ? '#7dd3fc' : '#0284c7' }}
          />
        </span>
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
                primaryColor: '#f0f0f0',
                primaryTextColor: '#1a1a1a',
                primaryBorderColor: '#d0d0d0',
                lineColor: '#999',
                secondaryColor: '#e8e8e8',
                tertiaryColor: '#f5f5f5',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '13px',
                nodeBorder: '#ccc',
                mainBkg: '#f0f0f0',
                clusterBkg: '#f5f5f5',
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
