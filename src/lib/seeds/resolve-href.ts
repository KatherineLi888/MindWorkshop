import { appendReturnTo } from "@/lib/navigation/return-to";

/** 种子生命事件中实体对应的跳转链接 */
export function seedEntityHref(
  entityType: string,
  entityId: string,
  returnTo?: string
): string | null {
  let href: string | null = null;
  switch (entityType) {
    case "thinking_session":
      href = `/thinking?session=${entityId}`;
      break;
    case "decision":
      href = `/decisions?detail=${entityId}`;
      break;
    case "goal":
      href = `/goals?detail=${entityId}`;
      break;
    case "graph_node":
      href = "/graph";
      break;
    case "model_application":
      href = "/models/apply";
      break;
    case "thinking_model":
      href = `/models/library?selected=${entityId}`;
      break;
    case "theory":
      href = `/theories/${entityId}`;
      break;
    case "triage":
      href = "/home/records";
      break;
    case "review_record":
      href = "/review";
      break;
    case "canvas_document":
      href = "/canvas";
      break;
    case "inbox_manual":
      href = "/inbox";
      break;
    default:
      return null;
  }
  if (!href) return null;
  return returnTo ? appendReturnTo(href, returnTo) : href;
}
