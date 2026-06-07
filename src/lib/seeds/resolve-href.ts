/** 种子生命事件中实体对应的跳转链接 */
export function seedEntityHref(
  entityType: string,
  entityId: string
): string | null {
  switch (entityType) {
    case "thinking_session":
      return `/thinking?session=${entityId}`;
    case "decision":
      return "/decisions";
    case "goal":
      return `/goals?detail=${entityId}`;
    case "graph_node":
      return "/graph";
    case "model_application":
      return "/models/apply";
    case "thinking_model":
      return `/models/library?selected=${entityId}`;
    case "theory":
      return `/theories/${entityId}`;
    case "triage":
      return "/home/records";
    case "review_record":
      return "/review";
    case "canvas_document":
      return "/canvas";
    case "inbox_manual":
      return "/inbox";
    default:
      return null;
  }
}
