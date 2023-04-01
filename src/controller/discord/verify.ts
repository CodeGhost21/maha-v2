import {
  CacheType,
  CommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonInteraction,
} from "discord.js";
import nconf from "nconf";
import * as jwt from "jsonwebtoken";

import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import urlJoin from "../../utils/urlJoin";

const jwtSecret = nconf.get("JWT_SECRET");

export const executeVerifyCommand = async (
  interaction: CommandInteraction<CacheType> | ButtonInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { user, profile } = await findOrCreateServerProfile(
    interaction.user,
    guildId
  );

  const expiry = Date.now() + 86400000 * 7;

  const token = await jwt.sign({ id: profile.id, expiry }, jwtSecret);

  const frontendUrl = nconf.get("FRONTEND_URL");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(user.twitterID ? "Twitter Verified" : "Verify Twitter")
      .setStyle(ButtonStyle.Link)
      .setDisabled(!!user.twitterID)
      .setURL(urlJoin(frontendUrl, `/verify-twitter?token=${token}`)),

    new ButtonBuilder()
      .setLabel(user.walletAddress ? "Wallet Verified" : "Verify Wallet")
      .setStyle(ButtonStyle.Link)
      .setDisabled(!!user.walletAddress)
      .setURL(urlJoin(frontendUrl, `/verify-wallet?token=${token}`))
  );

  const verifyMsg =
    `Okay we are ready to verify your wallet and Twitter account! 👍\n\n` +
    `Use the buttons below to start the process. You will be taken to a webpage where we will ask you to connect your accounts.\n`;

  const successMsg =
    "**Congratulations on verifying your account! 🎉** You're all set to start earning points and completing your loyalty tasks.";

  if (!user.twitterID || !user.walletAddress) {
    await interaction.reply({
      content: verifyMsg,
      components: [row],
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: successMsg,
      ephemeral: true,
    });
  }
};
