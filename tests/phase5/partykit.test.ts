import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import path from "path";

const PARTY_DIR = path.resolve(__dirname, "../../party");

function partyFile(f: string) { return path.join(PARTY_DIR, f); }
function readParty(f: string) { return readFileSync(partyFile(f), "utf-8"); }

describe("Phase 5: PartyKit server files", () => {

  describe("party/chat.ts", () => {
    it("exists", () => expect(existsSync(partyFile("chat.ts"))).toBe(true));
    it("imports from partykit/server", () => {
      expect(readParty("chat.ts")).toContain("partykit/server");
    });
    it("exports a default PartyKitServer object", () => {
      expect(readParty("chat.ts")).toContain("satisfies PartyKitServer");
    });
    it("implements onConnect, onMessage, onClose", () => {
      const src = readParty("chat.ts");
      for (const handler of ["onConnect", "onMessage", "onClose"]) {
        expect(src, `Missing ${handler}`).toContain(handler);
      }
    });
    it("persists messages to Turso via HTTP fetch (not Socket.IO)", () => {
      const src = readParty("chat.ts");
      expect(src).not.toContain("socket.io");
      // PartyKit servers call the Vercel API over HTTP for DB writes
      expect(src).toContain("fetch(");
    });
  });

  describe("party/notifications.ts", () => {
    it("exists", () => expect(existsSync(partyFile("notifications.ts"))).toBe(true));
    it("implements onConnect and onMessage", () => {
      const src = readParty("notifications.ts");
      expect(src).toContain("onConnect");
      expect(src).toContain("onMessage");
    });
  });

  describe("party/global.ts", () => {
    it("exists", () => expect(existsSync(partyFile("global.ts"))).toBe(true));
  });
});
