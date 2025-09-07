import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User, { IUser } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails?.[0]?.value });

        if (!user) {
            user = new User({
                provider: 'google',
                providerId: profile.id,
                name: profile.name.givenName || profile.displayName,
                lastname: profile.name.familyName,
                email: profile.emails?.[0]?.value,
                photo: profile.photos?.[0]?.value,
                isVerified: true
            });

            await user.save();
        } else if (!user.providerId) {
            user.provider = 'google';
            user.providerId = profile.id;
            if(!user.photo) {
                user.photo = profile.photos?.[0]?.value
            }
            await user.save();
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    callbackURL: "api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Busca al usuario por email
        let user = await User.findOne({ email: profile.emails?.[0]?.value });

        if (!user) {
            user = new User({
                provider: 'facebook',
                providerId: profile.id,
                name: profile.name.givenName || profile.displayName,
                lastname: profile.name.familyName,
                email: profile.emails?.[0]?.value,
                photo: profile.photos?.[0]?.value,
                isVerified: true
            });

            await user.save();
        } else if (!user.providerId) {
            user.provider = 'facebook';
            user.providerId = profile.id;
            if(!user.photo) {
                user.photo = profile.photos?.[0]?.value
            }
            await user.save();
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user: IUser, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport