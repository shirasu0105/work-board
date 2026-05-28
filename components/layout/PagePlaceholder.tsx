import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export type PagePlaceholderProps = {
  /** ページの目的を 1〜2 行で示す説明 */
  description: string;
  /** Phase 1 時点でこの画面が「まだ何も持たない」ことを示す注記 */
  note?: string;
  children?: ReactNode;
};

/**
 * Phase 1 で全ページに置く、空状態を示す共通プレースホルダ。
 * 後続フェーズで本実装に差し替えられる前提のため、
 * 過度な装飾はせず Card 1 枚にコンパクトな説明だけを置く。
 */
export function PagePlaceholder({
  description,
  note,
  children,
}: PagePlaceholderProps) {
  return (
    <Card>
      <p className="text-[14px] leading-[1.6] text-ink">{description}</p>
      {note ? (
        <p className="mt-3 text-[12px] leading-[1.6] text-ink-2">{note}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
}
