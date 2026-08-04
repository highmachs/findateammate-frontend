// Worker entrypoint for Wrangler — exports all Durable Object classes
// and routes incoming requests to the correct party room.
import { routePartykitRequest } from "partyserver";
import { Chat } from "./chat";
import { Notifications } from "./notifications";
import { Global } from "./global";

export { Chat, Notifications, Global };

export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    // partyserver's router matches the URL path to the correct DO class
    return routePartykitRequest(request, env) ||
      new Response("Not found", { status: 404 });
  },
};
