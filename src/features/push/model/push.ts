export type PushKind = "leave-soon" | "route-disruption" | "severe-weather";

export interface ActionablePush {
  kind: PushKind;
  title: string;
  body: string;
  url: string;
  eventId: string;
}

const ALLOWED_KINDS = new Set<PushKind>(["leave-soon", "route-disruption", "severe-weather"]);

export function validActionablePush(value: unknown, basePath = "/Trip-Guides/"): value is ActionablePush {
  const push = value as ActionablePush;
  return !!push && ALLOWED_KINDS.has(push.kind) && typeof push.title === "string" && push.title.trim().length > 0 && push.title.length <= 100 &&
    typeof push.body === "string" && push.body.trim().length > 0 && push.body.length <= 300 &&
    typeof push.eventId === "string" && push.eventId.length > 0 && push.eventId.length <= 160 &&
    typeof push.url === "string" && push.url.startsWith(basePath) && !push.url.startsWith("//");
}

export function mayOfferPush(input: { eventSourcesStable: boolean; inContext: boolean; permission: NotificationPermission }): boolean {
  return input.eventSourcesStable && input.inContext && input.permission !== "denied";
}

/**
 * Subscription storage/delivery is deliberately a port, not a partial endpoint. Implement it
 * only after live event sources and VAPID-backed server storage are deployed and reviewed.
 */
export interface PushSubscriptionPort {
  subscribe(subscription: PushSubscription): Promise<void>;
  unsubscribe(endpoint: string): Promise<void>;
}

