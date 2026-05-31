/**
 * 並び替え（display_order）の純粋ロジック（ユニットテスト対象）。
 * D&D ライブラリに依存せず、id の並びから display_order を再採番する。
 */

export interface OrderAssignment {
  id: string;
  displayOrder: number;
}

/** 新しい id 順に 0..n-1 の display_order を割り当てる。 */
export function reassignDisplayOrder(orderedIds: string[]): OrderAssignment[] {
  return orderedIds.map((id, index) => ({ id, displayOrder: index }));
}

/**
 * activeId を overId の位置へ移動した後の id 順を返す。
 * （@dnd-kit の arrayMove と同等の結果を、ドメイン層で検証可能にしたもの）
 */
export function computeReorder(
  orderedIds: string[],
  activeId: string,
  overId: string,
): string[] {
  if (activeId === overId) return [...orderedIds];
  const from = orderedIds.indexOf(activeId);
  const to = orderedIds.indexOf(overId);
  if (from < 0 || to < 0) return [...orderedIds];
  const next = [...orderedIds];
  next.splice(from, 1);
  next.splice(to, 0, activeId);
  return next;
}
