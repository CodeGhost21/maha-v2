import nconf from "nconf";
import { Client, Intents, TextChannel } from "discord.js";

export const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
  ],
});

client.on("ready", () =>
  console.log(`DISCORD: Logged in as ${client.user?.tag}!`)
);

client.login(nconf.get("DISCORD_CLIENT_TOKEN")); //login bot using token

export const sendMessage = (channelName: string, messageMarkdown?: string) => {
  if (!messageMarkdown) return;
  const channel = client.channels.cache.get(channelName);
  (channel as TextChannel).send(messageMarkdown);
};
