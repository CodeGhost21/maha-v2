import { sendFeedDiscord } from "../utils/sendFeedDiscord";

import { Request, Response } from "express";
import twiiterOauth from "../library/twitterOauth";
import BadRequestError from "../errors/BadRequestError";
import { extractServerProfile } from "../utils/jwt";
import { Organization } from "../database/models/organization";
import { use } from "nconf";
import { Serializer } from "v8";
import { ServerProfile } from "../database/models/serverProfile";

export const requestToken = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);
  const user = await profile.getUser();

  const { oauthToken, oauthTokenSecret } =
    await twiiterOauth.getOAuthRequestToken();

  // set request token into user obj
  user.twitterRequestToken = oauthToken;
  user.twitterRequestTokenSecret = oauthTokenSecret;
  await user.save();

  res.json({ oauthToken });
};

export const verifyAccessToken = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);
  const user = await profile.getUser();

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

  // @ts-ignore
  const parseData = JSON.parse(response.data);

  user.twitterID = parseData.id_str;
  user.twitterName = parseData.name;
  user.twitterScreenName = parseData.screen_name;
  user.twitterBio = parseData.description;
  user.twitterProfileImg = parseData.profile_image_url_https;
  user.twitterBanner = parseData.profile_banner_url;
  user.twitterOauthAccessToken = oauthAccessToken;
  user.twitterOauthAccessTokenSecret = oauthAccessTokenSecret;

  await user.save();
  const userProfile: any = await ServerProfile.findOne({ userId: user.id });
  const org: any = await Organization.findOne({
    _id: userProfile.organizationId,
  });

  sendFeedDiscord(
    org.feedChannelId,
    `@${user.discordId} has verified their twitter account`
  );

  res.json({ success: true });
};
