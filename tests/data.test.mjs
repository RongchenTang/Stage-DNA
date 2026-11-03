import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sourcePath = new URL('../../StageDNA_Work_交接包/01_设计文档/questions_stage_dna_v1.json', import.meta.url);
const sitePath = new URL('../data/questions.json', import.meta.url);
const source = readFileSync(sourcePath, 'utf8');
const site = readFileSync(sitePath, 'utf8');
const data = JSON.parse(site);

test('the website uses the handed-off question bank unchanged', () => {
  assert.equal(site, source);
});

test('21 questions retain the promised 12/6/3 structure and keys', () => {
  assert.deepEqual(data.questions.map(({ id }) => id), Array.from({ length: 21 }, (_, i) => `Q${String(i + 1).padStart(2, '0')}`));
  assert.deepEqual(data.questions.map(({ kind }) => kind), [
    ...Array(12).fill('backstage'),
    ...Array(6).fill('onstage'),
    ...Array(3).fill('preference'),
  ]);
  data.questions.forEach((question, index) => {
    assert.equal(question.options.map(({ key }) => key).join(''), index < 18 ? 'ABCD' : 'ABC');
    assert.ok(question.question.trim());
    assert.ok(question.options.every(({ text }) => text.trim()));
  });
});

test('each backstage role and onstage style has balanced option exposure', () => {
  const counts = (kind) => data.questions
    .filter((question) => question.kind === kind)
    .flatMap((question) => question.options.map(({ type }) => type))
    .reduce((result, type) => ({ ...result, [type]: (result[type] ?? 0) + 1 }), {});

  assert.deepEqual(counts('backstage'), { D: 8, V: 8, W: 8, M: 8, X: 8, C: 8 });
  assert.deepEqual(counts('onstage'), { H: 6, E: 6, T: 6, U: 6 });
});

