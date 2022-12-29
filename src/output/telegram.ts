import nconf from "nconf";
import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_TOKEN = nconf.get("TELEGRAM_BOT_TOKEN") // For production
// const TELEGRAM_TOKEN = nconf.get("Test_Telegram_Bot_Token") // For staging

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

export const sendMessage = (chatId: string, messageMarkdown: string) => {
  bot.sendMessage(chatId, messageMarkdown, {
    parse_mode: "Markdown",
    disable_web_page_preview: true
  })
  .catch((err: any) => {
    console.log('telegram err', err)
  })
};
