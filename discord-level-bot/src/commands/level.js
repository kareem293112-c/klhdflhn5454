const { SlashCommandBuilder } = require("discord.js");
const { getUser, addXp, removeXp } = require("../db");
const { syncRankRole } = require("../services/roles");
const { levelFromXp } = require("../utils/levels");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("إدارة XP عضو (للمشرفين)")
    .addSubcommand(s => s.setName("view").setDescription("عرض مستوى عضو")
      .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(false)))
    .addSubcommand(s => s.setName("add").setDescription("إضافة XP")
      .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
      .addIntegerOption(o => o.setName("xp").setDescription("عدد XP").setMinValue(1).setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("حذف XP")
      .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
      .addIntegerOption(o => o.setName("xp").setDescription("عدد XP").setMinValue(1).setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "view") {
      const user = interaction.options.getUser("user") || interaction.user;
      const data = getUser(interaction.guild.id, user.id);
      return interaction.reply(`${user} لديه **${data.xp} XP** — **Level ${levelFromXp(data.xp)}**.`);
    }

    if (!interaction.memberPermissions.has("ManageGuild")) {
      return interaction.reply({ content: "تحتاج إلى صلاحية Manage Server.", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(user.id);
    const amount = interaction.options.getInteger("xp");
    const data = sub === "add"
      ? addXp(interaction.guild.id, user.id, amount)
      : removeXp(interaction.guild.id, user.id, amount);

    await syncRankRole(member, levelFromXp(data.xp));
    return interaction.reply(`تم تحديث XP لـ ${user}: **${data.xp} XP** — Level **${levelFromXp(data.xp)}**.`);
  }
};
