"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { addInboxItem, discardInboxItem } from "@/lib/actions/inbox";
import { OrganizeDrawer, type OrganizeTarget } from "./OrganizeDrawer";
import type { Option } from "@/components/tasks/TaskFormDrawer";
import type { InboxItem } from "@/lib/db/schema";

type ZoneId = OrganizeTarget | "deleted";

const ZONES: { id: ZoneId; label: string; hint: string }[] = [
  { id: "task", label: "タスク化", hint: "実行できる単位に" },
  { id: "project", label: "プロジェクト化", hint: "複数タスクのまとまりに" },
  { id: "someday", label: "Someday化", hint: "いつかやるに保留" },
  { id: "deleted", label: "削除", hint: "不要として整理" },
];

interface Props {
  items: InboxItem[];
  recent: InboxItem[];
  categories: Option[];
  projects: Option[];
}

export function InboxView({ items, recent, categories, projects }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [organize, setOrganize] = useState<{ item: InboxItem; target: OrganizeTarget } | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const hasCategories = categories.length > 0;

  function handleAdd() {
    const value = content.trim();
    if (!value) return;
    startTransition(async () => {
      const result = await addInboxItem({ content: value });
      if (result.ok) {
        setContent("");
        router.refresh();
      }
    });
  }

  function startOrganize(item: InboxItem, target: OrganizeTarget) {
    if (!hasCategories) return;
    setOrganize({ item, target });
  }

  function discard(item: InboxItem) {
    startTransition(async () => {
      await discardInboxItem(item.id);
      router.refresh();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const item = items.find((i) => i.id === String(active.id));
    if (!item) return;
    const zone = String(over.id) as ZoneId;
    if (zone === "deleted") {
      discard(item);
    } else {
      startOrganize(item, zone);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="頭に浮かんだことをここに入れる（Enterで追加）"
        />
        <Button onClick={handleAdd} disabled={pending || !content.trim()}>
          追加
        </Button>
      </div>

      {!hasCategories && (
        <p className="text-sm text-warning">
          タスク/プロジェクト/Someday へ整理するには、先に設定画面でカテゴリを作成してください。
        </p>
      )}

      <DndContext id="inbox" sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          {/* 未整理リスト */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
              未整理 {items.length}件
            </h2>
            {items.length === 0 ? (
              <EmptyState title="未整理の項目はありません" description="思いついたことを上の欄から追加できます。" />
            ) : (
              items.map((item) => (
                <InboxItemCard
                  key={item.id}
                  item={item}
                  disabled={!hasCategories}
                  onOrganize={startOrganize}
                  onDiscard={discard}
                />
              ))
            )}
          </div>

          {/* ドロップ先 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
              ここへドラッグして整理
            </h2>
            {ZONES.map((z) => (
              <DropZone key={z.id} id={z.id} label={z.label} hint={z.hint} />
            ))}
          </div>
        </div>
      </DndContext>

      {recent.length > 0 && (
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            最近整理した項目
          </h2>
          <ul className="text-sm text-ink-subtle">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center gap-2 py-0.5">
                <span className="truncate">{r.content}</span>
                <span className="shrink-0 text-xs text-ink-tertiary">
                  → {labelOfOrganizedTo(r.organizedTo)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {organize && (
        <OrganizeDrawer
          item={organize.item}
          target={organize.target}
          categories={categories}
          projects={projects}
          onClose={() => setOrganize(null)}
        />
      )}
    </div>
  );
}

function labelOfOrganizedTo(v: string | null): string {
  switch (v) {
    case "task":
      return "タスク";
    case "project":
      return "プロジェクト";
    case "someday":
      return "Someday";
    case "deleted":
      return "削除";
    default:
      return "整理済み";
  }
}

function InboxItemCard({
  item,
  disabled,
  onOrganize,
  onDiscard,
}: {
  item: InboxItem;
  disabled: boolean;
  onOrganize: (item: InboxItem, target: OrganizeTarget) => void;
  onDiscard: (item: InboxItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  } as const;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2.5"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none select-none text-ink-tertiary active:cursor-grabbing"
        aria-label="ドラッグして整理"
      >
        ⠿
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{item.content}</span>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" disabled={disabled} onClick={() => onOrganize(item, "task")}>
          タスク
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled} onClick={() => onOrganize(item, "project")}>
          PJ
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled} onClick={() => onOrganize(item, "someday")}>
          Someday
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDiscard(item)} aria-label="削除">
          🗑
        </Button>
      </div>
    </div>
  );
}

function DropZone({ id, label, hint }: { id: string; label: string; hint: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border border-dashed border-hairline-strong px-3 py-4 text-center transition-colors",
        isOver ? "border-primary bg-primary/10" : "bg-surface-2/30",
      )}
    >
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-ink-tertiary">{hint}</p>
    </div>
  );
}
