import nconf from "nconf";
import {
  Client,
  IntentsBitField,
  TextChannel,
  MessageReplyOptions,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import DiscordOauth2 from "discord-oauth2";

import { IUserModel } from "../database/models/user";

export const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildEmojisAndStickers,
    IntentsBitField.Flags.GuildIntegrations,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildScheduledEvents,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.login(nconf.get("DISCORD_CLIENT_TOKEN")); //login bot using token

export const sendMessage = (
  channelName: string,
  messageMarkdown?: string,
  rowComponent?: boolean,
) => {
  if (!messageMarkdown) return;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("quests")
      .setLabel("View Quests")
      .setStyle(ButtonStyle.Primary)
  );
  const channel = client.channels.cache.get(channelName);
  if (rowComponent) (channel as TextChannel).send({ content: messageMarkdown, components: [row] });
  else (channel as TextChannel).send(messageMarkdown);

};

export const checkGuildMember = async (memberId: string) => {
  const guild = await client.guilds.fetch(nconf.get("DISCORD_GUILD_ID"));
  try {
    const response = await guild.members.fetch(memberId);
    return !!response.user;
  } catch (e) {
    return false;
  }
};

export const fetchDiscordAvatar = async (user: IUserModel) => {
  const oauth = new DiscordOauth2();
  const response = await oauth.getUser(user.discordOauthAccessToken);
  return response.avatar;
};
