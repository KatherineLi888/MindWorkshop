import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/user";
import type { ThoughtSession } from "./types";

function sessionToRow(session: ThoughtSession, userId: string) {
  return {
    id: session.id,
    user_id: userId,
    title: session.title,
    session_data: {
      nodes: session.nodes,
      editorView: session.editorView,
      textChildLayout: session.textChildLayout,
      childOrder: session.childOrder,
      sourceTriageId: session.sourceTriageId,
    },
    created_at: session.createdAt,
    updated_at: session.updatedAt,
  };
}

export async function syncThoughtSessionToCloud(
  session: ThoughtSession
): Promise<void> {
  if (!isCloudEnabled()) return;
  const userId = await getCurrentUserId();
  if (!userId || userId === "local") return;
  const supabase = createClient();
  await supabase
    .from("thinking_sessions")
    .upsert(sessionToRow(session, userId), { onConflict: "id" });
}

export async function syncAllThoughtSessionsToCloud(
  sessions: ThoughtSession[]
): Promise<void> {
  if (!isCloudEnabled() || !sessions.length) return;
  const userId = await getCurrentUserId();
  if (!userId || userId === "local") return;
  const supabase = createClient();
  await supabase
    .from("thinking_sessions")
    .upsert(
      sessions.map((s) => sessionToRow(s, userId)),
      { onConflict: "id" }
    );
}

export async function deleteThoughtSessionFromCloud(
  id: string
): Promise<void> {
  if (!isCloudEnabled()) return;
  const userId = await getCurrentUserId();
  if (!userId || userId === "local") return;
  const supabase = createClient();
  await supabase
    .from("thinking_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
}
