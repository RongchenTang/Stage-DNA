export function createSession(data, saved) {
  const fresh = {
    version: data.version,
    screen: 'welcome',
    currentIndex: 0,
    answers: {},
  };
  if (!saved) return fresh;

  try {
    const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
    if (parsed?.version !== data.version || !parsed.answers || typeof parsed.answers !== 'object') return fresh;
    const answers = {};
    for (const question of data.questions) {
      const key = parsed.answers[question.id];
      if (question.options.some((option) => option.key === key)) answers[question.id] = key;
    }
    const currentIndex = Number.isInteger(parsed.currentIndex)
      ? Math.min(Math.max(parsed.currentIndex, 0), data.questions.length - 1)
      : 0;
    const screen = ['welcome', 'question', 'result'].includes(parsed.screen) ? parsed.screen : 'welcome';
    return { version: data.version, screen, currentIndex, answers };
  } catch {
    return fresh;
  }
}

export function answerQuestion(session, data, id, key) {
  const question = data.questions.find((item) => item.id === id);
  if (!question || !question.options.some((option) => option.key === key)) {
    throw new Error(`Invalid answer: ${id}`);
  }
  return { ...session, answers: { ...session.answers, [id]: key } };
}

export function moveQuestion(session, data, delta) {
  const currentIndex = Math.min(Math.max(session.currentIndex + delta, 0), data.questions.length - 1);
  return { ...session, currentIndex };
}

export function jumpQuestion(session, data, index) {
  const currentIndex = Math.min(Math.max(index, 0), data.questions.length - 1);
  return { ...session, screen: 'question', currentIndex };
}

export function serializeSession(session) {
  return JSON.stringify(session);
}
