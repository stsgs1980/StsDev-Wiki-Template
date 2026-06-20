'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  StrikeThroughSupSubToggles,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  DiffSourceToggleWrapper,
  UndoRedo,
  Separator,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { Upload, FileText } from 'lucide-react';

export default function NewDocPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" /></div>}>
      <NewDocPageInner />
    </Suspense>
  );
}

function NewDocPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [title, setTitle] = useState('');
  const [section, setSection] = useState(searchParams.get('section') || '');
  const [slug, setSlug] = useState('');
  const [sectionOrder, setSectionOrder] = useState(searchParams.get('sectionOrder') || '');
  const [order, setOrder] = useState('0');
  const [content, setContent] = useState('# Новая страница\n\nНачните писать здесь...');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const newSlug = val
      .toLowerCase()
      .replace(/[^\w\sа-яА-ЯёЁ-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .replace(/[а-яА-ЯёЁ]/g, (c) => {
        const map: Record<string, string> = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        };
        return map[c.toLowerCase()] || c;
      })
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(newSlug);
  };

  const handleSave = useCallback(async () => {
    if (!title || !slug) {
      setError('Заголовок и slug обязательны');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          section: section || 'Uncategorized',
          sectionOrder: sectionOrder ? parseInt(sectionOrder) : undefined,
          order: order ? parseInt(order) : 0,
          slug,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Create failed');
      }

      router.push(`/docs/${data.slug}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setSaving(false);
    }
  }, [title, slug, section, sectionOrder, order, content, router]);

  // File upload
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('section', section || 'Uploaded');

      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      try {
        const res = await fetch('/api/docs/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        // Navigate to the first uploaded file
        if (data.results && data.results.length > 0) {
          router.push(`/docs/${data.results[0].slug}`);
          router.refresh();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setUploading(false);
      }
    },
    [section, router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 h-[49px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Назад
            </button>
            <span className="text-[14px] text-muted-foreground">|</span>
            <span className="text-[14px] font-medium text-foreground">
              Новая страница
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {uploading ? 'Загрузка...' : 'Загрузить файл'}
              </span>
              <input
                type="file"
                accept=".md,.mdx"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
              />
            </label>
            <button
              onClick={handleSave}
              disabled={saving || !title || !slug}
              className="px-4 py-1.5 text-[13px] font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
        {error && (
          <div className="px-4 py-2 bg-red-500/10 text-red-500 text-[13px]">
            {error}
          </div>
        )}
      </div>

      {/* Frontmatter form */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-[960px] px-4 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Заголовок *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Моя новая страница"
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Секция
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="Название секции"
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated-from-title"
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Порядок секции
            </label>
            <input
              type="number"
              value={sectionOrder}
              onChange={(e) => setSectionOrder(e.target.value)}
              placeholder="авто"
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Порядок страницы
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-end">
            <div className="text-[12px] text-muted-foreground">
              <FileText className="h-3.5 w-3.5 inline mr-1" />
              Перетяните .md/.mdx файл на эту страницу
            </div>
          </div>
        </div>
      </div>

      {/* MDX Editor */}
      <div className="mx-auto max-w-[960px] px-4 py-6">
        <div className="rounded-lg border border-border overflow-hidden [&_.mdxeditor]:min-h-[60vh] [&_.mdxeditor-toolbar]:border-b [&_.mdxeditor-toolbar]:border-border [&_.mdxeditor-toolbar]:bg-muted/30">
          <MDXEditor
            markdown={content}
            onChange={setContent}
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
                  sql: 'SQL',
                  mermaid: 'Mermaid',
                },
              }),
              diffSourcePlugin({
                viewMode: 'rich-text',
                diffMarkdown: content,
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
