import { IUserModel } from "./../database/models/user";

import { Request, NextFunction, Response } from "express";
import twiiterOauth from "../library/twitter-oauth";

const COOKIE_NAME = "oauthToken";

const tokens: any = {};

export const oAuthRequestToken = async (req: Request, res: Response) => {
  const { oauthToken, oauthTokenSecret } =
    await twiiterOauth.getOAuthRequestToken();

  await res.cookie(COOKIE_NAME, oauthToken, {
    maxAge: 15 * 60 * 1000, // 15 minutes
    httpOnly: true,
  });

  tokens[oauthToken] = { oauthTokenSecret };

  res.json({ oauthToken });
};

export const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { oauthToken, oauthVerifier } = req.body;

  if (!oauthToken) return next();

  // const oauthToken = global_oauthToken
  const oauthToken_secret = tokens[oauthToken].oauthToken_secret;

  const {
    oauthAccessToken: oauthAccessToken,
    oauthAccessTokenSecret: oauthTokenSecret,
    results,
  } = await twiiterOauth.getOAuthAccessToken(
    oauthToken,
    oauthToken_secret,
    oauthVerifier
  );

  console.log(results);

  tokens[oauthToken] = {
    ...tokens[oauthToken],
    oauthAccessToken,
    oauthTokenSecret,
  };

  res.json({ success: true });
};

export const userProfileBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as IUserModel;

  const oauthToken = req.header("access-token");
  if (!oauthToken) return next();

  const { oauthAccessToken, oauthTokenSecret } = tokens[oauthToken];

  const response = await twiiterOauth.getProtectedResource(
    "https://api.twitter.com/1.1/account/verify_credentials.json",
    "GET",
    oauthAccessToken,
    oauthTokenSecret
  );

  const parseData = JSON.parse(response.data);
  if (user) {
    user.twitterID = parseData.id_str;
    user.twitterName = parseData.name;
    user.twitterBio = parseData.description;
    user.twitterProfileImg = parseData.profile_image_url_https;
    user.twitterBanner = parseData.profile_banner_url;
    user.twitterOauthAccessToken = oauthAccessToken;
    user.twitterOauthAccessTokenSecret = oauthTokenSecret;
    user.signTwitter = true;
    await user.save();
    res.json({ success: true });
  }
};

export const twitterLogout = async (req: Request, res: Response) => {
  const oauthToken = req.cookies[COOKIE_NAME];
  delete tokens[oauthToken];
  res.cookie(COOKIE_NAME, {}, { maxAge: -1 });
  res.json({ success: true });
};
