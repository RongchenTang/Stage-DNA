export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

const preferenceText = {
  like: '非常想尝试',
  try: '愿意尝试，希望有指导',
  less: '希望从简单任务开始',
};

export function renderWelcome(data, answeredCount = 0) {
  return `
    <section class="welcome page-in" aria-labelledby="welcome-title">
      <div class="welcome-copy">
        <p class="eyebrow">A MUSICAL THEATRE DISCOVERY</p>
        <h1 id="welcome-title">你的舞台，<em>不止一种身份。</em></h1>
        <p class="lead">${escapeHtml('如果有一天，你成为一部音乐剧的创造者……一场音乐剧即将诞生。请根据第一反应选择最感兴趣、最愿意尝试的行动。')}</p>
        <div class="identity-pair" aria-label="探索的两种身份">
          <div><span>01 · 幕后</span><strong>创作与组织主责</strong><small>六种工作方向，了解你更愿意做什么</small></div>
          <div><span>02 · 台前</span><strong>舞台表达风格</strong><small>四种表演倾向，每个人都将走上舞台</small></div>
        </div>
        <p class="quiet">${escapeHtml(data.disclaimer || '这是兴趣探索，不决定你的能力或最终演出角色。')}</p>
        <button class="primary-button" data-action="start">${answeredCount ? `继续探索 · 已答 ${answeredCount} / 21` : '开启我的 Stage DNA'}<span aria-hidden="true">↗</span></button>
        <p class="time-note">21 项选择 · 个人探索约 10 分钟 · 没有正确答案</p>
      </div>
      <div class="welcome-art" aria-hidden="true"><div class="art-ring"></div><div class="art-figure">S<span>T</span>A<span>G</span>E</div><div class="art-caption">CURTAIN UP<br>FIND YOUR ROLE</div></div>
    </section>`;
}

function actLabel(index) {
  if (index < 3) return '第一幕 · 灵感诞生';
  if (index < 6) return '第二幕 · 组建剧组';
  if (index < 9) return '第三幕 · 让故事活起来';
  if (index < 12) return '第四幕 · 聚光灯亮起之前';
  if (index < 18) return '第五幕 · 成为故事中的人物';
  return '终章 · 你的舞台意愿';
}

export function renderQuestion(data, session) {
  const index = session.currentIndex;
  const question = data.questions[index];
  const selected = session.answers[question.id];
  const answered = Object.keys(session.answers).length;
  const options = question.options.map((option) => `
    <button class="answer-option${selected === option.key ? ' selected' : ''}" data-answer="${option.key}" aria-pressed="${selected === option.key}">
      <span class="option-key">${option.key}</span><span>${escapeHtml(option.text)}</span><span class="option-mark" aria-hidden="true">↗</span>
    </button>`).join('');
  return `
    <section class="survey page-in" aria-labelledby="question-title">
      <div class="survey-top"><span>STAGE DNA / ${escapeHtml(actLabel(index))}</span><span>第 ${index + 1} / ${data.questions.length} 题</span></div>
      <div class="progress-track" role="progressbar" aria-valuenow="${index + 1}" aria-valuemin="1" aria-valuemax="${data.questions.length}" aria-label="题目进度"><span style="width:${((index + 1) / data.questions.length) * 100}%"></span></div>
      <div class="question-shell">
        <p class="question-kicker">${escapeHtml(question.id)} · ${escapeHtml(question.title)}</p>
        <h1 id="question-title">${escapeHtml(question.question)}</h1>
        <p class="question-help">选择你最想尝试的行动。可以返回修改。</p>
        <div class="option-list" role="group" aria-label="题目选项">${options}</div>
      </div>
      <div class="survey-bottom">
        <button class="text-button" data-action="previous" ${index === 0 ? 'disabled' : ''}>← 上一题</button>
        <span>已回答 ${answered} / ${data.questions.length}</span>
        <button class="primary-button compact" data-action="next" ${selected ? '' : 'disabled'}>${index === data.questions.length - 1 ? '查看我的结果' : '下一题'} →</button>
      </div>
    </section>`;
}

function scoreList(names, scores, groups, kind) {
  const max = Math.max(1, ...Object.values(scores));
  let position = 1;
  return groups.map((group) => {
    const rank = position;
    position += group.ids.length;
    return group.ids.map((id) => `
      <li class="score-row"><span class="score-rank">${group.ids.length > 1 ? '并列' : ''}第 ${rank} 名</span>
        <span class="score-name">${escapeHtml(names[id])}</span><span class="score-bar"><span style="width:${(scores[id] / max) * 100}%"></span></span>
        <strong>${scores[id]} 次</strong>${kind === 'role' ? `<button class="choose-button" data-select-role="${id}">选为想尝试的岗位</button>` : `<button class="choose-button" data-select-style="${id}">用于角色卡</button>`}</li>`).join('');
  }).join('');
}

export function renderResults(data, result, selection = {}) {
  const topRole = result.backstageGroups[0].ids;
  const topStyle = result.onstageGroups[0].ids;
  const role = selection.role || (topRole.length === 1 ? topRole[0] : null);
  const style = selection.style || (topStyle.length === 1 ? topStyle[0] : null);
  const roleLead = topRole.length > 1 ? `并列领先：${topRole.map((id) => data.backstageTypes[id]).join('、')}` : data.backstageTypes[topRole[0]];
  const styleLead = topStyle.length > 1 ? `并列领先：${topStyle.map((id) => data.onstageTypes[id]).join('、')}` : data.onstageTypes[topStyle[0]];
  const nextRoleIds = topRole.length > 1
    ? topRole.filter((id) => id !== role)
    : role && role !== topRole[0] ? topRole : (result.backstageGroups[1]?.ids || []);
  const secondaryText = !role && topRole.length > 1
    ? `并列兴趣：${topRole.length} 项幕后方向同分`
    : nextRoleIds.length
      ? `${topRole.length > 1 ? '并列兴趣' : role && role !== topRole[0] ? '最高兴趣方向' : '第二兴趣方向'}：${data.backstageTypes[nextRoleIds[0]]}${nextRoleIds.length > 1 ? ` 等 ${nextRoleIds.length} 项并列` : ''}`
      : '探索更多幕后方向';
  const card = role && style ? `
    <div class="share-card theme-${style}" id="share-card" data-role="${role}" data-style="${style}" data-secondary="${escapeHtml(secondaryText)}">
      <div class="card-ornament" aria-hidden="true"></div>
      <div class="card-top"><span>STAGE DNA</span><span>MY MUSICAL THEATRE ROLE</span></div>
      <img class="card-character" src="./assets/characters-v2/${role}.webp" alt="${escapeHtml(data.backstageTypes[role])}插画">
      <div class="card-copy"><p>${escapeHtml(selection.studentName || '我')}的幕后舞台</p><h2>${escapeHtml(data.backstageTypes[role])}</h2><span>${escapeHtml(data.onstageTypes[style])}</span><b class="card-secondary">${escapeHtml(secondaryText)}</b><small>每个人都将走上舞台。具体人物由剧本与协商决定。</small></div>
    </div>` : `<div class="card-prompt">${!role ? '幕后结果有并列，请选一个你想尝试的岗位。' : '台前结果有并列，请选择一种用于角色卡的风格。'}</div>`;
  const groupRoleOptions = Object.entries(data.backstageTypes).map(([id, name]) =>
    `<option value="${id}"${selection.groupRole === id ? ' selected' : ''}>${escapeHtml(name)}</option>`).join('');
  const assignment = `
    <div class="assignment-panel" aria-labelledby="assignment-title">
      <p class="section-label">04 / 八分钟组内协商</p><h2 id="assignment-title">组内分工记录</h2>
      <p>根据兴趣结果与小组需要，自愿确认一项幕后主责。具体表演人物可以等剧本初稿和试演后再填写。</p>
      <div class="assignment-fields">
        <label>我的称呼<input name="student-name" maxlength="20" autocomplete="nickname" placeholder="可选" value="${escapeHtml(selection.studentName || '')}"></label>
        <label>小组名称<input name="group-name" maxlength="20" placeholder="例如：第二组" value="${escapeHtml(selection.groupName || '')}"></label>
        <label>我自选的幕后主责<select name="group-role"><option value="">请选择一项岗位</option>${groupRoleOptions}</select></label>
        <label>我愿意承担的任务<input name="group-task" maxlength="55" placeholder="例如：整理道具与服装清单" value="${escapeHtml(selection.groupTask || '')}"></label>
        <label>具体台前人物<input name="actor-role" maxlength="30" placeholder="待剧本与试演后确定" value="${escapeHtml(selection.actorRole || '')}"></label>
      </div>
      <button class="primary-button assignment-save" data-action="save-assignment">保存个人分工记录 PNG ↗</button>
      <p class="assignment-feedback" role="status" aria-live="polite"></p>
      <p class="assignment-note">记录仅保存在当前设备。组内展示后，由小组共同确认最终分工；每个人都参与台前演出。</p>
    </div>`;
  return `
    <section class="results page-in" aria-labelledby="result-title">
      <div class="result-heading"><p class="eyebrow">YOUR STAGE DNA</p><h1 id="result-title">你的两种舞台身份</h1><p>这是一份兴趣探索报告。最终分工由你、小组和教师共同协商。</p></div>
      <div class="result-grid">
        <div class="report-panel">
          <div class="report-block"><p class="section-label">01 / 幕后工作兴趣</p><h2>${escapeHtml(roleLead)}</h2><p>${escapeHtml(secondaryText)}。每道幕后题选择一次计 1 分，分数表示本次选择次数。</p><ol class="score-list">${scoreList(data.backstageTypes, result.backstageScores, result.backstageGroups, 'role')}</ol></div>
          <div class="report-block"><p class="section-label">02 / 台前表达风格</p><h2>${escapeHtml(styleLead)}</h2><p>这描述你偏好的表演方式，不决定主角或配角。</p><ol class="score-list">${scoreList(data.onstageTypes, result.onstageScores, result.onstageGroups, 'style')}</ol></div>
          <div class="report-block"><p class="section-label">03 / 我愿意尝试</p><div class="preference-list"><span>演唱<strong>${preferenceText[result.preferences.Q19]}</strong></span><span>舞蹈与肢体<strong>${preferenceText[result.preferences.Q20]}</strong></span><span>台词与戏剧<strong>${preferenceText[result.preferences.Q21]}</strong></span></div></div>
          ${assignment}
          <div class="result-actions"><button class="text-button" data-action="review">返回修改答案</button><button class="text-button" data-action="restart">重新开始</button></div>
        </div>
        <aside class="card-panel"><p class="section-label">可分享的角色卡 · 6 × 4 氛围组合</p>${card}${role && style ? '<button class="primary-button" data-action="save-card">保存角色卡 PNG ↗</button>' : ''}<p class="card-note">可选择你愿意承担的幕后岗位。测试不自动分配演出人物。</p></aside>
      </div>
    </section>`;
}
