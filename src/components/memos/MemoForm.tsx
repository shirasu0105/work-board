"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import {
  MEMO_TYPES,
  MEMO_FIELDS,
  memoTitleLabel,
  parseMemoContent,
  type MemoType,
} from "@/lib/memoTypes";
import { createMemo, updateMemo, deleteMemo } from "@/lib/actions/memos";
import type { Option } from "@/components/tasks/TaskFormDrawer";
import type { Memo } from "@/lib/db/schema";

interface Props {
  categories: Option[];
  projects: Option[];
  memo?: Memo | null;
}

export function MemoForm({ categories, projects, memo }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!memo;

  const [memoType, setMemoType] = useState<MemoType>(
    (memo?.memoType as MemoType) ?? "minutes",
  );
  const initialContent = parseMemoContent(memo?.content ?? null);

  function handleSubmit(formData: FormData) {
    const content: Record<string, string> = {};
    for (const f of MEMO_FIELDS[memoType]) {
      content[f.key] = String(formData.get(`content.${f.key}`) ?? "");
    }
    const input = {
      title: String(formData.get("title") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      memoType,
      projectId: String(formData.get("projectId") ?? ""),
      content,
    };
    setError(null);
    startTransition(async () => {
      if (isEdit) {
        const result = await updateMemo(memo!.id, input);
        if (result.ok) {
          router.refresh();
        } else {
          setError(result.error);
        }
      } else {
        const result = await createMemo(input);
        if (result.ok && result.id) {
          router.push(`/memos/${result.id}`);
        } else if (!result.ok) {
          setError(result.error);
        }
      }
    });
  }

  function handleDelete() {
    if (!memo) return;
    if (!window.confirm("このメモを削除しますか？")) return;
    startTransition(async () => {
      await deleteMemo(memo.id);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="メモ種別" htmlFor="memoType" required>
          <Select
            id="memoType"
            value={memoType}
            onChange={(e) => setMemoType(e.target.value as MemoType)}
          >
            {MEMO_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="カテゴリ" htmlFor="categoryId" required>
          <Select id="categoryId" name="categoryId" defaultValue={memo?.categoryId ?? ""} required>
            <option value="" disabled>
              選択してください
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="プロジェクト" htmlFor="projectId" hint="任意">
          <Select id="projectId" name="projectId" defaultValue={memo?.projectId ?? ""}>
            <option value="">（なし）</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={memoTitleLabel(memoType)} htmlFor="title" required>
        <Input id="title" name="title" defaultValue={memo?.title ?? ""} required autoFocus />
      </Field>

      {/* 種別別フィールド。memoType を key に含めて切替時に再マウントする。 */}
      <div key={memoType} className="flex flex-col gap-4">
        {MEMO_FIELDS[memoType].map((f) => (
          <Field key={f.key} label={f.label} htmlFor={`content.${f.key}`}>
            {f.multiline ? (
              <Textarea
                id={`content.${f.key}`}
                name={`content.${f.key}`}
                defaultValue={initialContent[f.key] ?? ""}
              />
            ) : (
              <Input
                id={`content.${f.key}`}
                name={`content.${f.key}`}
                defaultValue={initialContent[f.key] ?? ""}
              />
            )}
          </Field>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-between pt-2">
        <div>
          {isEdit && (
            <Button type="button" variant="danger" onClick={handleDelete} disabled={pending}>
              削除
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push("/memos")}>
            一覧へ
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "保存中…" : isEdit ? "更新" : "作成"}
          </Button>
        </div>
      </div>
    </form>
  );
}
