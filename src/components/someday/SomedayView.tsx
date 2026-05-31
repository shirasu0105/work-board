"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SomedayFormDrawer } from "./SomedayFormDrawer";
import {
  promoteSomeday,
  dropSomeday,
  reactivateSomeday,
} from "@/lib/actions/someday";
import { formatShortDate } from "@/lib/domain/date";
import type { Option } from "@/components/tasks/TaskFormDrawer";
import type { SomedayItem } from "@/lib/db/schema";
import type { SomedayWithCategory } from "@/lib/queries/someday";

interface Props {
  items: SomedayWithCategory[];
  categories: Option[];
}

const STATUS_LABEL: Record<string, string> = {
  active: "保留中",
  promoted: "タスク化済み",
  dropped: "見送り",
};

export function SomedayView({ items, categories }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SomedayItem | null>(null);

  const { active, others } = useMemo(
    () => ({
      active: items.filter((i) => i.status === "active"),
      others: items.filter((i) => i.status !== "active"),
    }),
    [items],
  );

  const hasCategories = categories.length > 0;

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }
  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-subtle">
          保留中 {active.length}件 / その他 {others.length}件
        </p>
        <Button onClick={openCreate} disabled={!hasCategories}>
          + Somedayを追加
        </Button>
      </div>

      {!hasCategories && (
        <p className="text-sm text-warning">
          先に設定画面でカテゴリを1つ以上作成してください。
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Someday/Maybe はありません"
          description="今はやらないが、いつかやるかもしれないことを記録します。"
        />
      ) : (
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            {active.map((item) => (
              <Card key={item.id}>
                <CardBody className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{item.content}</span>
                      {item.categoryName && <Badge tone="primary">{item.categoryName}</Badge>}
                      {item.reviewDate && (
                        <Badge tone="neutral">見直し {formatShortDate(item.reviewDate)}</Badge>
                      )}
                    </div>
                    {item.reason && (
                      <p className="mt-1 text-sm text-ink-subtle">{item.reason}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(item);
                        setOpen(true);
                      }}
                    >
                      編集
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => run(() => promoteSomeday(item.id))}>
                      タスク化
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => run(() => dropSomeday(item.id))}>
                      見送り
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
            {active.length === 0 && (
              <p className="text-sm text-ink-subtle">保留中の項目はありません。</p>
            )}
          </section>

          {others.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                処理済み
              </h3>
              {others.map((item) => (
                <Card key={item.id}>
                  <CardBody className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-ink-subtle line-through">{item.content}</span>
                      <Badge tone={item.status === "promoted" ? "success" : "neutral"}>
                        {STATUS_LABEL[item.status] ?? item.status}
                      </Badge>
                    </div>
                    {item.status === "dropped" && (
                      <Button variant="ghost" size="sm" onClick={() => run(() => reactivateSomeday(item.id))}>
                        戻す
                      </Button>
                    )}
                  </CardBody>
                </Card>
              ))}
            </section>
          )}
        </div>
      )}

      <SomedayFormDrawer
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        item={editing}
      />
    </div>
  );
}
