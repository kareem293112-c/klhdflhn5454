const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const path = require("node:path");
const fs = require("node:fs");
const config = require("../config");
const { progressForXp, rankForLevel, rankColor } = require("../utils/levels");
const { getRank } = require("../db");

const W = 1200;
const H = 675;

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, startSize, weight = 700) {
  let size = startSize;
  while (size > 18) {
    ctx.font = `${weight} ${size}px Arial`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return size;
}

async function safeImage(url) {
  try { return await loadImage(url); } catch { return null; }
}

function drawCover(ctx, img, x, y, w, h) {
  if (!img) return;
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  return `${hours}h ${mins}m`;
}

async function getBanner(user) {
  const fresh = await user.fetch(true).catch(() => user);
  if (fresh.banner) {
    return safeImage(fresh.bannerURL({ extension: "png", size: 2048 }));
  }
  if (fs.existsSync(config.fallbackBanner)) return safeImage(`file://${config.fallbackBanner}`);
  return null;
}

async function renderRankCard({ user, member, data }) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const banner = await getBanner(user);
  if (banner) drawCover(ctx, banner, 0, 0, W, H);
  else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#050507");
    g.addColorStop(0.55, "#160509");
    g.addColorStop(1, "#020203");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = "rgba(0,0,0,0.73)";
  ctx.fillRect(0, 0, W, H);

  // Red atmospheric glow
  const glow = ctx.createRadialGradient(180, 150, 10, 180, 150, 420);
  glow.addColorStop(0, "rgba(255,20,35,0.30)");
  glow.addColorStop(1, "rgba(255,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 360);

  const p = progressForXp(data.xp);
  const rank = rankForLevel(p.level);
  const color = rankColor(rank.key);
  const serverRank = getRank(member.guild.id, user.id);

  // Header glass panel
  roundedRect(ctx, 28, 28, W - 56, 215, 22);
  ctx.fillStyle = "rgba(7,8,12,0.68)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,30,40,0.45)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Avatar
  const avatar = await safeImage(user.displayAvatarURL({ extension: "png", size: 512 }));
  ctx.save();
  ctx.beginPath();
  ctx.arc(142, 136, 82, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, 60, 54, 164, 164);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(142, 136, 86, 0, Math.PI * 2);
  ctx.strokeStyle = "#ff1e2d";
  ctx.lineWidth = 5;
  ctx.shadowColor = "#ff1e2d";
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Name
  const displayName = member.displayName || user.username;
  const nameSize = fitText(ctx, displayName, 520, 42);
  ctx.font = `700 ${nameSize}px Arial`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(displayName, 260, 92);

  ctx.font = "700 18px Arial";
  ctx.fillStyle = "#ff2637";
  ctx.fillText("LEVEL", 260, 128);

  ctx.beginPath();
  ctx.arc(292, 177, 31, 0, Math.PI * 2);
  ctx.fillStyle = "#08090c";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = "700 24px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(String(p.level), 292, 185);
  ctx.textAlign = "left";

  ctx.font = "600 21px Arial";
  ctx.fillStyle = "#eeeeee";
  ctx.fillText(`${p.current} / 100 XP`, 340, 174);

  // Progress
  roundedRect(ctx, 340, 190, 480, 16, 8);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  if (p.percent > 0) {
    roundedRect(ctx, 340, 190, Math.max(8, 480 * p.percent / 100), 16, 8);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.font = "700 18px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${p.percent}%`, 840, 204);

  // Three cards
  const cards = [
    { x: 28, title: "RANK", value: rank.name, accent: color },
    { x: 408, title: "CLAN", value: config.clanName, accent: "#ff2637" },
    { x: 788, title: "SERVER", value: `#${serverRank}`, accent: "#ff2637" }
  ];

  for (const card of cards) {
    roundedRect(ctx, card.x, 267, 356, 112, 18);
    ctx.fillStyle = "rgba(5,6,9,0.80)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,30,40,0.24)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = card.accent;
    ctx.fillRect(card.x + 22, 292, 4, 58);

    ctx.font = "700 16px Arial";
    ctx.fillStyle = "#bdbdbd";
    ctx.fillText(card.title, card.x + 45, 305);

    const fs = fitText(ctx, card.value, 270, 27);
    ctx.font = `700 ${fs}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(card.value, card.x + 45, 343);
  }

  // Middle divider / decorative strip
  roundedRect(ctx, 28, 403, W - 56, 86, 18);
  ctx.fillStyle = "rgba(5,6,9,0.72)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,30,40,0.18)";
  ctx.stroke();

  ctx.fillStyle = "rgba(255,20,35,0.65)";
  ctx.fillRect(160, 443, 230, 3);
  ctx.fillRect(810, 443, 230, 3);

  // Bottom stats
  roundedRect(ctx, 28, 512, W - 56, 120, 18);
  ctx.fillStyle = "rgba(5,6,9,0.83)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,30,40,0.22)";
  ctx.stroke();

  const stats = [
    { x: 80, label: "MESSAGES", value: data.messages.toLocaleString() },
    { x: 500, label: "VOICE TIME", value: formatDuration(data.voice_seconds) },
    { x: 900, label: "LEVEL", value: String(p.level) }
  ];

  for (const s of stats) {
    ctx.font = "700 15px Arial";
    ctx.fillStyle = "#a9a9ad";
    ctx.fillText(s.label, s.x, 552);
    ctx.font = "700 28px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(s.value, s.x, 590);
  }

  // Footer line
  ctx.fillStyle = "#ff1e2d";
  ctx.fillRect(28, 651, W - 56, 3);

  return canvas.encode("png");
}

module.exports = { renderRankCard };
