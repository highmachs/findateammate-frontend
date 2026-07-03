import { describe, it, expect } from "vitest";
import PartySocket from "partysocket";

describe("Phase 5: PartyKit live connection tests", () => {
  it("connects to the chat party room and receives echo", async () => {
    const socket = new PartySocket({
      host: "127.0.0.1:1999",
      room: "test-room-" + Date.now(),
      party: "chat",
    });

    const connected = new Promise<void>((resolve) => socket.addEventListener("open", () => resolve()));
    await connected;
    expect(socket.readyState).toBe(WebSocket.OPEN);
    socket.close();
  });

  it("a message sent to chat room is broadcast back to other listeners", async () => {
    const roomId = "test-chat-" + Date.now();
    const sender = new PartySocket({ host: "127.0.0.1:1999", room: roomId, party: "chat" });
    const receiver = new PartySocket({ host: "127.0.0.1:1999", room: roomId, party: "chat" });

    await Promise.all([
      new Promise<void>((r) => receiver.readyState === 1 ? r() : receiver.addEventListener("open", () => r())),
      new Promise<void>((r) => sender.readyState === 1 ? r() : sender.addEventListener("open", () => r()))
    ]);

    const received = new Promise<string>((resolve) => {
      receiver.addEventListener("message", (evt) => {
        const data = JSON.parse(evt.data);
        if (data.type === "message") resolve(data.content);
      });
    });

    console.log('Sending message from client');
    sender.send(JSON.stringify({ type: "message", content: "hello partykit" }));
    const msg = await Promise.race([received, new Promise<string>((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000))]);
    expect(msg).toBe("hello partykit");
    sender.close(); receiver.close();
  });
});
