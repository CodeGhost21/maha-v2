import { IUserModel } from "./../database/models/user";

import { Request, NextFunction, Response } from "express";
import twiiterOauth from "../library/twitter-oauth";

const COOKIE_NAME = "oauth_token";

const tokens: any = {};

export const oAuthRequestToken = async (req: Request, res: Response) => {
  const { oauth_token, oauth_token_secret } =
    await twiiterOauth.getOAuthRequestToken();

  await res.cookie(COOKIE_NAME, oauth_token, {
    maxAge: 15 * 60 * 1000, // 15 minutes
    httpOnly: true,
  });

  tokens[oauth_token] = { oauth_token_secret };

  res.json({ oauth_token });
};

export const oAuthAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { oauth_token: req_oauth_token, oauth_verifier } = req.body;
  const oauth_token = req.header("access-token");
  if (!oauth_token) return next();

  // const oauth_token = global_oauth_token
  const oauth_token_secret = tokens[oauth_token].oauth_token_secret;

  if (oauth_token !== req_oauth_token) {
    res.status(403).json({ message: "Request tokens do not match" });
    return;
  }

  const { oauth_access_token, oauth_access_token_secret } =
    await twiiterOauth.getOAuthAccessToken(
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
};

export const userProfileBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as IUserModel;

  const oauth_token = req.header("access-token");
  if (!oauth_token) return next();

  const { oauth_access_token, oauth_access_token_secret } = tokens[oauth_token];

  const response = await twiiterOauth.getProtectedResource(
    "https://api.twitter.com/1.1/account/verify_credentials.json",
    "GET",
    oauth_access_token,
    oauth_access_token_secret
  );

  const parseData = JSON.parse(response.data);
  if (user) {
    user.twitterID = parseData.id_str;
    user.twitterName = parseData.name;
    user.twitterBio = parseData.description;
    user.twitterProfileImg = parseData.profile_image_url_https;
    user.twitterBanner = parseData.profile_banner_url;
    user.twitterOauthAccessToken = oauth_access_token;
    user.twitterOauthAccessTokenSecret = oauth_access_token_secret;
    user.signTwitter = true;
    await user.save();
    res.json({ success: true });
  }
};

export const twitterLogout = async (req: Request, res: Response) => {
  const oauth_token = req.cookies[COOKIE_NAME];
  delete tokens[oauth_token];
  res.cookie(COOKIE_NAME, {}, { maxAge: -1 });
  res.json({ success: true });
};
