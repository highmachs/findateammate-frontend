import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import { logger } from "./lib/logger";

export function setupAuth(app: Express) {
  // Use env var for callback URL in split deployment (frontend on Vercel, backend on Render)
  // Ensure the full URL is added to Google Cloud Console Authorized Redirect URIs
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

      // 1. Check if user already exists via Google ID
      let user = await storage.getUserByGoogleId(profile.id);
      if (user) return done(null, user);

      // 2. Check if user exists via email (Link existing account)
      user = await storage.getUserByEmail(email);
      if (user) {
        // BUG #61 FIX: Auto-upgrade local users to Google OAuth
        // When existing local user signs in with Google → upgrade to Google OAuth
        user = await storage.updateUser(user.id, { 
          googleId: profile.id, 
          authProvider: 'google',  // Migrate from 'local' to 'google'
          avatar: profile.photos?.[0].value || user.avatar
        });
        return done(null, user);
      }

      // 3. First time Google login - Create account with skeleton data
      try {
        user = await storage.createOAuthUser({
          name: profile.displayName,
          email: email,
          username: `user_${crypto.randomBytes(4).toString('hex')}`,
          googleId: profile.id,
          avatar: profile.photos?.[0].value,
          authProvider: 'google',
          // Default required fields for schema compliance
          skills: [],  // Empty array - will redirect to onboarding
          bio: "",
          portfolio: "",
          github: "",
          privacy: { showEmail: false, showPortfolio: false, showUniversity: false, showCity: false }
        });

        // Send welcome email on first-time registration.
        // Do not block auth flow if email delivery fails.
        try {
          const { sendWelcomeEmail } = await import("./lib/mail");
          await sendWelcomeEmail(user.email, user.name || user.username || "there");
        } catch (mailError) {
          logger.error("Failed to send welcome email on registration", mailError);
        }
      } catch (insertError: any) {
        // Race condition: user was created between our checks and INSERT
        // Try to fetch the user one more time
        user = await storage.getUserByGoogleId(profile.id) || await storage.getUserByEmail(email);
        if (!user) {
          // Still can't find user - this is a real error
          return done(insertError);
        }
      }

      return done(null, { ...user, isNewUser: true });
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      // If user doesn't exist, return null (not an error) - this happens for unauthenticated requests
      done(null, user || null);
    } catch (err) {
      // On actual errors, pass null user (don't crash the request)
      done(null, null);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Routes
  app.get("/api/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get("/api/auth/google/callback", 
    passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
    async (req: any, res) => {
      // BUG #26 FIX: Save user data BEFORE session.regenerate() wipes req.user.
      // session.regenerate() creates a brand new session, clearing req.session.passport
      // and therefore req.user. Any check on req.user after regenerate always returns undefined.
      const userBeforeRegen = req.user as any;

      // CRITICAL: Regenerate session ID after successful OAuth to prevent session fixation
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // BUG #41 FIX: session.regenerate() creates an empty new session — Passport's
      // req.session.passport.user is wiped so the user is completely unauthenticated on
      // every subsequent request. req.login() re-runs serializeUser, writes the user ID
      // back into req.session.passport.user, and saves the session.
      await new Promise<void>((resolve, reject) => {
        req.login(userBeforeRegen, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Redirect to the frontend domain (Vercel) after successful auth
      // Use saved user data since req.user is cleared after regeneration
      const frontendUrl = process.env.FRONTEND_URL || '';
      const hasSkills = Array.isArray(userBeforeRegen?.skills) && userBeforeRegen.skills.length > 0;
      const hasCity = Boolean((userBeforeRegen?.city || "").trim());
      const hasUniversity = Boolean((userBeforeRegen?.university || "").trim());
      const normalizedDepartment = String(userBeforeRegen?.department || "").trim().toUpperCase();
      const hasDepartment =
        normalizedDepartment.length > 0 &&
        normalizedDepartment !== "OTHER";
      const isNewUser =
        userBeforeRegen?.isNewUser ||
        !(hasSkills && hasCity && hasUniversity && hasDepartment);
      if (isNewUser) {
        return res.redirect(`${frontendUrl}/onboarding`);
      }
      res.redirect(`${frontendUrl}/`);
    }
  );
}
