import { ensureEntityHasSeed } from "@/lib/seeds/ensure";
import { loadAllGoals } from "@/lib/goals/storage";
import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";

export type InboxManualItem = {
  id: string;
  title: string;
  item_type: string;
  note?: string;
  created_at: string;
};

export type InboxListItem = {
  id: string;
  title: string;
  itemType: string;
  /** inbox 手动项 或 goals 待定目标 */
  source: "inbox" | "goal";
  goalId?: string;
  createdAt: string;
};

function loadManualInboxItems(): InboxManualItem[] {
  return loadLocal<InboxManualItem[]>(LOCAL_KEYS.inbox, []);
}

function saveManualInboxItems(items: InboxManualItem[]) {
  saveLocal(LOCAL_KEYS.inbox, items);
}

export async function loadAllInboxItems(): Promise<InboxListItem[]> {
  const list: InboxListItem[] = [];

  if (!isCloudEnabled()) {
    const manual = loadManualInboxItems();
    manual.forEach((item) => {
      list.push({
        id: item.id,
        title: item.title,
        itemType: item.item_type || "未归类",
        source: "inbox",
        createdAt: item.created_at,
      });
    });
    const goals = await loadAllGoals();
    goals
      .filter((g) => g.goal_type === "pending")
      .forEach((g) => {
        list.push({
          id: `goal-${g.id}`,
          title: g.title,
          itemType: "待定目标",
          source: "goal",
          goalId: g.id,
          createdAt: g.created_at,
        });
      });
  } else {
    const supabase = createClient();
    const { data: goals } = await supabase
      .from("goals")
      .select("id, title, created_at")
      .eq("goal_type", "pending");
    goals?.forEach((g) => {
      list.push({
        id: `goal-${g.id}`,
        title: g.title,
        itemType: "待定目标",
        source: "goal",
        goalId: g.id,
        createdAt: g.created_at,
      });
    });
    const { data: inbox } = await supabase.from("inbox_items").select("*");
    inbox?.forEach((i) => {
      list.push({
        id: i.id,
        title: i.title,
        itemType: i.item_type || "未归类",
        source: "inbox",
        createdAt: i.created_at,
      });
    });
  }

  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addInboxItem(
  title: string,
  itemType = "未归类",
  note?: string
) {
  const trimmed = title.trim();
  if (!trimmed) return loadAllInboxItems();
  const now = new Date().toISOString();

  if (!isCloudEnabled()) {
    const prev = loadManualInboxItems();
    const row: InboxManualItem = {
      id: crypto.randomUUID(),
      title: trimmed,
      item_type: itemType,
      note: note?.trim() || undefined,
      created_at: now,
    };
    saveManualInboxItems([row, ...prev]);
    ensureEntityHasSeed({
      entityType: "inbox_manual",
      entityId: row.id,
      title: row.title,
      stage: "inbox",
    });
    return loadAllInboxItems();
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return loadAllInboxItems();
  await supabase.from("inbox_items").insert({
    user_id: user.id,
    title: trimmed,
    item_type: itemType,
  });
  return loadAllInboxItems();
}

export async function removeInboxItem(id: string) {
  if (!isCloudEnabled()) {
    const prev = loadManualInboxItems();
    saveManualInboxItems(prev.filter((i) => i.id !== id));
    return loadAllInboxItems();
  }
  const supabase = createClient();
  await supabase.from("inbox_items").delete().eq("id", id);
  return loadAllInboxItems();
}
