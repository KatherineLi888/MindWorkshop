export const RETURN_PARAM = "returnTo";

export const STATS_HOME = "/stats";
export const SEEDS_HOME = "/seeds";

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
  if (returnTo === STATS_HOME || returnTo.startsWith(`${STATS_HOME}?`)) {
    return "返回统计";
  }
  if (returnTo.startsWith(SEEDS_HOME)) return "返回种子";
  return "返回上级";
}

/** 从统计页跳出时附带 returnTo */
export function withStatsReturn(href: string): string {
  return appendReturnTo(href, STATS_HOME);
}

/** 从种子页跳出时附带 returnTo */
export function withSeedsReturn(href: string): string {
  return appendReturnTo(href, SEEDS_HOME);
}

/** 通用：有 returnTo 则附加 */
export function withReturn(href: string, returnTo?: string): string {
  return returnTo ? appendReturnTo(href, returnTo) : href;
}
