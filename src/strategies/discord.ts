const passport = require('passport')
import nconf from "nconf";
import * as jwt from 'jsonwebtoken'
const { Strategy } = require('passport-discord');
import { User, IUserModel } from '../database/models/user'

const accessTokenSecret = nconf.get("JWT_SECRET")

passport.serializeUser((user: IUserModel, done: any) => {
    done(null, user.id)
})

passport.deserializeUser(async (id: string, done: any) => {
    try {
        const user = await User.findById(id)
        done(null, user)
    }
    catch (e) {
        console.log(e);
        done(e)
    }
})

passport.use(new Strategy({
    clientID: '876737547286495252',
    clientSecret: '-T_qEehGXvw3qJBB0fhLSrxpyH1cQtJh',
    callbackURL: 'https://d924-14-142-22-194.in.ngrok.io/discord/redirect',
    scope: ['identify']
}, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
    // console.log(accessToken, refreshToken);
    if (profile) {
        const user = await User.findOne({ userID: profile.id })
        if (user) {
            done(null, user)
        } else {
            const newUser = new User({
                userID: profile.id,
                userTag: `${profile.username}#${profile.discriminator}`,
                discordName: profile.username,
                discordDiscriminator: profile.discriminator,
                discordAvatar: profile.avatar
            });
            await newUser.save();
            const token = await jwt.sign({ userID: String(newUser.userID) }, accessTokenSecret)
            //saving jwt token
            newUser['jwt'] = token
            await newUser.save();
            done(null, newUser)
        }
    } else {
        done(new Error('no discord profile found'))
    }
}))