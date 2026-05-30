"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { CategoryDTO } from "@/lib/db/category";
import {
  MEMO_FIELDS,
  MEMO_KIND_LABELS,
  normalizeBody,
  type MemoBody,
  type MemoDTO,
  type MemoKind,
} from "@/lib/types/memo";
import { MemoKindTabs } from "./MemoKindTabs";

export type ProjectOption = { id: string; name: string };

export type MemoFormByKindProps = {
  mode: "create" | "edit";
  categories: CategoryDTO[];
  projects: ProjectOption[];
  /** 編集時の対象メモ（mode==="edit" のとき必須） */
  initial?: MemoDTO;
};

/**
 * 種別に応じて入力フィールドが切り替わるメモフォーム本体（要件書 §10.9）。
 *
 * - 共通入力: タイトル（必須）/ カテゴリ（必須）/ 関連プロジェクト（任意）
 * - 種別固有: MEMO_FIELDS[kind] に従って input / textarea を描画
 * - 必須（タイトル・カテゴリ・種別）が揃わないと保存ボタンは disabled
 * - 種別を変えても各種別の入力値はクライアント側で保持し、データロスを防ぐ
 *   （保存される body は選択中の種別フィールドのみ）
 */
export function MemoFormByKind({
  mode,
  categories,
  projects,
  initial,
}: MemoFormByKindProps) {
  const router = useRouter();

  const [kind, setKind] = useState<MemoKind>(initial?.kind ?? "meeting");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? ""
  );
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");

  // 種別ごとの入力値をすべて保持する（種別切替でのデータロス防止）。
  // key は `${kind}.${fieldKey}`。
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (initial) {
      for (const [k, v] of Object.entries(initial.body)) {
        init[`${initial.kind}.${k}`] = v;
      }
    }
    return init;
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = MEMO_FIELDS[kind];

  const setFieldValue = useCallback(
    (fieldKey: string, value: string) => {
      setValues((prev) => ({ ...prev, [`${kind}.${fieldKey}`]: value }));
    },
    [kind]
  );

  const currentBody = useMemo<MemoBody>(() => {
    const body: MemoBody = {};
    for (const f of fields) {
      const v = values[`${kind}.${f.key}`];
      if (typeof v === "string") body[f.key] = v;
    }
    return body;
  }, [fields, values, kind]);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && categoryId !== "" && !busy;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      setBusy(true);
      setError(null);
      try {
        const payload = {
          title: trimmedTitle,
          categoryId,
          kind,
          body: normalizeBody(kind, currentBody),
          projectId: projectId === "" ? null : projectId,
        };
        if (mode === "create") {
          const res = await fetch("/api/memos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(data?.error ?? "作成に失敗しました");
          }
        } else if (initial) {
          const res = await fetch(
            `/api/memos/${encodeURIComponent(initial.id)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
          if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(data?.error ?? "更新に失敗しました");
          }
        }
        // 保存成功 → 一覧へ戻る
        router.push("/memos");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存に失敗しました");
        setBusy(false);
      }
    },
    [
      canSubmit,
      trimmedTitle,
      categoryId,
      kind,
      currentBody,
      projectId,
      mode,
      initial,
      router,
    ]
  );

  const handleCancel = useCallback(() => {
    router.push("/memos");
  }, [router]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 種別タブ */}
      <MemoKindTabs value={kind} onChange={setKind} disabled={busy} />

      <Card className="flex flex-col gap-5">
        {/* 共通入力: タイトル / カテゴリ / プロジェクト */}
        <div className="flex flex-col gap-4">
          {/* タイトル（必須） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="memo-title"
              className="text-[12px] font-medium text-ink-2"
            >
              タイトル
              <span className="ml-1 text-[color:var(--warning)]">*</span>
            </label>
            <Input
              id="memo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 週次定例MTG"
              maxLength={200}
              autoComplete="off"
              aria-required="true"
              aria-invalid={trimmedTitle.length === 0}
              data-testid="memo-form-title"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* カテゴリ（必須） */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="memo-category"
                className="text-[12px] font-medium text-ink-2"
              >
                カテゴリ
                <span className="ml-1 text-[color:var(--warning)]">*</span>
              </label>
              <select
                id="memo-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                aria-required="true"
                aria-invalid={categoryId === ""}
                data-testid="memo-form-category"
                className={cn(
                  "w-full rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2.5 py-1.5",
                  "text-[14px] text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:border-accent"
                )}
              >
                {categories.length === 0 ? (
                  <option value="">カテゴリがありません</option>
                ) : (
                  <>
                    <option value="" disabled>
                      選択してください
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {categories.length === 0 ? (
                <p className="text-[12px] text-ink-3">
                  先に「設定」でカテゴリを作成してください。
                </p>
              ) : null}
            </div>

            {/* 関連プロジェクト（任意） */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="memo-project"
                className="text-[12px] font-medium text-ink-2"
              >
                関連プロジェクト（任意）
              </label>
              <select
                id="memo-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                data-testid="memo-form-project"
                className={cn(
                  "w-full rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2.5 py-1.5",
                  "text-[14px] text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:border-accent"
                )}
              >
                <option value="">なし</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 種別固有フィールド */}
        <div
          className="flex flex-col gap-4 border-t border-[color:var(--border-whisper)] pt-5"
          data-testid="memo-form-fields"
          data-kind={kind}
        >
          <p className="text-[12px] font-semibold text-ink-3">
            {MEMO_KIND_LABELS[kind]}フォーマット
          </p>
          {fields.map((f) => {
            const fieldId = `memo-field-${kind}-${f.key}`;
            const value = values[`${kind}.${f.key}`] ?? "";
            return (
              <div key={f.key} className="flex flex-col gap-1">
                <label
                  htmlFor={fieldId}
                  className="flex items-center gap-2 text-[12px] font-medium text-ink-2"
                >
                  {f.chip ? (
                    <span
                      aria-hidden
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-bg text-[10px] font-semibold text-[color:var(--accent-focus)]"
                    >
                      {f.chip}
                    </span>
                  ) : null}
                  {f.label}
                </label>
                {f.multiline ? (
                  <textarea
                    id={fieldId}
                    value={value}
                    onChange={(e) => setFieldValue(f.key, e.target.value)}
                    rows={3}
                    maxLength={4000}
                    data-testid={`memo-field-${f.key}`}
                    className={cn(
                      "w-full rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2.5 py-1.5",
                      "text-[14px] text-ink placeholder:text-warm-gray-300 leading-[1.5]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:border-accent",
                      "resize-y"
                    )}
                  />
                ) : (
                  <Input
                    id={fieldId}
                    value={value}
                    onChange={(e) => setFieldValue(f.key, e.target.value)}
                    maxLength={500}
                    autoComplete="off"
                    data-testid={`memo-field-${f.key}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error ? (
          <p role="alert" className="text-[12px] text-[color:var(--warning)]">
            {error}
          </p>
        ) : null}
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={busy}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          data-testid="memo-form-submit"
        >
          {busy ? "保存中…" : mode === "create" ? "保存する" : "更新する"}
        </Button>
      </div>
    </form>
  );
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
