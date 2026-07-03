// Helper to send messages to PartyKit from Serverless functions
export async function broadcastToParty(room: string, event: string, payload?: any) {
  try {
    const partyUrl = process.env.PARTYKIT_URL || "http://127.0.0.1:1999";
    const res = await fetch(`${partyUrl}/parties/chat/${room}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: event, data: payload }),
    });
    if (!res.ok) {
      console.error("PartyKit broadcast failed:", await res.text());
    }
  } catch (err) {
    console.error("PartyKit network error:", err);
  }
}
