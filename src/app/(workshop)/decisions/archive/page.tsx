import { redirect } from "next/navigation";

export default function DecisionsArchiveRedirect() {
  redirect("/archive?tab=decisions");
}
