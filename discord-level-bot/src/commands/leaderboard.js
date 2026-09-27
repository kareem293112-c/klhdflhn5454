const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { getLeaderboard } = require("../db");
const { levelFromXp, rankForLevel } = require("../utils/levels");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("عرض أفضل أعضاء السيرفر حسب XP"),

  async execute(interaction) {
    const rows = getLeaderboard(interaction.guild.id, 10);

    if (!rows.length) {
      return interaction.reply("لا يوجد أعضاء لديهم XP حتى الآن.");
    }

    const lines = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const level = levelFromXp(row.xp);
      const rank = rankForLevel(level);
      lines.push(`**#${i + 1}** <@${row.user_id}> — **Level ${level}** — ${row.xp} XP — ${rank.name}`);
    }

    const embed = new EmbedBuilder()
      .setColor("#ff1e2d")
      .setTitle("🏆 Leaderboard")
      .setDescription(lines.join("\n"))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
