import nconf from "nconf";
import jwt from "jsonwebtoken";
import {
  CacheType,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
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

    if (isOwner) {
      frontendUrl = urlJoin(
        nconf.get("FRONTEND_URL"),
        `settings?token=${token}`
      );
    } else {
      frontendUrl = nconf.get("FRONTEND_URL")
    }


    const row = new MessageActionRow().addComponents(
      new MessageButton().setLabel("Login").setStyle("LINK").setURL(frontendUrl)
    );

    const discordMsgEmbed = new MessageEmbed()
      .setColor("#4ffa02")
      .setDescription("Login to the dashboard using this link");

    await interaction.reply({
      embeds: [discordMsgEmbed],
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error(error)
  }

};
