import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
   const client = createClient({ 
       url: process.env.TURSO_DATABASE_URL || "sqlite://./local.db",
       authToken: process.env.TURSO_AUTH_TOKEN 
   });
   const res = await client.execute("select 1");
   console.log(res.rows);
}

main().catch(console.error);
