function rankGroups(scores) {
  const groups = new Map();
  for (const [id, score] of Object.entries(scores)) {
    if (!groups.has(score)) groups.set(score, []);
    groups.get(score).push(id);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([score, ids]) => ({ score, ids }));
}

export function scoreAnswers(data, answers) {
  const backstageScores = Object.fromEntries(Object.keys(data.backstageTypes).map((id) => [id, 0]));
  const onstageScores = Object.fromEntries(Object.keys(data.onstageTypes).map((id) => [id, 0]));
  const preferences = {};

  for (const question of data.questions) {
    const key = answers[question.id];
    if (key === undefined || key === null || key === '') {
      throw new Error(`Missing answer: ${question.id}`);
    }
    const option = question.options.find((item) => item.key === key);
    if (!option) throw new Error(`Invalid answer: ${question.id}`);

    if (question.kind === 'backstage') backstageScores[option.type] += 1;
    else if (question.kind === 'onstage') onstageScores[option.type] += 1;
    else if (question.kind === 'preference') preferences[question.id] = option.value;
  }

  return {
    backstageScores,
    onstageScores,
    backstageGroups: rankGroups(backstageScores),
    onstageGroups: rankGroups(onstageScores),
    preferences,
  };
}
