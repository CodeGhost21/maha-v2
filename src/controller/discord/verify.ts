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

  const { user } = await findOrCreateServerProfile(
    interaction.user.id,
    guildId
  );

  const expiry = Date.now() + 86400000 * 7;

  const token = await jwt.sign({ id: user.id, expiry }, jwtSecret);

  const frontendUrl = urlJoin(
    nconf.get("FRONTEND_URL"),
    `verify?token=${token}`
  );
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Verify Twitter")
      .setStyle("LINK")
      .setDisabled(!!user.twitterID)
      .setURL(urlJoin(frontendUrl, `&type=twitter`)),

    new MessageButton()
      .setLabel("Verify Wallet")
      .setStyle("LINK")
      .setDisabled(!!user.walletAddress)
      .setURL(urlJoin(frontendUrl, `&type=wallet&_id=${user.id}`))
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
      `Before you start enjoying the full benefits of our Gifts of Eden, you'll need to verify both your Twitter and Discord accounts. This quick and easy process ensures you're a genuine member of our community, and helps us provide a safe and engaging experience for everyone. \n\n` +
      `Once both of your accounts are verified, you'll unlock all the amazing features of Gifts of Eden`
    );

  const discordSuccessEmbed = new MessageEmbed()
    .setColor("#4ffa02")
    .setDescription("**Congratulations on verifying your account! 🎉 You're all set to enjoy the benefits of our Gifts of Eden.**");

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
