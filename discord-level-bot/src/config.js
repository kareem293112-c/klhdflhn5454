const path = require("node:path");
require("dotenv").config();

function int(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) ? value : fallback;
}

module.exports = {
  token: process.env.DISCORD_TOKEN || "",
  clientId: process.env.CLIENT_ID || "",
  guildId: process.env.GUILD_ID || "",
  levelUpChannelId: process.env.LEVEL_UP_CHANNEL_ID || "",
  clanName: process.env.CLAN_NAME || "SOON",
  fallbackBanner: path.resolve(process.cwd(), process.env.FALLBACK_BANNER || "assets/fallback-banner.png"),

  xp: {
    message: int("MESSAGE_XP", 1),
    messageCooldownSeconds: int("MESSAGE_COOLDOWN_SECONDS", 60),
    minMessageLength: int("MIN_MESSAGE_LENGTH", 5),
    voicePerMinute: int("VOICE_XP_PER_MINUTE", 1),
    voiceCheckIntervalSeconds: int("VOICE_CHECK_INTERVAL_SECONDS", 60),
    minRealUsersInVoice: int("MIN_REAL_USERS_IN_VOICE", 2)
  },

  roles: {
    iron: { id: process.env.IRON_ROLE_ID || "", name: process.env.IRON_ROLE_NAME || "Iron", minLevel: 1 },
    gold: { id: process.env.GOLD_ROLE_ID || "", name: process.env.GOLD_ROLE_NAME || "Gold", minLevel: 25 },
    silver: { id: process.env.SILVER_ROLE_ID || "", name: process.env.SILVER_ROLE_NAME || "Silver", minLevel: 50 },
    diamond: { id: process.env.DIAMOND_ROLE_ID || "", name: process.env.DIAMOND_ROLE_NAME || "Diamond", minLevel: 75 }
  }
};
