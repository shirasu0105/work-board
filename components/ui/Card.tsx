import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  /** padding を外したいケース用 */
  bare?: boolean;
};

/**
 * Notion 風カード。whisper border ＋ subtle shadow ＋ 12px radius。
 * 後続フェーズでリスト・かんばん列・フォームコンテナとして使い回す前提。
 */
export function Card({
  className,
  bare = false,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-paper border-whisper shadow-card rounded-[12px]",
        bare ? "" : "p-5",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-3 flex items-center justify-between gap-3",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-[18px] font-semibold leading-tight text-ink",
        className
      )}
      {...rest}
    >
      {children}
    </h2>
  );
}
