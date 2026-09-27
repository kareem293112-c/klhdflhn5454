const { AttachmentBuilder, SlashCommandBuilder } = require("discord.js");
const { getUser } = require("../db");
const { renderRankCard } = require("../services/rankCard");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("عرض بطاقة الرتبة")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("عضو آخر (اختياري)")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser("user") || interaction.user;
    const member = await interaction.guild.members.fetch(target.id);
    const data = getUser(interaction.guild.id, target.id);

    const png = await renderRankCard({ user: target, member, data });
    const file = new AttachmentBuilder(png, { name: "rank-card.png" });

    await interaction.editReply({ files: [file] });
  }
};
