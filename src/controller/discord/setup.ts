import nconf from "nconf";
import jwt from "jsonwebtoken";
import {
  CacheType,
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import urlJoin from "../../utils/urlJoin";
import { Organization } from "../../database/models/organization";

const jwtSecret = nconf.get("JWT_SECRET");

export const executeSetupCommand = async (
  interaction: CommandInteraction<CacheType>
) => {
  try {
    const guildId = interaction.guildId;
    if (!guildId) return;
    let frontendUrl: string;

    // find or create the org if it doesn't exist
    const org = await Organization.findOne({ guildId });
    if (!org) await Organization.create({ guildId });

    // TODO gate this only to admins. if the user is not an admin then redirect to the install page.

    const isOwner = interaction.user.id === interaction.guild?.ownerId;

    const { profile } = await findOrCreateServerProfile(
      interaction.user.id,
      guildId,
      isOwner
    );

    // 7 day expiry
    const expiry = Date.now() + 86400000 * 7;

    const token = await jwt.sign({ id: profile.id, expiry }, jwtSecret);

    let content, buttonText;

    if (isOwner) {
      frontendUrl = urlJoin(
        nconf.get("FRONTEND_URL"),
        `/settings?token=${token}`
      );

      buttonText = "Login";
      content = "Login into the dashboard to customize the bot using this link";
    } else {
      frontendUrl = nconf.get("FRONTEND_URL");
      content =
        "You are not an admin of this server. To access the setup page of " +
        "this bot, inform one of the admins to give you moderator permissions or " +
        "install the bot into your own server.";
      buttonText = "Install Bot";
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(buttonText)
        .setStyle(ButtonStyle.Link)
        .setURL(frontendUrl)
    );

    await interaction.reply({
      content,
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
  }
};
