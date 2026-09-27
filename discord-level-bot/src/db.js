const Database = require("better-sqlite3");
const path = require("node:path");
const fs = require("node:fs");

const dataDir = path.resolve(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "levels.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    messages INTEGER NOT NULL DEFAULT 0,
    voice_seconds INTEGER NOT NULL DEFAULT 0,
    last_message_xp INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_users_xp
  ON users(guild_id, xp DESC);
`);

const getStmt = db.prepare(`
  SELECT guild_id, user_id, xp, messages, voice_seconds, last_message_xp
  FROM users WHERE guild_id = ? AND user_id = ?
`);

const ensureStmt = db.prepare(`
  INSERT INTO users (guild_id, user_id)
  VALUES (?, ?)
  ON CONFLICT(guild_id, user_id) DO NOTHING
`);

const addMessageStmt = db.prepare(`
  INSERT INTO users (guild_id, user_id, xp, messages, voice_seconds, last_message_xp)
  VALUES (?, ?, ?, 1, 0, ?)
  ON CONFLICT(guild_id, user_id) DO UPDATE SET
    xp = xp + excluded.xp,
    messages = messages + 1,
    last_message_xp = excluded.last_message_xp
`);

const addVoiceStmt = db.prepare(`
  INSERT INTO users (guild_id, user_id, xp, messages, voice_seconds, last_message_xp)
  VALUES (?, ?, ?, 0, ?, 0)
  ON CONFLICT(guild_id, user_id) DO UPDATE SET
    xp = xp + excluded.xp,
    voice_seconds = voice_seconds + excluded.voice_seconds
`);

const addXpStmt = db.prepare(`
  INSERT INTO users (guild_id, user_id, xp, messages, voice_seconds, last_message_xp)
  VALUES (?, ?, ?, 0, 0, 0)
  ON CONFLICT(guild_id, user_id) DO UPDATE SET xp = xp + excluded.xp
`);

const removeXpStmt = db.prepare(`
  UPDATE users SET xp = MAX(0, xp - ?) WHERE guild_id = ? AND user_id = ?
`);

function ensureUser(guildId, userId) {
  ensureStmt.run(guildId, userId);
}

function getUser(guildId, userId) {
  ensureUser(guildId, userId);
  return getStmt.get(guildId, userId);
}

function addMessageXp(guildId, userId, xp) {
  const now = Date.now();
  addMessageStmt.run(guildId, userId, xp, now);
  return getStmt.get(guildId, userId);
}

function addVoiceXp(guildId, userId, xp, seconds) {
  addVoiceStmt.run(guildId, userId, xp, seconds);
  return getStmt.get(guildId, userId);
}

function addXp(guildId, userId, xp) {
  addXpStmt.run(guildId, userId, xp);
  return getStmt.get(guildId, userId);
}

function removeXp(guildId, userId, xp) {
  removeXpStmt.run(xp, guildId, userId);
  return getStmt.get(guildId, userId);
}

function getLeaderboard(guildId, limit = 10) {
  return db.prepare(`
    SELECT user_id, xp, messages, voice_seconds
    FROM users
    WHERE guild_id = ?
    ORDER BY xp DESC, user_id ASC
    LIMIT ?
  `).all(guildId, limit);
}

function getRank(guildId, userId) {
  const row = db.prepare(`
    SELECT COUNT(*) + 1 AS rank
    FROM users
    WHERE guild_id = ? AND xp > (SELECT xp FROM users WHERE guild_id = ? AND user_id = ?)
  `).get(guildId, guildId, userId);
  return row?.rank ?? 1;
}

module.exports = {
  db,
  ensureUser,
  getUser,
  addMessageXp,
  addVoiceXp,
  addXp,
  removeXp,
  getLeaderboard,
  getRank
};
