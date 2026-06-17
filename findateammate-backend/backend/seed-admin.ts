import "./load-env";
import argon2 from "argon2";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export async function seedAdminOnce() {
    // SECURITY: Using environment variables to avoid hardcoding credentials in the repo
    const email = process.env.ADMIN_EMAIL;
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!password || !email || !username) {
        console.warn("ADMIN_EMAIL, ADMIN_USERNAME, or ADMIN_PASSWORD environment variable not set. Skipping admin seed.");
        console.warn("Please set these environment variables to seed the admin user.");
        return;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[Attempt ${attempt}/${MAX_RETRIES}] Checking if admin user ${username} exists...`);
            
            // Optimization: efficient check using OR condition instead of fetching all users
            const existingAdmin = await db.query.users.findFirst({
                where: (u, { or, eq }) => or(eq(u.username, username), eq(u.email, email))
            });

            if (existingAdmin) {
                console.log("Admin user already exists. Skipping creation.");
            } else {
                console.log("Hashing password...");
                const hashedPassword = await argon2.hash(password);
        
                console.log("Creating superadmin user...");
                await db.insert(users).values({
                    name: "World Admin",
                    username: username,
                    email: email,
                    password: hashedPassword,
                    isAdmin: true,
                    skills: ["Everything"],
                    bio: "System Superadmin",
                    portfolio: "https://findateammate.com",
                    github: "https://github.com",
                    university: "Central System",
                    city: "Internal",
                    privacy: {
                        showEmail: true,
                        showPortfolio: true,
                        showUniversity: true,
                        showCity: true
                    }
                });
                console.log(`Superadmin '${username}' created successfully!`);
            }

            // Always check/promote secondary admin
            try {
                const secondaryEmail = "rcraghul12@gmail.com";
                const [secondaryUser] = await db.select().from(users).where(eq(users.email, secondaryEmail));
                if (secondaryUser && !secondaryUser.isAdmin) {
                     console.log(`Promoting ${secondaryEmail} to admin...`);
                     await db.update(users).set({ isAdmin: true }).where(eq(users.email, secondaryEmail));
                     console.log(`Promoted ${secondaryEmail} to admin.`);
                }
            } catch (err: any) {
                console.warn("Failed to check/promote secondary admin:", err.message);
            }
            
            return; // Exit after successful attempt

        } catch (err: any) {
            console.error(`Seeding attempt ${attempt} failed:`, err.message);
            if (attempt < MAX_RETRIES) {
                console.log(`Retrying in ${RETRY_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                console.error("All seeding attempts failed.");
            }
        }
    }

}

// Self-execution logic removed to prevent bundled server exit.
// This function should be called explicitly by the server or a standalone runner.
