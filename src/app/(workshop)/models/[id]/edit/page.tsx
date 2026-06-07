import { redirect } from "next/navigation";

export default async function EditModelRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/models/library?selected=${id}`);
}
