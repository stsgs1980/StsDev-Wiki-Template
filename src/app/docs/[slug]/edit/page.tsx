'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  StrikeThroughSupSubToggles,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  InsertFrontmatter,
  DiffSourceToggleWrapper,
  UndoRedo,
  Separator,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface DocData {
  meta: {
    title: string;
    section: string;
    order: number;
    slug: string;
  };
  content: string;
}

export default function EditDocPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load document
  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await fetch(`/api/docs/${slug}`);
        if (!res.ok) throw new Error('Page not found');
        const data = await res.json();
        setDoc(data);
        setCommitMessage(`docs: update ${slug}`);
      } catch (err) {
        setError('Не удалось загрузить страницу');
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [slug]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/docs/${slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      router.push('/docs/approaches-overview/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }, [slug, router]);

  const handleSave = useCallback(async () => {
    if (!doc) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/docs/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...doc.meta,
          content: doc.content,
          commitMessage: commitMessage || `docs: update ${slug}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Save failed');
      }

      setSuccess('Сохранено!');
      setTimeout(() => {
        router.push(`/docs/${slug}`);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }, [doc, slug, commitMessage, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
      </div>
    );
  }

  if (error && !doc) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push(`/docs/${slug}`)}
            className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 h-[49px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/docs/${slug}`)}
              className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Назад к странице
            </button>
            <span className="text-[14px] text-muted-foreground">|</span>
            <span className="text-[14px] font-medium text-foreground">
              Редактирование: {doc.meta.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Сообщение коммита..."
              className="hidden sm:block w-[240px] px-3 py-1.5 text-[13px] rounded-md border border-border bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-[13px] font-medium rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              Удалить
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-[13px] font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
        {error && (
          <div className="px-4 py-2 bg-red-500/10 text-red-500 text-[13px]">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-2 bg-green-500/10 text-green-500 text-[13px]">
            {success}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 max-w-[400px] w-full mx-4 shadow-2xl">
            <h3 className="text-[16px] font-semibold text-foreground mb-2">
              Удалить страницу?
            </h3>
            <p className="text-[14px] text-muted-foreground mb-6">
              Страница &laquo;{doc?.meta.title}&raquo; будет удалена без возможности восстановления.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-[13px] rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-[13px] font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Frontmatter edit */}
      <div className="border-b border-border bg-muted/30">
        <details className="mx-auto max-w-[960px] px-4 py-3">
          <summary className="text-[14px] font-medium text-muted-foreground cursor-pointer hover:text-foreground">
            Метаданные (frontmatter)
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[12px] text-muted-foreground mb-1">
                Заголовок
              </label>
              <input
                type="text"
                value={doc.meta.title}
                onChange={(e) =>
                  setDoc({ ...doc, meta: { ...doc.meta, title: e.target.value } })
                }
                className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-[12px] text-muted-foreground mb-1">
                Секция
              </label>
              <input
                type="text"
                value={doc.meta.section}
                onChange={(e) =>
                  setDoc({
                    ...doc,
                    meta: { ...doc.meta, section: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-[12px] text-muted-foreground mb-1">
                Порядок
              </label>
              <input
                type="number"
                value={doc.meta.order}
                onChange={(e) =>
                  setDoc({
                    ...doc,
                    meta: { ...doc.meta, order: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-[12px] text-muted-foreground mb-1">
                Slug
              </label>
              <input
                type="text"
                value={doc.meta.slug}
                disabled
                className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>
        </details>
      </div>

      {/* MDX Editor */}
      <div className="mx-auto max-w-[960px] px-4 py-6">
        <div className="rounded-lg border border-border overflow-hidden [&_.mdxeditor]:min-h-[60vh] [&_.mdxeditor-toolbar]:border-b [&_.mdxeditor-toolbar]:border-border [&_.mdxeditor-toolbar]:bg-muted/30">
          <MDXEditor
            markdown={doc.content}
            onChange={(md) => setDoc({ ...doc, content: md })}
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
              linkPlugin(),
              linkDialogPlugin(),
              tablePlugin(),
              codeBlockPlugin(),
              codeMirrorPlugin({
                codeBlockLanguages: {
                  js: 'JavaScript',
                  ts: 'TypeScript',
                  tsx: 'TypeScript (React)',
                  jsx: 'JavaScript (React)',
                  python: 'Python',
                  css: 'CSS',
                  html: 'HTML',
                  bash: 'Bash',
                  shell: 'Shell',
                  json: 'JSON',
                  yaml: 'YAML',
                  markdown: 'Markdown',
                  sql: 'SQL',
                  rust: 'Rust',
                  go: 'Go',
                  java: 'Java',
                  mermaid: 'Mermaid',
                },
              }),
              frontmatterPlugin(),
              diffSourcePlugin({
                viewMode: 'rich-text',
                diffMarkdown: doc.content,
              }),
              toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <Separator />
                    <BoldItalicUnderlineToggles />
                    <StrikeThroughSupSubToggles />
                    <Separator />
                    <BlockTypeSelect />
                    <ListsToggle />
                    <Separator />
                    <CreateLink />
                    <InsertTable />
                    <InsertThematicBreak />
                    <InsertCodeBlock />
                    <InsertFrontmatter />
                    <Separator />
                    <DiffSourceToggleWrapper>
                      <></>
                    </DiffSourceToggleWrapper>
                  </>
                ),
              }),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
