import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "crypto";
import { storage } from "./storage";
import { logger } from "./logger";
import { sessionMiddleware } from "./middleware";

const authApp = express();
authApp.use(sessionMiddleware as any);
authApp.use(passport.initialize());
authApp.use(passport.session());

const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: callbackURL,
  scope: ['profile', 'email'],
  state: true
}, async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
  try {
    const email = profile.emails?.[0].value;
    if (!email) return done(new Error("No email found in Google profile"));

    let user = await storage.getUserByGoogleId(profile.id);
    if (user) return done(null, user);

    user = await storage.getUserByEmail(email);
    if (user) {
      user = await storage.updateUser(user.id, { 
        googleId: profile.id, 
        authProvider: 'google',
        avatar: profile.photos?.[0].value || user.avatar
      });
      return done(null, user);
    }

    try {
      user = await storage.createOAuthUser({
        name: profile.displayName,
        email: email,
        username: `user_${crypto.randomBytes(4).toString('hex')}`,
        googleId: profile.id,
        avatar: profile.photos?.[0].value,
        authProvider: 'google',
        skills: [],
        bio: "",
        portfolio: "",
        github: "",
        department: "OTHER",
        city: "",
        university: "",
        privacy: { showEmail: false, showPortfolio: false, showUniversity: false, showCity: false }
      });

      try {
        const { sendWelcomeEmail } = await import("./mail");
        await sendWelcomeEmail(user.email, user.name || user.username || "there");
      } catch (mailError) {
        logger.error("Failed to send welcome email on registration", mailError);
      }
    } catch (insertError: any) {
      user = await storage.getUserByGoogleId(profile.id) || await storage.getUserByEmail(email);
      if (!user) return done(insertError);
    }

    return done(null, { ...user, isNewUser: true });
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user || null);
  } catch (err) {
    done(null, null);
  }
});

export { authApp, passport };
