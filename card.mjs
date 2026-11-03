const themes = {
  H: { background: '#35111f', accent: '#ffd298', glow: '#b73547' },
  E: { background: '#1d224b', accent: '#e0c5f1', glow: '#655ca1' },
  T: { background: '#142c52', accent: '#ffe0ac', glow: '#ed8b54' },
  U: { background: '#15393d', accent: '#ffe2a0', glow: '#b85d64' },
};

export function buildCardSpec(data, role, style, extra = {}) {
  if (!data.backstageTypes[role]) throw new Error(`Unknown role: ${role}`);
  if (!data.onstageTypes[style]) throw new Error(`Unknown style: ${style}`);
  return {
    width: 1080,
    height: 1920,
    roleName: data.backstageTypes[role],
    styleName: data.onstageTypes[style],
    studentName: String(extra.studentName || '我').replace(/\s+/g, ' ').trim().slice(0, 20),
    secondaryText: String(extra.secondaryText || '').slice(0, 50),
    imageSrc: `./assets/characters-v2/${role}.webp`,
    colors: themes[style],
    role,
    style,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load card image: ${src}`));
    image.src = src;
  });
}

function drawBackdrop(context, spec) {
  const { width, height, colors, style } = spec;
  if (style === 'T') {
    const sweep = context.createLinearGradient(0, 0, width, height);
    sweep.addColorStop(0, '#d87346');
    sweep.addColorStop(0.47, '#5e6892');
    sweep.addColorStop(0.77, '#1a3e70');
    sweep.addColorStop(1, '#122348');
    context.fillStyle = sweep;
    context.fillRect(0, 0, width, height);
    const orangeLight = context.createRadialGradient(230, 540, 30, 230, 540, 800);
    orangeLight.addColorStop(0, 'rgba(255,177,103,.8)');
    orangeLight.addColorStop(1, 'rgba(255,177,103,0)');
    context.fillStyle = orangeLight;
    context.fillRect(0, 0, width, height);
  } else {
    context.fillStyle = colors.background;
    context.fillRect(0, 0, width, height);
    const glow = context.createRadialGradient(780, 560, 60, 700, 620, 930);
    glow.addColorStop(0, colors.glow);
    glow.addColorStop(1, colors.background);
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  }

  context.strokeStyle = colors.accent;
  context.globalAlpha = 0.58;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(520, 830, style === 'E' ? 590 : 520, -2.4, 1.1);
  context.stroke();
  context.globalAlpha = 0.18;
  context.fillStyle = colors.accent;
  if (style === 'T') {
    context.beginPath();
    context.moveTo(0, 290); context.lineTo(420, 0); context.lineTo(720, 0); context.lineTo(0, 680);
    context.fill();
  } else if (style === 'U') {
    for (let i = 0; i < 16; i += 1) {
      context.beginPath();
      context.arc(80 + (i % 4) * 290, 260 + Math.floor(i / 4) * 340, 9 + (i % 3) * 5, 0, Math.PI * 2);
      context.fill();
    }
  } else {
    context.beginPath();
    context.moveTo(0, 0); context.lineTo(280, 0); context.lineTo(0, 760); context.fill();
  }
  context.globalAlpha = 1;
}

function drawContained(context, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  context.drawImage(image, x + (width - scaledWidth) / 2, y + (height - scaledHeight) / 2, scaledWidth, scaledHeight);
}

export async function downloadCard(data, role, style, extra = {}) {
  const spec = buildCardSpec(data, role, style, extra);
  const image = await loadImage(new URL(spec.imageSrc, document.baseURI).href);
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const context = canvas.getContext('2d');
  drawBackdrop(context, spec);
  drawContained(context, image, 30, 230, 1020, 1230);

  const shade = context.createLinearGradient(0, 1320, 0, 1920);
  shade.addColorStop(0, 'rgba(16, 11, 24, 0)');
  shade.addColorStop(0.27, 'rgba(16, 11, 24, 0.88)');
  shade.addColorStop(1, 'rgba(16, 11, 24, 0.97)');
  context.fillStyle = shade;
  context.fillRect(0, 1320, 1080, 600);

  context.fillStyle = spec.colors.accent;
  context.font = '600 42px Georgia, serif';
  context.fillText('STAGE DNA', 84, 118);
  context.font = '28px Arial, sans-serif';
  context.fillText('MY MUSICAL THEATRE ROLE', 84, 165);
  context.font = '34px "Microsoft YaHei", sans-serif';
  context.fillText(`${spec.studentName}的幕后舞台`, 84, 1500, 870);
  context.fillStyle = '#fff5e9';
  context.font = 'bold 112px "Microsoft YaHei", sans-serif';
  context.fillText(spec.roleName, 80, 1640);
  context.fillStyle = spec.colors.accent;
  context.font = 'bold 54px "Microsoft YaHei", sans-serif';
  context.fillText(spec.styleName, 84, 1720);
  if (spec.secondaryText) {
    context.fillStyle = '#fff0e1';
    context.font = '32px "Microsoft YaHei", sans-serif';
    context.fillText(spec.secondaryText, 84, 1790, 910);
  }
  context.fillStyle = '#dfd2ce';
  context.font = '30px "Microsoft YaHei", sans-serif';
  context.fillText('每个人都将走上舞台 · 具体人物由剧本与协商决定', 84, 1850);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not export the role card');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `StageDNA_${role}_${style}.png`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
