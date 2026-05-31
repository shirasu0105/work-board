"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MEMO_TYPES } from "@/lib/memoTypes";
import type { Option } from "@/components/tasks/TaskFormDrawer";

interface Props {
  categories: Option[];
  initial: {
    keyword?: string;
    categoryId?: string;
    memoType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function MemoSearchBar({ categories, initial }: Props) {
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    const params = new URLSearchParams();
    for (const key of ["keyword", "categoryId", "memoType", "dateFrom", "dateTo"]) {
      const v = String(formData.get(key) ?? "").trim();
      if (v) params.set(key, v);
    }
    const qs = params.toString();
    router.push(qs ? `/memos?${qs}` : "/memos");
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-3">
      <Input name="keyword" defaultValue={initial.keyword ?? ""} placeholder="キーワード（タイトル・本文）" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select name="categoryId" defaultValue={initial.categoryId ?? ""} aria-label="カテゴリ">
          <option value="">カテゴリ：全て</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select name="memoType" defaultValue={initial.memoType ?? ""} aria-label="種別">
          <option value="">種別：全て</option>
          {MEMO_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Input type="date" name="dateFrom" defaultValue={initial.dateFrom ?? ""} aria-label="開始日" />
        <Input type="date" name="dateTo" defaultValue={initial.dateTo ?? ""} aria-label="終了日" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push("/memos")}>
          クリア
        </Button>
        <Button type="submit">検索</Button>
      </div>
    </form>
  );
}
