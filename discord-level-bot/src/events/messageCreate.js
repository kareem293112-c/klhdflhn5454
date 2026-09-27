const config = require("../config");
const { getUser, addMessageXp } = require("../db");
const { syncRankRole } = require("../services/roles");
const { announceLevelUp } = require("../services/levelup");

const cooldown = new Map();

module.exports = async function onMessageCreate(message) {
  if (!message.guild || message.author.bot) return;

  const content = message.content.trim();
  if (content.length < config.xp.minMessageLength) return;

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const last = cooldown.get(key) || 0;

  if (now - last < config.xp.messageCooldownSeconds * 1000) return;

  cooldown.set(key, now);

  const before = getUser(message.guild.id, message.author.id);
  const oldLevel = Math.floor(before.xp / 100);

  const after = addMessageXp(message.guild.id, message.author.id, config.xp.message);
  const newLevel = Math.floor(after.xp / 100);

  if (newLevel > oldLevel) {
    try {
      const member = await message.guild.members.fetch(message.author.id);
      await syncRankRole(member, newLevel);
      await announceLevelUp(member, newLevel, message.client);
    } catch (err) {
      console.error("[message level-up]", err);
    }
  }
};
