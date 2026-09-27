const { rankForLevel } = require("../utils/levels");
const config = require("../config");

function resolveRole(guild, roleConfig) {
  if (roleConfig.id) return guild.roles.cache.get(roleConfig.id) || null;
  return guild.roles.cache.find(r => r.name === roleConfig.name) || null;
}

async function syncRankRole(member, level) {
  const target = rankForLevel(level);
  if (target.key === "unranked") return null;

  const configs = Object.values(config.roles);
  const targetConfig = config.roles[target.key];
  const targetRole = resolveRole(member.guild, targetConfig);

  if (!targetRole) {
    console.warn(`[roles] Could not find role "${targetConfig.name}" in ${member.guild.name}`);
    return null;
  }

  const botMember = member.guild.members.me;
  if (!botMember || targetRole.position >= botMember.roles.highest.position) {
    console.warn(`[roles] Bot cannot manage role "${targetRole.name}". Move bot role above it.`);
    return null;
  }

  const managedRoles = configs
    .map(c => resolveRole(member.guild, c))
    .filter(Boolean);

  const remove = managedRoles.filter(r => r.id !== targetRole.id && member.roles.cache.has(r.id));
  if (remove.length) await member.roles.remove(remove, "Level rank update");

  if (!member.roles.cache.has(targetRole.id)) {
    await member.roles.add(targetRole, "Level rank update");
  }

  return targetRole;
}

module.exports = { syncRankRole };
