import { IUserModel } from "./../database/models/user";

import { Request, Response } from "express";
import twiiterOauth from "../library/twitter-oauth";
import BadRequestError from "../errors/BadRequestError";

export const requestToken = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  const { oauthToken, oauthTokenSecret } =
    await twiiterOauth.getOAuthRequestToken();

  // set request token into user obj
  user.twitterRequestToken = oauthToken;
  user.twitterRequestTokenSecret = oauthTokenSecret;
  await user.save();

  res.json({ oauthToken });
};

export const verifyAccessToken = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const { oauthToken, oauthVerifier } = req.body;

  // validate
  if (!oauthToken) throw new BadRequestError("missing oauth token");
  if (!oauthVerifier) throw new BadRequestError("missing oauth verified");
  if (String(oauthToken) !== String(user.twitterRequestToken))
    throw new BadRequestError("oauth token mismatch");

  // convert request token to access token
  const { oauthAccessToken, oauthAccessTokenSecret } =
    await twiiterOauth.getOAuthAccessToken(
      user.twitterRequestToken,
      user.twitterRequestTokenSecret,
      oauthVerifier
    );

  // fetch the twitter profile to see if everything works
  const response = await twiiterOauth.getProtectedResource(
    "https://api.twitter.com/1.1/account/verify_credentials.json",
    "GET",
    oauthAccessToken,
    oauthAccessTokenSecret
  );

  const parseData = JSON.parse(response.data);

  user.twitterID = parseData.id_str;
  user.twitterName = parseData.name;
  user.twitterBio = parseData.description;
  user.twitterProfileImg = parseData.profile_image_url_https;
  user.twitterBanner = parseData.profile_banner_url;
  user.twitterOauthAccessToken = oauthAccessToken;
  user.twitterOauthAccessTokenSecret = oauthAccessTokenSecret;

  user.signTwitter = true; // todo this is really not needed tbh
  await user.save();

  res.json({ success: true });
};
