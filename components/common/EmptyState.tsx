import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EmptyStateProps = {
  /** 空状態の主メッセージ（例: 「タスクがまだありません」） */
  title: string;
  /** 補足説明や次の一手の案内（任意） */
  description?: string;
  /** 追加導線（ボタン・リンク等、任意） */
  action?: ReactNode;
  /** 装飾アイコン（記号文字など、任意） */
  icon?: ReactNode;
  /** data-testid（画面ごとに固有値を付ける） */
  "data-testid"?: string;
  className?: string;
};

/**
 * 全主要画面で使い回す共通の空状態コンポーネント（Phase 8 仕上げ）。
 *
 * Notion 風の whisper border ＋ paper 背景の控えめなカードに、
 * メッセージと（任意で）次の一手の導線を中央寄せで表示する。
 * 500 エラーや真っ白画面ではなく「データが 0 件である」ことを明示する役割。
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  "data-testid": testId = "empty-state",
}: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-[12px] border-whisper bg-paper px-6 py-10 text-center",
        className
      )}
    >
      {icon ? (
        <div className="text-[28px] leading-none text-ink-3" aria-hidden>
          {icon}
        </div>
      ) : null}
      <p className="text-[14px] font-medium text-ink">{title}</p>
      {description ? (
        <p className="max-w-[420px] text-[12px] leading-[1.6] text-ink-2">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
