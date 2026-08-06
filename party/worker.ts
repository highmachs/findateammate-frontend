// Worker entrypoint for Wrangler — exports all Durable Object classes
// and routes incoming requests to the correct party room.
import { routePartykitRequest } from "partyserver";
import Chat from "./chat";
import Notifications from "./notifications";
import Global from "./global";

export { Chat, Notifications, Global };

export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    console.log(`[WebSocket Request] ${request.url}`);
    console.log(`[Env Keys]`, Object.keys(env));
    const response = await routePartykitRequest(request, env);
    if (!response) {
      console.log(`[Router] No match found for URL. Returning 404.`);
    }
    return response || new Response("Not found", { status: 404 });
  },
};
