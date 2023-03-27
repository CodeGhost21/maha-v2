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
    .setTitle("Title here")
    .setDescription(
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,"
    );

  const discordSuccessEmbed = new MessageEmbed()
    .setColor("#4ffa02")
    .setDescription("You have been successfully verified.");

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
