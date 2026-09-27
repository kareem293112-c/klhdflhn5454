const { createCanvas, loadImage } = require("@napi-rs/canvas");
const path = require("node:path");
const fs = require("node:fs");

const config = require("../config");
const { getRank } = require("../db");

const WIDTH = 1200;
const HEIGHT = 675;

/* =========================================================
   BASIC HELPERS
========================================================= */

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();

  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);

  ctx.quadraticCurveTo(
    x + w,
    y,
    x + w,
    y + r
  );

  ctx.lineTo(
    x + w,
    y + h - r
  );

  ctx.quadraticCurveTo(
    x + w,
    y + h,
    x + w - r,
    y + h
  );

  ctx.lineTo(
    x + r,
    y + h
  );

  ctx.quadraticCurveTo(
    x,
    y + h,
    x,
    y + h - r
  );

  ctx.lineTo(
    x,
    y + r
  );

  ctx.quadraticCurveTo(
    x,
    y,
    x + r,
    y
  );

  ctx.closePath();
}

function box(
  ctx,
  x,
  y,
  w,
  h,
  radius,
  fill,
  stroke,
  lineWidth = 1.5
) {
  roundedRect(
    ctx,
    x,
    y,
    w,
    h,
    radius
  );

  ctx.fillStyle = fill;
  ctx.fill();

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function fitText(
  ctx,
  text,
  maxWidth,
  size,
  minSize = 12,
  weight = 700
) {
  let current = size;

  while (current > minSize) {
    ctx.font =
      `${weight} ${current}px Arial`;

    if (
      ctx.measureText(
        String(text)
      ).width <= maxWidth
    ) {
      break;
    }

    current--;
  }

  return current;
}

/* =========================================================
   IMAGE
========================================================= */

async function safeImage(source) {
  try {
    return await loadImage(source);
  } catch {
    return null;
  }
}

/*
 * Cover:
 * يخلي صورة البانر تغطي الكرت كامل.
 */
function drawCover(
  ctx,
  image,
  x,
  y,
  w,
  h
) {
  if (!image) return;

  const scale = Math.max(
    w / image.width,
    h / image.height
  );

  const drawW =
    image.width * scale;

  const drawH =
    image.height * scale;

  const drawX =
    x + (w - drawW) / 2;

  const drawY =
    y + (h - drawH) / 2;

  ctx.drawImage(
    image,
    drawX,
    drawY,
    drawW,
    drawH
  );
}

/* =========================================================
   BANNER
========================================================= */

async function getBanner(user) {
  try {
    const freshUser =
      await user.fetch(true);

    if (freshUser.banner) {
      return await safeImage(
        freshUser.bannerURL({
          extension: "png",
          size: 2048
        })
      );
    }
  } catch {}

  if (
    config.fallbackBanner &&
    fs.existsSync(
      config.fallbackBanner
    )
  ) {
    return await safeImage(
      path.resolve(
        config.fallbackBanner
      )
    );
  }

  return null;
}

/* =========================================================
   ACCENT
========================================================= */

function getAccentColor(image) {
  /*
   * اللون الافتراضي.
   */

  if (!image) {
    return "#c9a46a";
  }

  /*
   * نستخدم لون ثابت مريح
   * حتى ما يصير اللون مزعج.
   */

  try {
    const canvas =
      createCanvas(1, 1);

    const ctx =
      canvas.getContext("2d");

    ctx.drawImage(
      image,
      0,
      0,
      1,
      1
    );

    const pixel =
      ctx.getImageData(
        0,
        0,
        1,
        1
      ).data;

    let r = pixel[0];
    let g = pixel[1];
    let b = pixel[2];

    /*
     * إذا اللون غامق جدًا،
     * نستخدم الذهبي.
     */

    if (
      r + g + b < 100
    ) {
      return "#c9a46a";
    }

    /*
     * نرفع الإضاءة قليلًا.
     */

    r = Math.min(
      255,
      r + 20
    );

    g = Math.min(
      255,
      g + 20
    );

    b = Math.min(
      255,
      b + 20
    );

    return (
      "#" +
      [r, g, b]
        .map(
          value =>
            value
              .toString(16)
              .padStart(2, "0")
        )
        .join("")
    );
  } catch {
    return "#c9a46a";
  }
}

/* =========================================================
   RANK
========================================================= */

function getInteractiveRank(
  level
) {
  if (level >= 75) {
    return {
      name: "Diamond",
      color: "#7bdcff"
    };
  }

  if (level >= 50) {
    return {
      name: "Silver",
      color: "#d7dce2"
    };
  }

  if (level >= 25) {
    return {
      name: "Gold",
      color: "#d8b15e"
    };
  }

  return {
    name: "Unranked",
    color: "#eeeeee"
  };
}

/* =========================================================
   AVATAR
========================================================= */

async function drawAvatar(
  ctx,
  user,
  x,
  y,
  radius,
  accent
) {
  const avatar =
    await safeImage(
      user.displayAvatarURL({
        extension: "png",
        size: 512
      })
    );

  ctx.save();

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );

  ctx.clip();

  if (avatar) {
    ctx.drawImage(
      avatar,
      x - radius,
      y - radius,
      radius * 2,
      radius * 2
    );
  } else {
    ctx.fillStyle =
      "#111111";

    ctx.fill();
  }

  ctx.restore();

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius + 5,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    accent;

  ctx.lineWidth = 4;

  ctx.stroke();
}

/* =========================================================
   ICONS
========================================================= */

function drawCrown(
  ctx,
  x,
  y,
  size,
  color
) {
  ctx.save();

  ctx.translate(x, y);

  ctx.fillStyle =
    color;

  ctx.beginPath();

  ctx.moveTo(
    -size * 0.55,
    -size * 0.20
  );

  ctx.lineTo(
    -size * 0.32,
    size * 0.27
  );

  ctx.lineTo(
    0,
    size * 0.04
  );

  ctx.lineTo(
    size * 0.32,
    size * 0.27
  );

  ctx.lineTo(
    size * 0.55,
    -size * 0.20
  );

  ctx.lineTo(
    size * 0.37,
    size * 0.40
  );

  ctx.lineTo(
    -size * 0.37,
    size * 0.40
  );

  ctx.closePath();

  ctx.fill();

  ctx.restore();
}

function drawStar(
  ctx,
  x,
  y,
  size,
  color
) {
  ctx.save();

  ctx.translate(x, y);

  ctx.fillStyle =
    color;

  ctx.beginPath();

  for (
    let i = 0;
    i < 10;
    i++
  ) {
    const angle =
      -Math.PI / 2 +
      i * Math.PI / 5;

    const radius =
      i % 2 === 0
        ? size * 0.52
        : size * 0.22;

    const px =
      Math.cos(angle) *
      radius;

    const py =
      Math.sin(angle) *
      radius;

    if (i === 0) {
      ctx.moveTo(
        px,
        py
      );
    } else {
      ctx.lineTo(
        px,
        py
      );
    }
  }

  ctx.closePath();

  ctx.fill();

  ctx.restore();
}

function drawShield(
  ctx,
  x,
  y,
  size,
  color
) {
  ctx.save();

  ctx.translate(x, y);

  ctx.strokeStyle =
    color;

  ctx.lineWidth = 5;

  ctx.beginPath();

  ctx.moveTo(
    0,
    -size * 0.55
  );

  ctx.lineTo(
    size * 0.38,
    -size * 0.36
  );

  ctx.lineTo(
    size * 0.31,
    size * 0.20
  );

  ctx.quadraticCurveTo(
    0,
    size * 0.60,
    0,
    size * 0.60
  );

  ctx.quadraticCurveTo(
    0,
    size * 0.60,
    -size * 0.31,
    size * 0.20
  );

  ctx.lineTo(
    -size * 0.38,
    -size * 0.36
  );

  ctx.closePath();

  ctx.stroke();

  ctx.restore();
}

function drawMessages(
  ctx,
  x,
  y,
  size,
  color
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.fillStyle =
    color;

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    size / 2,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.strokeStyle =
    "#050505";

  ctx.lineWidth = 3;

  for (
    let i = -1;
    i <= 1;
    i++
  ) {
    ctx.beginPath();

    ctx.moveTo(
      -size * 0.18,
      i * size * 0.13
    );

    ctx.lineTo(
      size * 0.18,
      i * size * 0.13
    );

    ctx.stroke();
  }

  ctx.restore();
}

function drawVoice(
  ctx,
  x,
  y,
  size,
  color
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.strokeStyle =
    color;

  ctx.lineWidth = 5;

  ctx.lineCap =
    "round";

  const bars = [
    0.30,
    0.55,
    0.80,
    1,
    0.80,
    0.55,
    0.30
  ];

  const gap =
    size * 0.13;

  for (
    let i = 0;
    i < bars.length;
    i++
  ) {
    const xx =
      -(
        (bars.length - 1) *
        gap
      ) / 2 +
      i * gap;

    const height =
      size *
      bars[i];

    ctx.beginPath();

    ctx.moveTo(
      xx,
      -height / 2
    );

    ctx.lineTo(
      xx,
      height / 2
    );

    ctx.stroke();
  }

  ctx.restore();
}

function drawBars(
  ctx,
  x,
  y,
  size,
  color
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.fillStyle =
    color;

  const width =
    size * 0.18;

  const gap =
    size * 0.10;

  const heights = [
    size * 0.42,
    size * 0.67,
    size * 0.92
  ];

  for (
    let i = 0;
    i < 3;
    i++
  ) {
    const xx =
      -(
        width * 3 +
        gap * 2
      ) / 2 +
      i *
        (width + gap);

    roundedRect(
      ctx,
      xx,
      -heights[i] / 2,
      width,
      heights[i],
      4
    );

    ctx.fill();
  }

  ctx.restore();
}

/* =========================================================
   XP
========================================================= */

function getProgress(
  xp
) {
  const value =
    Math.max(
      0,
      Number(xp || 0)
    );

  return {
    level:
      Math.floor(
        value / 100
      ),

    current:
      value % 100,

    percent:
      value % 100
  };
}

/* =========================================================
   VOICE TIME
========================================================= */

function formatVoiceTime(
  seconds
) {
  const total =
    Math.max(
      0,
      Number(seconds || 0)
    );

  const hours =
    Math.floor(
      total / 3600
    );

  const minutes =
    Math.floor(
      (total % 3600) / 60
    );

  return `${hours}h ${minutes}m`;
}

/* =========================================================
   MAIN RENDER
========================================================= */

async function renderRankCard({
  user,
  member,
  data
}) {
  const canvas =
    createCanvas(
      WIDTH,
      HEIGHT
    );

  const ctx =
    canvas.getContext(
      "2d"
    );

  /* =======================================================
     FULL BACKGROUND
  ======================================================= */

  const banner =
    await getBanner(user);

  const accent =
    getAccentColor(
      banner
    );

  /*
   * الصورة تغطي كامل الكرت.
   */

  if (banner) {
    drawCover(
      ctx,
      banner,
      0,
      0,
      WIDTH,
      HEIGHT
    );
  } else {
    ctx.fillStyle =
      "#050505";

    ctx.fillRect(
      0,
      0,
      WIDTH,
      HEIGHT
    );
  }

  /*
   * طبقة سوداء خفيفة.
   * مو غامقة زيادة.
   */

  ctx.fillStyle =
    "rgba(0,0,0,0.38)";

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );

  /* =======================================================
     OUTER FRAME
  ======================================================= */

  box(
    ctx,
    12,
    12,
    WIDTH - 24,
    HEIGHT - 24,
    16,
    "rgba(0,0,0,0)",
    `${accent}dd`,
    2
  );

  /* =======================================================
     HEADER
  ======================================================= */

  const avatarX =
    112;

  const avatarY =
    105;

  const avatarRadius =
    63;

  await drawAvatar(
    ctx,
    user,
    avatarX,
    avatarY,
    avatarRadius,
    accent
  );

  const name =
    member.displayName ||
    user.globalName ||
    user.username;

  const nameSize =
    fitText(
      ctx,
      name,
      520,
      46,
      27,
      800
    );

  ctx.font =
    `italic 800 ${nameSize}px Arial`;

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    name,
    200,
    70
  );

  /* LEVEL */

  ctx.font =
    "800 15px Arial";

  ctx.fillStyle =
    "rgba(255,255,255,0.82)";

  ctx.fillText(
    "LEVEL",
    200,
    101
  );

  const progress =
    getProgress(
      data.xp
    );

  /* LEVEL CIRCLE */

  ctx.beginPath();

  ctx.arc(
    225,
    135,
    28,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "rgba(0,0,0,0.78)";

  ctx.fill();

  ctx.strokeStyle =
    accent;

  ctx.lineWidth = 3;

  ctx.stroke();

  ctx.textAlign =
    "center";

  ctx.font =
    "800 20px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    String(
      progress.level
    ),
    225,
    142
  );

  ctx.textAlign =
    "left";

  /* XP */

  ctx.font =
    "800 20px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    `${progress.current} / 100 XP`,
    270,
    142
  );

  /* XP BAR */

  const barX =
    270;

  const barY =
    164;

  const barW =
    510;

  const barH =
    14;

  roundedRect(
    ctx,
    barX,
    barY,
    barW,
    barH,
    7
  );

  ctx.fillStyle =
    "rgba(255,255,255,0.20)";

  ctx.fill();

  if (
    progress.percent > 0
  ) {
    const fillW =
      Math.max(
        10,
        barW *
          progress.percent /
          100
      );

    roundedRect(
      ctx,
      barX,
      barY,
      fillW,
      barH,
      7
    );

    ctx.fillStyle =
      accent;

    ctx.fill();
  }

  ctx.font =
    "800 15px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    `${progress.percent}%`,
    805,
    176
  );

  /* =======================================================
     THREE BIG CARDS
  ======================================================= */

  const cardsX =
    38;

  const cardsY =
    205;

  const cardsW =
    1124;

  const cardsH =
    96;

  const gap =
    14;

  const cardW =
    (cardsW - gap * 2) /
    3;

  const rank =
    getInteractiveRank(
      progress.level
    );

  const clan =
    config.clanName ||
    "SOON";

  const cards = [
    {
      x: cardsX,
      title:
        "الرتبة التفاعلية",
      value:
        rank.name,
      icon:
        "crown",
      color:
        rank.color
    },

    {
      x:
        cardsX +
        cardW +
        gap,

      title:
        "الرتبة الإنجازية",

      value:
        "SOON",

      icon:
        "star",

      color:
        accent
    },

    {
      x:
        cardsX +
        (cardW + gap) * 2,

      title:
        "الكلان",

      value:
        clan,

      icon:
        "shield",

      color:
        accent
    }
  ];

  for (
    const card of cards
  ) {
    box(
      ctx,
      card.x,
      cardsY,
      cardW,
      cardsH,
      12,
      "rgba(3,3,4,0.76)",
      `${accent}d0`,
      2
    );

    const iconX =
      card.x + 58;

    const iconY =
      cardsY + 48;

    if (
      card.icon ===
      "crown"
    ) {
      drawCrown(
        ctx,
        iconX,
        iconY,
        53,
        card.color
      );
    }

    if (
      card.icon ===
      "star"
    ) {
      drawStar(
        ctx,
        iconX,
        iconY,
        53,
        card.color
      );
    }

    if (
      card.icon ===
      "shield"
    ) {
      drawShield(
        ctx,
        iconX,
        iconY,
        54,
        card.color
      );
    }

    ctx.font =
      "800 16px Arial";

    ctx.fillStyle =
      "#ffffff";

    ctx.fillText(
      card.title,
      card.x + 105,
      cardsY + 35
    );

    const valueSize =
      fitText(
        ctx,
        card.value,
        cardW - 125,
        26,
        17,
        800
      );

    ctx.font =
      `800 ${valueSize}px Arial`;

    if (
      card.value ===
      "Gold"
    ) {
      ctx.fillStyle =
        "#d8b15e";
    } else if (
      card.value ===
      "SOON"
    ) {
      ctx.fillStyle =
        "rgba(255,255,255,0.40)";
    } else {
      ctx.fillStyle =
        "#ffffff";
    }

    ctx.fillText(
      card.value,
      card.x + 105,
      cardsY + 69
    );
  }

  /* =======================================================
     SOON BOX
  ======================================================= */

  const soonX =
    38;

  const soonY =
    320;

  const soonW =
    1124;

  const soonH =
    118;

  box(
    ctx,
    soonX,
    soonY,
    soonW,
    soonH,
    12,
    "rgba(3,3,4,0.70)",
    `${accent}c5`,
    2
  );

  /*
   * الخطوط الجانبية
   */

  ctx.fillStyle =
    accent;

  ctx.fillRect(
    145,
    soonY + 58,
    125,
    2
  );

  ctx.fillRect(
    930,
    soonY + 58,
    125,
    2
  );

  /*
   * SOON
   */

  ctx.textAlign =
    "center";

  ctx.font =
    "800 47px Arial";

  ctx.fillStyle =
    "rgba(255,255,255,0.29)";

  ctx.fillText(
    "S O O N",
    WIDTH / 2,
    soonY + 74
  );

  ctx.textAlign =
    "left";

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statsX =
    38;

  const statsY =
    460;

  const statsW =
    1124;

  const statsH =
    100;

  box(
    ctx,
    statsX,
    statsY,
    statsW,
    statsH,
    12,
    "rgba(3,3,4,0.80)",
    `${accent}c5`,
    2
  );

  /*
   * separators
   */

  ctx.fillStyle =
    `${accent}88`;

  ctx.fillRect(
    410,
    statsY + 15,
    2,
    70
  );

  ctx.fillRect(
    790,
    statsY + 15,
    2,
    70
  );

  /* -------------------------------------------------------
     MESSAGES
  ------------------------------------------------------- */

  drawMessages(
    ctx,
    105,
    statsY + 50,
    50,
    accent
  );

  ctx.font =
    "800 15px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "إجمالي الرسائل",
    150,
    statsY + 37
  );

  ctx.font =
    "800 23px Arial";

  ctx.fillText(
    Number(
      data.messages || 0
    ).toLocaleString(),
    150,
    statsY + 70
  );

  /* -------------------------------------------------------
     VOICE
  ------------------------------------------------------- */

  drawVoice(
    ctx,
    505,
    statsY + 50,
    50,
    accent
  );

  ctx.font =
    "800 15px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "وقت الفويس",
    550,
    statsY + 37
  );

  ctx.font =
    "800 23px Arial";

  ctx.fillText(
    formatVoiceTime(
      data.voice_seconds
    ),
    550,
    statsY + 70
  );

  /* -------------------------------------------------------
     RANK
  ------------------------------------------------------- */

  const serverRank =
    await getRank(
      member.guild.id,
      user.id
    );

  drawBars(
    ctx,
    875,
    statsY + 50,
    50,
    accent
  );

  ctx.font =
    "800 15px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "الترتيب",
    920,
    statsY + 37
  );

  ctx.font =
    "800 23px Arial";

  ctx.fillText(
    `#${serverRank}`,
    920,
    statsY + 70
  );

  /* =======================================================
     BOTTOM LINE
  ======================================================= */

  ctx.fillStyle =
    accent;

  ctx.fillRect(
    38,
    605,
    1124,
    2
  );

  /* =======================================================
     RETURN PNG
  ======================================================= */

  return canvas.encode(
    "png"
  );
}

module.exports = {
  renderRankCard
};
