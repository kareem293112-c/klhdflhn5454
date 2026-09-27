const { addVoiceXp, getUser } = require("../db");
const config = require("../config");
const { syncRankRole } = require("./roles");
const { announceLevelUp } = require("./levelup");

const active = new Map();

function realMembers(channel) {
  return [...channel.members.values()].filter(m => !m.user.bot);
}

function trackGuildVoice(guild) {
  for (const channel of guild.channels.cache.values()) {
    if (!channel.isVoiceBased?.() || channel.isThread?.()) continue;
    for (const member of channel.members.values()) {
      if (!member.user.bot) active.set(`${guild.id}:${member.id}`, { channelId: channel.id });
    }
  }
}

async function tick(client) {
  for (const guild of client.guilds.cache.values()) {
    for (const channel of guild.channels.cache.values()) {
      if (!channel.isVoiceBased?.() || channel.isThread?.()) continue;
      if (channel.id === guild.afkChannelId) continue;

      const members = realMembers(channel);
      if (members.length < config.xp.minRealUsersInVoice) continue;

      for (const member of members) {
        const before = getUser(guild.id, member.id);
        const oldLevel = Math.floor(before.xp / 100);

        const after = addVoiceXp(
          guild.id,
          member.id,
          config.xp.voicePerMinute,
          config.xp.voiceCheckIntervalSeconds
        );

        const newLevel = Math.floor(after.xp / 100);
        active.set(`${guild.id}:${member.id}`, { channelId: channel.id });

        if (newLevel > oldLevel) {
          try {
            await syncRankRole(member, newLevel);
            await announceLevelUp(member, newLevel, client);
          } catch (err) {
            console.error("[voice level-up]", err);
          }
        }
      }
    }
  }
}

function startVoiceTracker(client) {
  trackGuildVoice(client.guilds.cache.first());
  const interval = Math.max(30, config.xp.voiceCheckIntervalSeconds) * 1000;
  setInterval(() => tick(client).catch(err => console.error("[voice tick]", err)), interval);
}

module.exports = { startVoiceTracker };
