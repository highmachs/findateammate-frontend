#!/bin/bash
npm install @libsql/client drizzle-orm drizzle-kit drizzle-zod
npm install @upstash/redis @upstash/ratelimit
npm install partysocket
npm install express-session cookie-parser cors helmet csrf-csrf
npm install passport passport-google-oauth20
npm install argon2 nanoid nodemailer multer cloudinary
npm install winston zod zod-validation-error

npm install -D vitest @vitest/coverage-v8 supertest @types/supertest
npm install -D partykit
npm install -D playwright @playwright/test
npm install -D tsx typescript @types/node @types/express @types/express-session
npm install -D @types/passport @types/passport-google-oauth20 @types/nodemailer
npm install -D @types/cors @types/cookie-parser @types/multer

npm uninstall pg connect-pg-simple socket.io socket.io-client express-rate-limit node-cron
npm uninstall -D @types/pg @types/socket.io @types/node-cron @types/connect-pg-simple
