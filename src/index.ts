import { Client, GatewayIntentBits, Message } from "discord.js";
import { convertMusicUrl } from "./songlink";

const SPOTIFY_URL_REGEX =
  /https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/[A-Za-z0-9]+(?:\?[^\s]*)?/;
const YOUTUBE_MUSIC_URL_REGEX =
  /https?:\/\/music\.youtube\.com\/watch\?v=[A-Za-z0-9_-]+(?:&[^\s]*)?/;

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("DISCORD_BOT_TOKEN is not set.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;

  const content = message.content;

  const spotifyMatch = content.match(SPOTIFY_URL_REGEX);
  const ytMusicMatch = content.match(YOUTUBE_MUSIC_URL_REGEX);

  if (!spotifyMatch && !ytMusicMatch) return;

  try {
    if (spotifyMatch) {
      const url = spotifyMatch[0];
      const ytMusicUrl = await convertMusicUrl(url, "youtubeMusic");
      if (ytMusicUrl) {
        await message.reply(ytMusicUrl);
      } else {
        await message.react("❌");
      }
    }

    if (ytMusicMatch) {
      const url = ytMusicMatch[0];
      const spotifyUrl = await convertMusicUrl(url, "spotify");
      if (spotifyUrl) {
        await message.reply(spotifyUrl);
      } else {
        await message.react("❌");
      }
    }
  } catch (err) {
    console.error("Error processing message:", err);
    try {
      await message.react("⚠️");
    } catch {
      // ignore reaction failure
    }
  }
});

client.login(token);
