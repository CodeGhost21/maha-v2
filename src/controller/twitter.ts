import { User } from "./../database/models/user";
import nconf from "nconf";
// import * as user from './user'
import callback from "../library/oauth-promise";
const oauthCallback = nconf.get("TWITTER_CALLBACK_URL");

const oauth = callback(oauthCallback);
const COOKIE_NAME = "oauth_token";

const tokens: any = {};

export const oAuthRequestToken = async (req: any, res: any) => {
  try {
    const { oauth_token, oauth_token_secret } =
      await oauth.getOAuthRequestToken();
    await res.cookie(COOKIE_NAME, oauth_token, {
      maxAge: 15 * 60 * 1000, // 15 minutes
      httpOnly: true,
    });
    tokens[oauth_token] = { oauth_token_secret };

    res.json({ oauth_token });
  } catch (e) {
    console.error(e);
  }
};

export const oAuthAccessToken = async (req: any, res: any) => {
  try {
    const { oauth_token: req_oauth_token, oauth_verifier } = req.body;
    const oauth_token = req.headers["access-token"];
    // const oauth_token = global_oauth_token
    const oauth_token_secret = tokens[oauth_token].oauth_token_secret;

    if (oauth_token !== req_oauth_token) {
      res.status(403).json({ message: "Request tokens do not match" });
      return;
    }
    const { oauth_access_token, oauth_access_token_secret } =
      await oauth.getOAuthAccessToken(
        oauth_token,
        oauth_token_secret,
        oauth_verifier
      );
    tokens[oauth_token] = {
      ...tokens[oauth_token],
      oauth_access_token,
      oauth_access_token_secret,
    };
    res.json({ success: true });

    // } catch (error) {
    //     res.status(403).json({ message: "Missing access token" });
    // }
  } catch (e) {
    console.log(e);
  }
};

export const userProfileBanner = async (req: any, res: any) => {
  try {
    const oauth_token = req.headers["access-token"];
    // const oauth_token = global_oauth_token;

    const { oauth_access_token, oauth_access_token_secret } =
      tokens[oauth_token];
    const response: any = await oauth.getProtectedResource(
      "https://api.twitter.com/1.1/account/verify_credentials.json",
      "GET",
      oauth_access_token,
      oauth_access_token_secret
    );

    const parseData = JSON.parse(response.data);
    const user = await User.findOne({ _id: req.user.id });
    if (user) {
      user["twitterID"] = parseData.id_str;
      user["twitterName"] = parseData.name;
      user["twitterBio"] = parseData.description;
      user["twitterProfileImg"] = parseData.profile_image_url_https;
      user["twitterBanner"] = parseData.profile_banner_url;
      user["twitterOauthAccessToken"] = oauth_access_token;
      user["twitterOauthAccessTokenSecret"] = oauth_access_token_secret;
      user["signTwitter"] = true;
      await user.save();
      res.json({ success: true });
    }
  } catch (error) {
    res.status(403).json({ message: "Missing, invalid, or expired tokens" });
  }
};

export const twitterLogout = async (req: any, res: any) => {
  try {
    const oauth_token = req.cookies[COOKIE_NAME];
    delete tokens[oauth_token];
    res.cookie(COOKIE_NAME, {}, { maxAge: -1 });
    res.json({ success: true });
  } catch (error) {
    res.status(403).json({ message: "Missing, invalid, or expired tokens" });
  }
};
