function clean(value, limit) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

export function buildAssignmentSpec(data, entry) {
  const role = entry?.groupRole;
  if (!data.backstageTypes[role]) throw new Error('请选择幕后主责。');
  return {
    width: 1080,
    height: 1350,
    studentName: clean(entry.studentName, 20) || '未署名同学',
    groupName: clean(entry.groupName, 20) || '未填写小组',
    roleName: data.backstageTypes[role],
    groupTask: clean(entry.groupTask, 55) || '与小组协商具体任务',
    actorRole: clean(entry.actorRole, 30) || '待剧本与试演后确定',
  };
}

function drawLines(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const characters = [...text];
  const lines = [];
  let line = '';
  for (const character of characters) {
    if (context.measureText(line + character).width > maxWidth && line) {
      lines.push(line);
      line = character;
      if (lines.length === maxLines - 1) break;
    } else line += character;
  }
  const used = lines.join('').length;
  const remainder = characters.slice(used).join('');
  if (remainder) lines.push(remainder);
  else if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((item, index) => context.fillText(item, x, y + index * lineHeight, maxWidth));
}

export async function downloadAssignment(data, entry) {
  const spec = buildAssignmentSpec(data, entry);
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#19111e';
  context.fillRect(0, 0, spec.width, spec.height);
  const glow = context.createRadialGradient(760, 140, 10, 760, 140, 950);
  glow.addColorStop(0, '#713149');
  glow.addColorStop(1, '#19111e');
  context.fillStyle = glow;
  context.fillRect(0, 0, spec.width, spec.height);
  context.strokeStyle = '#e2ba84';
  context.lineWidth = 3;
  context.strokeRect(58, 58, 964, 1234);
  context.fillStyle = '#e2ba84';
  context.font = 'bold 50px Georgia, serif';
  context.fillText('STAGE DNA', 105, 150);
  context.font = '34px "Microsoft YaHei", sans-serif';
  context.fillText('组内分工记录', 105, 232);
  context.fillStyle = '#fff5e9';
  context.font = 'bold 78px "Microsoft YaHei", sans-serif';
  context.fillText(spec.studentName, 105, 355, 870);
  context.fillStyle = '#d6c5c9';
  context.font = '35px "Microsoft YaHei", sans-serif';
  context.fillText(spec.groupName, 105, 425, 870);
  context.strokeStyle = 'rgba(246,232,215,.35)';
  context.beginPath(); context.moveTo(105, 468); context.lineTo(975, 468); context.stroke();
  context.fillStyle = '#e2ba84';
  context.font = '30px "Microsoft YaHei", sans-serif';
  context.fillText('自选幕后主责', 105, 552);
  context.fillStyle = '#fff5e9';
  context.font = 'bold 72px "Microsoft YaHei", sans-serif';
  context.fillText(spec.roleName, 105, 650, 870);
  context.fillStyle = '#e2ba84';
  context.font = '30px "Microsoft YaHei", sans-serif';
  context.fillText('我愿意承担的具体任务', 105, 750);
  context.fillStyle = '#fff5e9';
  context.font = '39px "Microsoft YaHei", sans-serif';
  drawLines(context, spec.groupTask, 105, 820, 870, 58, 2);
  context.fillStyle = '#e2ba84';
  context.font = '30px "Microsoft YaHei", sans-serif';
  context.fillText('具体台前人物', 105, 1012);
  context.fillStyle = '#fff5e9';
  context.font = '39px "Microsoft YaHei", sans-serif';
  drawLines(context, spec.actorRole, 105, 1083, 870, 58, 2);
  context.fillStyle = '#d6c5c9';
  context.font = '27px "Microsoft YaHei", sans-serif';
  context.fillText('由剧本、组内协商与试演共同确定 · 每个人都参与台前演出', 105, 1210, 870);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('分工卡导出失败。');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'StageDNA_组内分工记录.png';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
