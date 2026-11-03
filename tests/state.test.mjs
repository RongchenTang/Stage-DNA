import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSession, answerQuestion, moveQuestion, jumpQuestion, serializeSession } from '../state.mjs';

const data = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8'));

test('starts at the welcome screen with no answers', () => {
  assert.deepEqual(createSession(data), {
    version: data.version,
    screen: 'welcome',
    currentIndex: 0,
    answers: {},
  });
});

test('answers can be changed after navigating back without increasing progress', () => {
  let session = createSession(data);
  session = answerQuestion(session, data, 'Q01', 'A');
  session = moveQuestion(session, data, 1);
  assert.equal(session.currentIndex, 1);
  session = moveQuestion(session, data, -1);
  session = answerQuestion(session, data, 'Q01', 'C');
  assert.equal(session.answers.Q01, 'C');
  assert.equal(Object.keys(session.answers).length, 1);
});

test('question navigation stays inside the 21-item survey', () => {
  const start = createSession(data);
  assert.equal(moveQuestion(start, data, -1).currentIndex, 0);
  assert.equal(moveQuestion(start, data, 99).currentIndex, 20);
  assert.equal(moveQuestion(moveQuestion(start, data, 99), data, 1).currentIndex, 20);
});

test('jumps directly to a chosen question without changing answers', () => {
  const original = answerQuestion(createSession(data), data, 'Q01', 'B');
  const jumped = jumpQuestion(original, data, 14);
  assert.equal(jumped.screen, 'question');
  assert.equal(jumped.currentIndex, 14);
  assert.deepEqual(jumped.answers, original.answers);
  assert.equal(jumpQuestion(original, data, -1).currentIndex, 0);
  assert.equal(jumpQuestion(original, data, 99).currentIndex, 20);
});

test('restores same-version answers and drops incompatible saved data', () => {
  const original = answerQuestion(createSession(data), data, 'Q01', 'B');
  const serialized = serializeSession(original);
  assert.deepEqual(createSession(data, serialized), original);
  assert.deepEqual(createSession({ ...data, version: 'future' }, serialized).answers, {});
  assert.deepEqual(createSession(data, '{broken').answers, {});
});

test('refuses a choice missing from the original question', () => {
  assert.throws(() => answerQuestion(createSession(data), data, 'Q19', 'D'), /Invalid answer: Q19/);
});

