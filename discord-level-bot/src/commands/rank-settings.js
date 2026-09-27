const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank-settings")
    .setDescription("عرض إعدادات نظام الرتب")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.reply({
      ephemeral: true,
      content:
        `**Rank Settings**\n` +
        `💬 Message XP: ${config.xp.message} XP / ${config.xp.messageCooldownSeconds}s\n` +
        `📝 Minimum message length: ${config.xp.minMessageLength}\n` +
        `🎙️ Voice XP: ${config.xp.voicePerMinute} XP / minute\n` +
        `👥 Minimum real users in voice: ${config.xp.minRealUsersInVoice}\n` +
        `🏆 Iron: Level 1–24\n` +
        `🥇 Gold: Level 25–49\n` +
        `🥈 Silver: Level 50–74\n` +
        `💎 Diamond: Level 75–100`
    });
  }
};
