import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemoForm } from "@/components/memos/MemoForm";
import { getMemo } from "@/lib/queries/memos";
import { listActiveCategories } from "@/lib/queries/categories";
import { listProjects } from "@/lib/queries/projects";
import { memoTypeLabel } from "@/lib/memoTypes";

export const dynamic = "force-dynamic";

export default async function MemoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const memo = getMemo(id);
  if (!memo) notFound();

  const categories = listActiveCategories().map((c) => ({ id: c.id, name: c.name }));
  const projects = listProjects()
    .filter((p) => p.status === "active")
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <PageShell title={`メモ：${memoTypeLabel(memo.memoType)}`}>
      <MemoForm categories={categories} projects={projects} memo={memo} />
    </PageShell>
  );
}
