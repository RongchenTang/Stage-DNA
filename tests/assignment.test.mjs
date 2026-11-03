import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAssignmentSpec } from '../assignment.mjs';
import { renderResults } from '../view.mjs';
import { scoreAnswers } from '../score.mjs';

const data = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8'));
const answers = Object.fromEntries(data.questions.map(({ id }) => [id, 'A']));

test('assignment record keeps chosen backstage role separate from scores', () => {
  const spec = buildAssignmentSpec(data, {
    studentName: '小明', groupName: '第二组', groupRole: 'X',
    groupTask: '制作海报', actorRole: '',
  });
  assert.equal(spec.roleName, data.backstageTypes.X);
  assert.equal(spec.actorRole, '待剧本与试演后确定');
  assert.equal(spec.width, 1080);
  assert.equal(spec.height, 1350);
});

test('assignment record requires a student-chosen role', () => {
  assert.throws(() => buildAssignmentSpec(data, { groupRole: '' }), /请选择幕后主责/);
  assert.throws(() => buildAssignmentSpec(data, { groupRole: 'bad' }), /请选择幕后主责/);
});

test('result page offers an editable assignment record without assigning the actor role', () => {
  const html = renderResults(data, scoreAnswers(data, answers), {
    studentName: '<小明>', groupRole: 'X', actorRole: '',
  });
  assert.match(html, /组内分工记录/);
  assert.match(html, /name="group-role"/);
  assert.match(html, /name="actor-role"/);
  assert.match(html, /待剧本与试演后确定/);
  assert.match(html, /data-action="save-assignment"/);
  assert.match(html, /&lt;小明&gt;/);
  assert.doesNotMatch(html, /value="<小明>"/);
});

