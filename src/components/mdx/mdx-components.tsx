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
 * CodeBlock component with syntax highlighting and copy button.
 * - Theme-aware: switches oneDark/oneLight based on resolvedTheme
 * - No SSR flash: renders a skeleton placeholder until mounted
 * - Copy button with clipboard API
 * - Line numbers + optional filename header
 *
 * Usage in MDX:
 *   <CodeBlock language="typescript" filename="app.tsx">
 *     const x = 1;
 *   </CodeBlock>
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

  const isDark = resolvedTheme === 'dark';

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

  const lineCount = children.trim().split('\n').length;

  // Before mount: render a skeleton placeholder to avoid SSR/client mismatch.
  // Using the same outer structure (header + body) prevents layout shift.
  if (!mounted) {
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-border">
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
          <span className="text-xs text-muted-foreground font-mono">
            {filename || language}
          </span>
        </div>
        <div
          className="p-4 font-mono text-[13px] leading-relaxed"
          style={{ background: '#1a1a1a' }}
        >
          {children.trim()}
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-border group relative">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">
          {filename || language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
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
          background: isDark ? '#1a1a1a' : '#fafafa',
          fontSize: '13px',
          padding: '16px',
        }}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: isDark ? '#555' : '#bbb',
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
 * Example:
 *   ```
 *   some plain text
 *   ```
 */
export function PlainCodeBlock({ children }: { children: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  if (!mounted) {
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-border">
        <div
          className="p-4 font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre"
          style={{ background: '#1a1a1a' }}
        >
          {children.trim()}
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-border">
      <div
        className="p-4 font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre"
        style={{
          background: isDark ? '#1a1a1a' : '#fafafa',
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
                background: '#1a1a1a',
                primaryColor: '#2a2a2a',
                primaryTextColor: '#fafafa',
                primaryBorderColor: 'rgba(255,255,255,0.1)',
                lineColor: 'rgba(255,255,255,0.3)',
                secondaryColor: '#333',
                tertiaryColor: '#222',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '13px',
                nodeBorder: 'rgba(255,255,255,0.15)',
                mainBkg: '#2a2a2a',
                clusterBkg: '#222',
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
      className="my-4 rounded-lg border border-border bg-muted/50 p-4 overflow-x-auto"
    >
      {svg ? (
        <div
          dangerouslySetInnerHTML={{ __html: svg }}
          className="[&>svg]:max-w-full [&>svg]:h-auto"
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
