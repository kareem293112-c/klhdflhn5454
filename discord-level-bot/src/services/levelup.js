const { EmbedBuilder } = require("discord.js");
const config = require("../config");
const { rankForLevel, rankColor } = require("../utils/levels");

async function announceLevelUp(member, level, client) {
  const channel =
    (config.levelUpChannelId && await member.guild.channels.fetch(config.levelUpChannelId).catch(() => null)) ||
    member.guild.systemChannel;

  if (!channel?.isTextBased?.()) return;

  const rank = rankForLevel(level);
  const description = rank.key === "unranked"
    ? `وصلت إلى **Level ${level}**!`
    : `وصلت إلى **Level ${level}** وأصبحت **${rank.name}**!`;

  const embed = new EmbedBuilder()
    .setColor(rankColor(rank.key))
    .setAuthor({ name: member.user.username, iconURL: member.displayAvatarURL({ size: 128 }) })
    .setTitle("🎉 مبروك! Level Up")
    .setDescription(`${member} ${description}`)
    .setThumbnail(member.displayAvatarURL({ size: 256 }))
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

module.exports = { announceLevelUp };
