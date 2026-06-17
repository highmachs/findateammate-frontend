
import "./load-env";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkAdmin() {
    const username = "worldadmin";
    console.log(`Searching for user: ${username}...`);

    const foundUsers = await db.select().from(users).where(eq(users.username, username));

    if (foundUsers.length === 0) {
        console.log("User NOT found!");
    } else {
        const u = foundUsers[0];
        console.log("User found:");
        console.log("ID:", u.id);
        console.log("Username:", u.username);
        console.log("Email:", u.email);
        console.log("IsAdmin:", u.isAdmin);
        console.log("Password Hash Length:", u.password?.length);
    }
    process.exit(0);
}

checkAdmin();
