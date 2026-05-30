"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { formatDateKeyLabel, nextDayKey } from "@/lib/date";
import type { JournalPageData } from "@/lib/types/journal";
import type { TaskDTO } from "@/lib/types/task";
import { TomorrowTaskPicker } from "./TomorrowTaskPicker";

export type JournalEditorProps = {
  data: JournalPageData;
};

/**
 * 日次ジャーナル画面の本体（要件書 §10.12 / §13.1 / §16.2）。
 *
 * 左: 今日のひとこと入力 ＋ 当日完了タスクの振り返り表示
 * 右: 未完了タスクから「明日やること」を複数選択
 *
 * 必須入力（§13.1）: 今日のひとこと・明日やること（1 件以上）。
 * いずれか欠けると保存ボタンは disabled。保存は対象日に対し UPSERT。
 */
export function JournalEditor({ data }: JournalEditorProps) {
  const router = useRouter();

  const [oneLiner, setOneLiner] = useState(data.journal?.oneLiner ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(data.journal?.selectedTaskIds ?? [])
  );
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextDateLabel = useMemo(
    () => formatDateKeyLabel(nextDayKey(data.targetDate)),
    [data.targetDate]
  );

  const toggle = useCallback((taskId: string) => {
    setSavedMessage(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const canSave =
    oneLiner.trim().length > 0 && selectedIds.size > 0 && !saving;

  const handleSave = useCallback(async () => {
    setError(null);
    setSavedMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: data.targetDate,
          oneLiner: oneLiner.trim(),
          selectedTaskIds: Array.from(selectedIds),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "保存に失敗しました");
      }
      setSavedMessage(
        `保存しました。明日（${nextDateLabel}）のホームに ${selectedIds.size} 件が表示されます。`
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [data.targetDate, oneLiner, selectedIds, nextDateLabel, router]);

  return (
    <div className="flex flex-col gap-4" data-testid="journal-editor">
      {/* ヘッダ行: 対象日 ＋ 保存ボタン */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-ink-2" data-testid="journal-target">
          対象日: {formatDateKeyLabel(data.targetDate)}
        </span>
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          disabled={!canSave}
          data-testid="journal-save"
        >
          保存して明日を準備 →
        </Button>
      </div>

      {error ? (
        <div
          role="alert"
          data-testid="journal-error"
          className="rounded-[8px] border-whisper bg-[color:var(--accent-bg)] px-3 py-2 text-[12px] text-[color:var(--warning)]"
        >
          {error}
        </div>
      ) : null}

      {savedMessage ? (
        <div
          role="status"
          data-testid="journal-saved"
          className="rounded-[8px] border border-[color:var(--success)] bg-[#e8f7eb] px-3 py-2 text-[12px] text-[color:var(--success)]"
        >
          {savedMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 左: 今日のひとこと ＋ 完了タスク */}
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-[18px] font-semibold text-ink">
              ① 今日のひとこと
              <span className="ml-1 text-[12px] text-[color:var(--warning)]">
                *必須
              </span>
            </h2>
            <p className="mt-1 mb-2 text-[12px] text-ink-2">
              軽い振り返り。長く書かなくてよい。
            </p>
            <textarea
              value={oneLiner}
              onChange={(e) => {
                setOneLiner(e.target.value);
                setSavedMessage(null);
              }}
              data-testid="journal-oneliner"
              placeholder="例: ヒアリング前の準備に時間がかかった。明日は朝イチで対応表を進める。"
              rows={4}
              className={cn(
                "w-full resize-y rounded-[8px] border border-[color:var(--border-whisper)] bg-paper px-3 py-2",
                "text-[14px] text-ink placeholder:text-ink-3",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
              )}
            />
          </Card>

          <Card>
            <h2 className="text-[16px] font-semibold text-ink">
              今日完了したタスク
            </h2>
            <DoneTaskList tasks={data.doneTasks} />
          </Card>
        </div>

        {/* 右: 明日やること選択 */}
        <Card>
          <TomorrowTaskPicker
            tasks={data.undoneTasks}
            selectedIds={selectedIds}
            onToggle={toggle}
            nextDateLabel={nextDateLabel}
          />
        </Card>
      </div>
    </div>
  );
}

function DoneTaskList({ tasks }: { tasks: TaskDTO[] }) {
  if (tasks.length === 0) {
    return (
      <p
        data-testid="journal-done-empty"
        className="mt-2 rounded-[8px] bg-paper-2 px-3 py-3 text-center text-[13px] text-ink-3"
      >
        今日完了したタスクはありません
      </p>
    );
  }
  return (
    <>
      <ul className="mt-2 flex flex-col gap-1.5" data-testid="journal-done-list">
        {tasks.map((t) => (
          <li
            key={t.id}
            data-testid="journal-done-item"
            className="flex items-center gap-2 text-[13px] text-ink-3"
          >
            <span aria-hidden className="text-[color:var(--success)]">
              ✓
            </span>
            <span className="line-through">{t.title}</span>
            <Chip>{t.categoryName}</Chip>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] text-ink-3">{tasks.length} 件完了 ✓</p>
    </>
  );
}
