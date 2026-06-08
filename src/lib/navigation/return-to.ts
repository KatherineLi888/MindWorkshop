export const RETURN_PARAM = "returnTo";

/** 为跳转链接附加来源页，供目标页显示返回按钮 */
export function appendReturnTo(href: string, returnPath: string): string {
  if (!returnPath.startsWith("/")) return href;
  const [path, existingQuery] = href.split("?");
  const params = new URLSearchParams(existingQuery ?? "");
  params.set(RETURN_PARAM, returnPath);
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

export function parseReturnTo(
  searchParams: URLSearchParams | null | undefined
): string | null {
  const raw = searchParams?.get(RETURN_PARAM);
  if (!raw || !raw.startsWith("/")) return null;
  return raw;
}

export function returnButtonLabel(returnTo: string): string {
  if (returnTo.startsWith("/seeds")) return "返回种子";
  return "返回上级";
}
