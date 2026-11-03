import { scoreAnswers } from './score.mjs';
import { createSession, answerQuestion, moveQuestion, serializeSession } from './state.mjs';
import { renderWelcome, renderQuestion, renderResults } from './view.mjs';
import { downloadCard } from './card.mjs';
import { downloadAssignment } from './assignment.mjs';

const app = document.getElementById('app');
const liveStatus = document.getElementById('live-status');
const sessionKey = 'stage-dna-session-v1';
const selectionKey = 'stage-dna-card-selection-v1';
let data;
let session;
let selection = {};

function readStored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function store(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Browsers without local storage still work. */ }
}

function removeStored(key) {
  try { localStorage.removeItem(key); } catch { /* Keep the current session usable. */ }
}

function announce(message) {
  liveStatus.textContent = message;
}

function save() {
  store(sessionKey, serializeSession(session));
  store(selectionKey, JSON.stringify(selection));
}

function render() {
  if (session.screen === 'welcome') {
    app.innerHTML = renderWelcome(data, Object.keys(session.answers).length);
  } else if (session.screen === 'question') {
    app.innerHTML = renderQuestion(data, session);
  } else {
    try {
      app.innerHTML = renderResults(data, scoreAnswers(data, session.answers), selection);
    } catch (error) {
      const id = /Missing answer: (Q\d+)/.exec(error.message)?.[1];
      session = { ...session, screen: 'question', currentIndex: Math.max(0, data.questions.findIndex((question) => question.id === id)) };
      save();
      app.innerHTML = renderQuestion(data, session);
      announce('请先完成所有题目，再查看结果。');
    }
  }
}

function setScreen(screen) {
  session = { ...session, screen };
  save();
  render();
  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const assignmentFields = {
  'student-name': 'studentName',
  'group-name': 'groupName',
  'group-role': 'groupRole',
  'group-task': 'groupTask',
  'actor-role': 'actorRole',
};

function saveAssignmentField(event) {
  const field = assignmentFields[event.target.name];
  if (!field) return;
  selection = { ...selection, [field]: event.target.value };
  save();
  if (field === 'studentName') {
    const caption = app.querySelector('#share-card .card-copy p');
    if (caption) caption.textContent = `${selection.studentName.trim() || '我'}的幕后舞台`;
  }
}

app.addEventListener('input', saveAssignmentField);
app.addEventListener('change', saveAssignmentField);

app.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;

  const key = button.dataset.answer;
  if (key) {
    const question = data.questions[session.currentIndex];
    session = answerQuestion(session, data, question.id, key);
    save();
    render();
    app.querySelector(`[data-answer="${key}"]`)?.focus({ preventScroll: true });
    return;
  }

  if (button.dataset.selectRole) {
    selection = { ...selection, role: button.dataset.selectRole };
    save();
    const scrollY = window.scrollY;
    render();
    window.scrollTo(0, scrollY);
    announce(`角色卡岗位已选择：${data.backstageTypes[selection.role]}`);
    return;
  }
  if (button.dataset.selectStyle) {
    selection = { ...selection, style: button.dataset.selectStyle };
    save();
    const scrollY = window.scrollY;
    render();
    window.scrollTo(0, scrollY);
    announce(`角色卡风格已选择：${data.onstageTypes[selection.style]}`);
    return;
  }

  switch (button.dataset.action) {
    case 'start':
      setScreen('question');
      break;
    case 'previous':
      session = moveQuestion(session, data, -1);
      save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'next': {
      const question = data.questions[session.currentIndex];
      if (!session.answers[question.id]) { announce('请先选择一个选项。'); return; }
      if (session.currentIndex === data.questions.length - 1) setScreen('result');
      else {
        session = moveQuestion(session, data, 1);
        save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      break;
    }
    case 'review':
      session = { ...session, currentIndex: 0 };
      setScreen('question');
      break;
    case 'restart':
      if (window.confirm('重新开始会清除本设备保存的答案。确定继续吗？')) {
        removeStored(sessionKey);
        removeStored(selectionKey);
        selection = {};
        session = createSession(data);
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      break;
    case 'save-card': {
      const card = app.querySelector('#share-card');
      if (!card) return;
      button.disabled = true;
      button.textContent = '正在生成图片…';
      try {
        await downloadCard(data, card.dataset.role, card.dataset.style, {
          studentName: selection.studentName,
          secondaryText: card.dataset.secondary,
        });
        announce('角色卡图片已保存。');
      } catch (error) {
        announce(`图片保存失败：${error.message}`);
      } finally {
        button.disabled = false;
        button.textContent = '保存角色卡 PNG ↗';
      }
      break;
    }
    case 'save-assignment': {
      const feedback = app.querySelector('.assignment-feedback');
      if (feedback) feedback.textContent = '';
      button.disabled = true;
      button.textContent = '正在生成分工记录…';
      try {
        await downloadAssignment(data, selection);
        announce('个人分工记录图片已保存。');
        if (feedback) feedback.textContent = '分工记录图片已保存。';
      } catch (error) {
        announce(error.message);
        if (feedback) feedback.textContent = error.message;
        if (!selection.groupRole) app.querySelector('[name="group-role"]')?.focus();
      } finally {
        button.disabled = false;
        button.textContent = '保存个人分工记录 PNG ↗';
      }
      break;
    }
    default:
      break;
  }
});

try {
  const response = await fetch('./data/questions.json');
  if (!response.ok) throw new Error(`题库加载失败（${response.status}）`);
  data = await response.json();
  session = createSession(data, readStored(sessionKey));
  try {
    const savedSelection = JSON.parse(readStored(selectionKey) || '{}');
    if (data.backstageTypes[savedSelection.role]) selection.role = savedSelection.role;
    if (data.onstageTypes[savedSelection.style]) selection.style = savedSelection.style;
    for (const field of ['studentName', 'groupName', 'groupTask', 'actorRole']) {
      if (typeof savedSelection[field] === 'string') selection[field] = savedSelection[field];
    }
    if (data.backstageTypes[savedSelection.groupRole]) selection.groupRole = savedSelection.groupRole;
  } catch { selection = {}; }
  render();
} catch (error) {
  app.innerHTML = `<section class="load-error"><h1>舞台暂时没有点亮</h1><p>${error.message}</p><button class="primary-button" onclick="location.reload()">重试</button></section>`;
}
