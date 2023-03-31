import {
  CacheType,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";
import nconf from "nconf";
import * as jwt from "jsonwebtoken";

import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import urlJoin from "../../utils/urlJoin";

const jwtSecret = nconf.get("JWT_SECRET");

export const executeVerifyCommand = async (
  interaction: CommandInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { user, profile } = await findOrCreateServerProfile(
    interaction.user.id,
    guildId
  );

  const expiry = Date.now() + 86400000 * 7;

  const token = await jwt.sign({ id: profile.id, expiry }, jwtSecret);

  const frontendUrl = nconf.get("FRONTEND_URL");

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel(user.twitterID ? "Twitter Verified" : "Verify Twitter")
      .setStyle("LINK")
      .setDisabled(!!user.twitterID)
      .setURL(urlJoin(frontendUrl, `/verify-twitter?token=${token}`)),

    new MessageButton()
      .setLabel(user.walletAddress ? "Wallet Verified" : "Verify Wallet")
      .setStyle("LINK")
      .setDisabled(!!user.walletAddress)
      .setURL(urlJoin(frontendUrl, `/verify-wallet?token=${token}`))
  );

  const discordMsgEmbed = new MessageEmbed()
    .setColor("#F07D55")
    .setThumbnail("https://i.imgur.com/xYG5x9G.png")
    .setAuthor({
      name: "Gift of Eden",
      iconURL: "https://i.imgur.com/xYG5x9G.png",
      url: "https://peopleofeden.com/",
    })
    .setTitle("Verify your account")
    .setDescription(
      `Hey there, ${interaction?.user} \n\n` +
        `Before you start earning points, you'll need to verify both your Twitter and your ETH wallet. This ensures that you are a genuine member of our community and helps us provide a smooth experience for everyone. ` +
        `Let's get started 🚀`
    );

  const discordSuccessEmbed = new MessageEmbed()
    .setColor("#4ffa02")
    .setDescription(
      "**Congratulations on verifying your account! 🎉** You're all set to start earning points and completing your loyalty tasks."
    );

  if (!user.twitterID || !user.walletAddress) {
    await interaction.reply({
      embeds: [discordMsgEmbed],
      components: [row],
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      embeds: [discordSuccessEmbed],
      ephemeral: true,
    });
  }
};
