'use client';

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, FolderPlus, ArrowUp, ArrowDown } from 'lucide-react';
import type { NavSection } from '@/lib/mdx-utils';

interface SidebarProps {
  currentSlug: string;
  navigation: NavSection[];
  onNavigate: (slug: string) => void;
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
}

export default function Sidebar({
  currentSlug,
  navigation,
  onNavigate,
  isOpen,
  onClose,
  canEdit = true,
}: SidebarProps) {
  const [openSections, setOpenSections] = React.useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionPosition, setNewSectionPosition] = useState<'end' | 'before' | 'after'>('end');
  const [newSectionRef, setNewSectionRef] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleNavigate = (slug: string) => {
    onNavigate(slug);
    onClose();
  };

  const handleCreateInSection = useCallback((sectionTitle: string) => {
    const params = new URLSearchParams({ section: sectionTitle });
    window.location.href = `/docs/new/?${params.toString()}`;
  }, []);

  // Move section up/down
  const handleMoveSection = useCallback(async (sectionTitle: string, direction: 'up' | 'down') => {
    const idx = navigation.findIndex((s) => s.title === sectionTitle);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === navigation.length - 1) return;

    setMoving(sectionTitle);

    // Build new order: swap adjacent section orders
    const newSections: Record<string, number> = {};
    navigation.forEach((s, i) => {
      newSections[s.title] = s.order;
    });

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const currentOrder = newSections[sectionTitle];
    const swapOrder = newSections[navigation[swapIdx].title];

    // Swap the two
    newSections[sectionTitle] = swapOrder;
    newSections[navigation[swapIdx].title] = currentOrder;

    try {
      const res = await fetch('/api/docs/reorder-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: newSections }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Reorder failed');
      }

      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка перемещения');
    } finally {
      setMoving(null);
    }
  }, [navigation]);

  const handleCreateNewSection = useCallback(async () => {
    if (!newSectionName.trim()) return;
    setCreating(true);
    try {
      // Calculate sectionOrder based on position
      let sectionOrder: number;
      if (newSectionPosition === 'end' || !newSectionRef) {
        const maxOrder = navigation.reduce((max, s) => Math.max(max, s.order), 0);
        sectionOrder = maxOrder + 100;
      } else {
        const refIdx = navigation.findIndex((s) => s.title === newSectionRef);
        if (refIdx < 0) {
          sectionOrder = navigation.length * 100;
        } else if (newSectionPosition === 'before') {
          // Insert before ref: take ref's order and shift ref down
          const refOrder = navigation[refIdx].order;
          const prevOrder = refIdx > 0 ? navigation[refIdx - 1].order : 0;
          sectionOrder = Math.round((refOrder + prevOrder) / 2);
          // If too close (integer collision), renumber all sections
          if (sectionOrder === refOrder || sectionOrder === prevOrder) {
            // Need to renumber — assign space and shift everything after
            const newSections: Record<string, number> = {};
            let counter = 100;
            for (let i = 0; i < navigation.length; i++) {
              if (i === refIdx) {
                // This is where the new section goes
                newSections[newSectionName.trim()] = counter;
                counter += 100;
              }
              newSections[navigation[i].title] = counter;
              counter += 100;
            }
            // Create the new doc first, then reorder
            const slug = newSectionName
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
              .replace(/^-|-$/g, '') + '-index';

            const res = await fetch('/api/docs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: newSectionName.trim(),
                section: newSectionName.trim(),
                sectionOrder: newSections[newSectionName.trim()],
                order: 0,
                slug,
                content: `# ${newSectionName.trim()}\n\n`,
              }),
            });

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Create failed');
            }

            // Now reorder existing sections (exclude new one since it's already created)
            const reorderSections: Record<string, number> = {};
            for (const [key, val] of Object.entries(newSections)) {
              if (key !== newSectionName.trim()) {
                reorderSections[key] = val;
              }
            }

            await fetch('/api/docs/reorder-section', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sections: reorderSections }),
            });

            window.location.href = `/docs/${slug}/`;
            return;
          }
        } else {
          // Insert after ref
          const refOrder = navigation[refIdx].order;
          const nextOrder = refIdx < navigation.length - 1 ? navigation[refIdx + 1].order : refOrder + 200;
          sectionOrder = Math.round((refOrder + nextOrder) / 2);
          // Collision check
          if (sectionOrder === refOrder || sectionOrder === nextOrder) {
            const newSections: Record<string, number> = {};
            let counter = 100;
            for (let i = 0; i < navigation.length; i++) {
              newSections[navigation[i].title] = counter;
              counter += 100;
              if (i === refIdx) {
                // Insert new section after this one
                newSections[newSectionName.trim()] = counter;
                counter += 100;
              }
            }
            const slug = newSectionName
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
              .replace(/^-|-$/g, '') + '-index';

            const res = await fetch('/api/docs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: newSectionName.trim(),
                section: newSectionName.trim(),
                sectionOrder: newSections[newSectionName.trim()],
                order: 0,
                slug,
                content: `# ${newSectionName.trim()}\n\n`,
              }),
            });

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Create failed');
            }

            const reorderSections: Record<string, number> = {};
            for (const [key, val] of Object.entries(newSections)) {
              if (key !== newSectionName.trim()) {
                reorderSections[key] = val;
              }
            }

            await fetch('/api/docs/reorder-section', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sections: reorderSections }),
            });

            window.location.href = `/docs/${slug}/`;
            return;
          }
        }
      }

      // Simple case — no collision, just create with calculated order
      const slug = newSectionName
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
        .replace(/^-|-$/g, '') + '-index';

      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSectionName.trim(),
          section: newSectionName.trim(),
          sectionOrder,
          order: 0,
          slug,
          content: `# ${newSectionName.trim()}\n\n`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Create failed');
      }

      const data = await res.json();
      window.location.href = `/docs/${data.slug}/`;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка создания секции');
    } finally {
      setCreating(false);
      setShowNewSection(false);
      setNewSectionName('');
      setNewSectionPosition('end');
      setNewSectionRef('');
    }
  }, [newSectionName, newSectionPosition, newSectionRef, navigation]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/docs/${deleteTarget.slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      if (deleteTarget.slug === currentSlug) {
        const firstSlug = navigation[0]?.items[0]?.slug;
        if (firstSlug) {
          onNavigate(firstSlug);
        } else {
          window.location.href = '/docs/';
        }
      }
      window.location.reload();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, currentSlug, navigation, onNavigate]);

  const sidebarContent = (
    <nav className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {navigation.map((section, sectionIdx) => {
          const isSectionOpen = openSections.has(section.title);
          const isActive = section.items.some((i) => i.slug === currentSlug);

          return (
            <div key={section.title} className="mb-1">
              <div className="flex items-center">
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`flex items-center flex-1 min-w-0 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors text-left ${
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  } hover:text-foreground`}
                >
                  {isSectionOpen ? (
                    <ChevronDown className="h-3 w-3 mr-1.5 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1.5 shrink-0" />
                  )}
                  <span className="break-words truncate">{section.title}</span>
                </button>
                {canEdit && (
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => handleMoveSection(section.title, 'up')}
                      disabled={sectionIdx === 0 || moving === section.title}
                      className="p-0.5 rounded text-muted-foreground/0 hover:text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-20 disabled:hover:text-muted-foreground/0 disabled:hover:bg-transparent"
                      title="Секцию выше"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(section.title, 'down')}
                      disabled={sectionIdx === navigation.length - 1 || moving === section.title}
                      className="p-0.5 rounded text-muted-foreground/0 hover:text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-20 disabled:hover:text-muted-foreground/0 disabled:hover:bg-transparent"
                      title="Секцию ниже"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleCreateInSection(section.title)}
                      className="p-1 rounded text-muted-foreground/0 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                      title={`Добавить страницу в "${section.title}"`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              {isSectionOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {section.items.map((item) => (
                    <div
                      key={item.slug}
                      className="group/item flex items-center"
                    >
                      <button
                        onClick={() => handleNavigate(item.slug)}
                        className={`flex-1 min-w-0 text-left px-2.5 py-1.5 text-[13px] rounded-md transition-all break-words ${
                          currentSlug === item.slug
                            ? 'bg-muted text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <span className="truncate">{item.title}</span>
                      </button>
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ slug: item.slug, title: item.title });
                          }}
                          className="p-1 mr-0.5 rounded text-muted-foreground/0 group-hover/item:text-muted-foreground/60 hover:!text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                          title={`Удалить "${item.title}"`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {canEdit && (
          <div className="mt-2 pt-2 border-t border-border">
            <button
              onClick={() => {
                setNewSectionPosition('end');
                setNewSectionRef(navigation[navigation.length - 1]?.title || '');
                setShowNewSection(true);
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-[13px] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Новая секция</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 max-w-[380px] w-full mx-4 shadow-2xl">
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              Удалить страницу?
            </h3>
            <p className="text-[14px] text-muted-foreground mb-5">
              &laquo;{deleteTarget.title}&raquo; будет удалена без возможности восстановления.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-[13px] rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-[13px] font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New section dialog */}
      {showNewSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 max-w-[420px] w-full mx-4 shadow-2xl">
            <h3 className="text-[15px] font-semibold text-foreground mb-4">
              Новая секция
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] text-muted-foreground mb-1.5">
                  Название секции
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Например: API Reference"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateNewSection();
                  }}
                  className="w-full px-3 py-2 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-[12px] text-muted-foreground mb-1.5">
                  Позиция
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sectionPos"
                      value="end"
                      checked={newSectionPosition === 'end'}
                      onChange={() => setNewSectionPosition('end')}
                      className="accent-foreground"
                    />
                    <span className="text-[14px] text-foreground">В конец</span>
                  </label>
                  {navigation.length > 0 && (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sectionPos"
                          value="before"
                          checked={newSectionPosition === 'before'}
                          onChange={() => {
                            setNewSectionPosition('before');
                            if (!newSectionRef) setNewSectionRef(navigation[0].title);
                          }}
                          className="accent-foreground"
                        />
                        <span className="text-[14px] text-foreground">Перед секцией</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sectionPos"
                          value="after"
                          checked={newSectionPosition === 'after'}
                          onChange={() => {
                            setNewSectionPosition('after');
                            if (!newSectionRef) setNewSectionRef(navigation[0].title);
                          }}
                          className="accent-foreground"
                        />
                        <span className="text-[14px] text-foreground">После секции</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {(newSectionPosition === 'before' || newSectionPosition === 'after') && navigation.length > 0 && (
                <div>
                  <label className="block text-[12px] text-muted-foreground mb-1.5">
                    {newSectionPosition === 'before' ? 'Перед какой секцией' : 'После какой секции'}
                  </label>
                  <select
                    value={newSectionRef}
                    onChange={(e) => setNewSectionRef(e.target.value)}
                    className="w-full px-3 py-2 text-[14px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {navigation.map((s) => (
                      <option key={s.title} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowNewSection(false);
                  setNewSectionName('');
                  setNewSectionPosition('end');
                  setNewSectionRef('');
                }}
                disabled={creating}
                className="px-4 py-2 text-[13px] rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateNewSection}
                disabled={creating || !newSectionName.trim()}
                className="px-4 py-2 text-[13px] font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden xl:block shrink-0 border-r border-border bg-sidebar h-[calc(100vh-49px)] sticky top-[49px]">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 xl:hidden"
            onClick={onClose}
          />
          <aside className="fixed left-0 top-0 z-50 w-[280px] h-full bg-sidebar xl:hidden shadow-2xl">
            <div className="flex items-center h-[49px] px-4 border-b border-border">
              <span className="text-sm font-medium text-foreground">
                Navigation
              </span>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
