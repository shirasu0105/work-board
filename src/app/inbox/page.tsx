import { PageShell } from "@/components/layout/PageShell";
import { InboxView } from "@/components/inbox/InboxView";
import {
  listUnorganizedInbox,
  listRecentlyOrganizedInbox,
} from "@/lib/queries/inbox";
import { listActiveCategories } from "@/lib/queries/categories";
import { listProjects } from "@/lib/queries/projects";

export const dynamic = "force-dynamic";

export default function InboxPage() {
  const items = listUnorganizedInbox();
  const recent = listRecentlyOrganizedInbox();
  const categories = listActiveCategories();
  const projects = listProjects().filter((p) => p.status === "active");

  return (
    <PageShell title="Inbox">
      <InboxView
        items={items}
        recent={recent}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />
    </PageShell>
  );
}
