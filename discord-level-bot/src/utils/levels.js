function levelFromXp(xp) {
  return Math.floor(Math.max(0, xp) / 100);
}

function progressForXp(xp) {
  const level = levelFromXp(xp);
  const current = xp % 100;
  return {
    level,
    current,
    required: 100,
    percent: Math.floor((current / 100) * 100)
  };
}

function rankForLevel(level) {
  if (level >= 75) return { key: "diamond", name: "Diamond", minLevel: 75 };
  if (level >= 50) return { key: "silver", name: "Silver", minLevel: 50 };
  if (level >= 25) return { key: "gold", name: "Gold", minLevel: 25 };
  if (level >= 1) return { key: "iron", name: "Iron", minLevel: 1 };
  return { key: "unranked", name: "Unranked", minLevel: 0 };
}

function rankColor(key) {
  return {
    unranked: "#777777",
    iron: "#a7adb5",
    gold: "#f0c75e",
    silver: "#d7dde5",
    diamond: "#78d8ff"
  }[key] || "#ff2020";
}

module.exports = { levelFromXp, progressForXp, rankForLevel, rankColor };
