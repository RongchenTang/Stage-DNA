import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderWelcome, renderQuestion, renderResults, escapeHtml } from '../view.mjs';
import { createSession, answerQuestion } from '../state.mjs';
import { scoreAnswers } from '../score.mjs';

const data = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8'));

test('welcome page explains the two identities and starts the survey', () => {
  const html = renderWelcome(data, 0);
  assert.match(html, /Stage DNA/);
  assert.match(html, /幕后/);
  assert.match(html, /台前/);
  assert.match(html, /data-action="start"/);
});

test('question page shows the exact handed-off choices but hides teacher scoring', () => {
  const session = answerQuestion(createSession(data), data, 'Q01', 'A');
  const html = renderQuestion(data, session);
  assert.ok(html.includes(data.questions[0].question));
  data.questions[0].options.forEach(({ text }) => assert.ok(html.includes(text)));
  assert.equal((html.match(/data-answer="[ABCD]"/g) ?? []).length, 4);
  assert.match(html, /aria-pressed="true"/);
  assert.doesNotMatch(html, /教师计分|data-type=/);
});

test('completed survey offers numbered jumps and a direct return to results', () => {
  const answers = Object.fromEntries(data.questions.map(({ id }) => [id, 'A']));
  const session = { ...createSession(data), screen: 'question', currentIndex: 14, answers };
  const questionHtml = renderQuestion(data, session);
  const resultHtml = renderResults(data, scoreAnswers(data, answers), {});
  assert.equal((questionHtml.match(/data-jump-index="\d+"/g) ?? []).length, 21);
  assert.equal((resultHtml.match(/data-jump-index="\d+"/g) ?? []).length, 21);
  assert.match(questionHtml, /data-action="result"/);
  assert.match(questionHtml, /data-jump-index="14"[^>]*aria-current="step"/);
  assert.match(resultHtml, /data-jump-index="14"[^>]*>15<\/button>/);
});

test('result page reports original counts and ties without random winners', () => {
  const answers = Object.fromEntries(data.questions.map(({ id }) => [id, 'A']));
  const html = renderResults(data, scoreAnswers(data, answers), {});
  assert.match(html, /并列/);
  assert.match(html, /舞台掌舵者/);
  assert.match(html, /故事编织者/);
  assert.match(html, /热烈表达型/);
  assert.match(html, /data-select-role="D"/);
  assert.doesNotMatch(html, /97%|天赋值/);
  assert.match(html, /并列兴趣/);
});

test('user-supplied text is escaped before entering the page', () => {
  assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
});

