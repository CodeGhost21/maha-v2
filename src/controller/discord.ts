import { NextFunction, Request, Response, Router } from "express";
import nconf from "nconf";
import passport from "passport";

import axios from "axios";
import urlJoin from "../utils/url-join";
import { IWalletUserModel, WalletUser } from "../database/models/walletUsers";
import { checkGuildMember } from "../output/discord";
import { points } from "./quests/constants";
import { assignPoints } from "./quests/assignPoints";
import BadRequestError from "../errors/BadRequestError";
import qs from "qs";
import deserializeUser from "../middleware/deserializeUser";

const router = Router();

interface IDiscordUser {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
  locale: string;
}

router.get(
  "/verify",
  passport.authenticate("discord", {
    successRedirect: urlJoin(nconf.get("FRONTEND_URL"), `/#/discord/callback`),
  })
);

const callbackURL = urlJoin(nconf.get("FRONTEND_URL"), "/#/discord/callback");
const clientID = nconf.get("DISCORD_CLIENT_ID");
const clientSecret = nconf.get("DISCORD_CLIENT_SECRET");

router.get("/redirect", (_req, res) => {
  res.redirect(
    `https://discord.com/oauth2/authorize?response_type=code&` +
      `client_id=${clientID}&scope=identify&redirect_uri` +
      `=${encodeURIComponent(callbackURL)}`
  );
});

router.get("/callback", passport.authenticate("discord"), async (req, res) => {
  const reqUser = req.user as any;
  const user = await WalletUser.findById(req.query.state);
  const discordUser = await WalletUser.findOne({ discordId: req.query.state });

  console.log("gpt", user, req.query);

  if (!user) return;
  let url = `/#/tasks?status=discord_error`;

  if (!discordUser) {
    const isFollow = await checkGuildMember(reqUser.id);
    if (isFollow) {
      user.checked.discordFollow = true;
      await assignPoints(
        user.id,
        points.discordFollow,
        "Discord Follower",
        true,
        "discordFollow"
      );
    }
    user.discordId = reqUser.id;
    user.checked.discordVerify = true;
    user.checked.discordFollow = isFollow;
    await user.save();

    url = `/#/tasks?status=discord_success`;
  }

  res.redirect(urlJoin(nconf.get("FRONTEND_URL"), url));
});

const getUserFromAccessCode = async (code: string) => {
  const url = "https://discord.com/api/oauth2/token";

  const data = {
    grant_type: "authorization_code",
    code: code,
    redirect_uri: callbackURL,
    client_id: clientID,
    client_secret: clientSecret,
    scope: "identify",
  };

  try {
    const body = await axios({
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: qs.stringify(data),
      url,
    });

    const user = await axios<IDiscordUser>({
      method: "GET",
      headers: { Authorization: `Bearer ${body.data.access_token}` },
      url: "https://discord.com/api/users/@me",
    });
    return user.data;
  } catch (error) {
    throw new BadRequestError("Invalid Discord token. Try logging again");
  }
};

router.post(
  "/register",
  deserializeUser,
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IWalletUserModel;

    try {
      const data = await getUserFromAccessCode(req.body.code);
      if (!data)
        throw new BadRequestError("Invalid Discord token. Try logging again");

      // check if there is an existing user
      const existingUser = await WalletUser.findOne({ discordId: data.id });
      if (existingUser && existingUser.id !== user.id)
        throw new BadRequestError(
          "Discord account already assigned to another wallet"
        );

      const isGuildMember = await checkGuildMember(data.id);
      //assign role to user using discord api
      if (isGuildMember && !user.checked.discordFollow) {
        user.checked.discordFollow = true;
        const tx = await assignPoints(
          user.id,
          points.discordFollow,
          "Discord Follower",
          true,
          "discordFollow"
        );
        await tx?.execute();
      }

      user.discordId = data.id;
      user.checked.discordVerify = true;
      user.checked.discordFollow = isGuildMember;
      await user.save();

      res.json({
        success: true,
        discordUser: data,
        user: user,
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
