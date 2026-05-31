import { EmptyState } from "@/components/ui/EmptyState";

export function ComingSoon({ milestone }: { milestone: string }) {
  return (
    <EmptyState
      title="この画面は準備中です"
      description={`${milestone} で実装予定の機能です。現在のゴール（M0〜M3）の範囲外のため、まだ利用できません。`}
    />
  );
}
