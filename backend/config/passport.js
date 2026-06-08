const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../models/User");
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || "http://localhost:5000"}/api/auth/google/callback`,
      scope: ["profile", "email"],
    },

    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email returned from Google"), null);
        }

        // Case 1: user already logged in with Google before
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // Case 2: email already exists (registered via email/password)
        // Link the Google account to the existing record so both login paths work.
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          // Only set avatar if the user doesn't already have one
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // Case 3: brand new user
        // Derive a username from the Google display name; ensure it's unique.
        const baseUsername = (profile.displayName || email.split("@")[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .slice(0, 20);

        const username = await uniqueUsername(baseUsername);

        const newUser = new User({
          username,
          email,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || null,
          // password is intentionally omitted — Google users don't have one.
          // If you want to let them set one later, add a "set password" flow.
        });
        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);
async function uniqueUsername(base) {
  let candidate = base;
  let n = 2;
  while (await User.findOne({ username: candidate })) {
    candidate = `${base}_${n++}`;
  }
  return candidate;
}

module.exports = passport;
