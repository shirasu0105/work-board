import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inboxItems, type InboxItem } from "@/lib/db/schema";

/** 未整理の Inbox 項目（古い順 = 滞留が分かるように）。 */
export function listUnorganizedInbox(): InboxItem[] {
  return db
    .select()
    .from(inboxItems)
    .where(eq(inboxItems.status, "未整理"))
    .orderBy(asc(inboxItems.createdAt))
    .all();
}

/** 直近で整理済みになった項目（履歴表示用、最新順）。 */
export function listRecentlyOrganizedInbox(limit = 10): InboxItem[] {
  return db
    .select()
    .from(inboxItems)
    .where(eq(inboxItems.status, "整理済み"))
    .orderBy(desc(inboxItems.organizedAt))
    .limit(limit)
    .all();
}
