import nconf from "nconf";
import * as jwt from "jsonwebtoken";

import { User } from "../database/models/user";

import { client } from "../output/discord";
import { zelayRequest } from "../utils/zelayRequest";
import { Message } from "../database/models/message";
import isYesterday from "date-fns/isYesterday";
import isToday from "date-fns/isToday";
import { userBonus } from "../controller/zealyBot";

const accessTokenSecret = nconf.get("JWT_SECRET");

client.on("messageCreate", async (message) => {
  if (message.channelId !== nconf.get("CHANNEL_MEME")) return;
  if (message.author.bot) return;

  //   const content = message.content.toLowerCase();

  const zelayUserData = await zelayRequest(
    "get",
    `https://api.zealy.io/communities/themahadao/users?discordId=${message.author.id}`
  );

  await User.findOne({ userID: message.author.id }).then(async (user) => {
    if (user) return;
    // If it's the user's first message
    const usersCount = await User.count();
    const newUser = new User({
      userTag: message.author.tag,
      userID: message.author.id,
      streak: 0,
      maxStreak: 0,
      totalGMs: 0,
      lastGM: message.createdAt,
      gmRank: usersCount + 1,
      discordName: message.author.username,
      discordAvatar: message.author.avatar,
      discordDiscriminator: message.author.discriminator,
      discordVerify: true,
    });
    await newUser.save();
    //save zelay users data
    if (zelayUserData.success) {
      newUser.zelayUserId = zelayUserData.data.id;
      newUser.zelayUserName = zelayUserData.data.name;
      await newUser.save();
    }

    const token = await jwt.sign({ id: String(newUser.id) }, accessTokenSecret);
    newUser.jwt = token;
    await newUser.save();
  });

  if (message.attachments.toJSON()[0].contentType === "image/png") {
    const newMessage = new Message({
      content: message.cleanContent,
      userTag: message.author.tag,
      userID: message.author.id,
      dateTime: message.createdAt,
      url: message.attachments.toJSON()[0].url,
    });

    await newMessage.save();

    User.findOne({ userID: message.author.id }).then(async (user) => {
      if (!user) return;

      const points = 10;

      const lastImage = new Date(user.lastImage || 0);

      user.userTag = message.author.tag;
      user.lastImage = message.createdAt;
      user.discordName = message.author.username;
      user.discordAvatar = message.author.avatar || "";
      user.discordDiscriminator = message.author.discriminator;
      user.zelayUserId = zelayUserData.data.id;
      user.zelayUserName = zelayUserData.data.name;

      // If user's last gm was yesterday, then continue streak
      if (isYesterday(lastImage)) {
        await assignGmPoints(points, user.zelayUserId);
        user.save();
      }

      // If user's last gm was older than yesterday, then break streak
      else if (!isToday(lastImage)) {
        await assignGmPoints(points, user.zelayUserId);
        user.save();
      } else if (isToday(lastImage) && user.totalGMs == 0) {
        await assignGmPoints(points, user.zelayUserId);
        user.save();
      }
    });
  }
});

const assignGmPoints = async (points: number, userId: string) => {
  if (userId !== "") {
    await userBonus(userId, points, "meme points", "rewards");
  }
};
