import { PageShell } from "@/components/layout/PageShell";
import { SomedayView } from "@/components/someday/SomedayView";
import { listSomeday } from "@/lib/queries/someday";
import { listActiveCategories } from "@/lib/queries/categories";

export const dynamic = "force-dynamic";

export default function SomedayPage() {
  const items = listSomeday();
  const categories = listActiveCategories();

  return (
    <PageShell title="Someday / Maybe">
      <SomedayView
        items={items}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </PageShell>
  );
}
