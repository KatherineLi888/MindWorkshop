import { redirect } from "next/navigation";
import { AUTH_ENABLED } from "@/lib/config";

export default async function Home() {
  if (AUTH_ENABLED) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    redirect(user ? "/home" : "/login");
  }
  redirect("/home");
}
