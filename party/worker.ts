// Worker entrypoint for Wrangler — exports all Durable Object classes
// and routes incoming requests to the correct party room.
import { routePartykitRequest } from "partyserver";
import { ChatRoom } from "./chat";
import { NotificationRoom } from "./notifications";
import { GlobalRoom } from "./global";

// Re-export all Durable Object classes so Wrangler can bind them
export { ChatRoom, NotificationRoom, GlobalRoom };

export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    // partyserver's router matches the URL path to the correct DO class
    return routePartykitRequest(request, env) ||
      new Response("Not found", { status: 404 });
  },
};
