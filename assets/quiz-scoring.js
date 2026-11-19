export function normalizeAnswer(text) {
  return text.normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '')
    .replaceAll('ß', 'ss').replaceAll('ł', 'l').replaceAll('æ', 'ae').replaceAll('œ', 'oe')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function similarity(left, right) {
  if (left === right) return 1;
  if (!left || !right) return 0;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    const next = [row];
    for (let column = 1; column <= right.length; column++) {
      next[column] = Math.min(previous[column] + 1, next[column - 1] + 1, previous[column - 1] + (left[row - 1] !== right[column - 1]));
    }
    previous = next;
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

function romanNumber(roman) {
  const digits = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  const values = [...roman.toUpperCase()].map(letter => digits[letter]);
  return values.reduce((total, value, index) => total + (value < values[index + 1] ? -value : value), 0);
}

function identifiers(text) {
  const standardized = text.normalize('NFKC');
  const tagged = [];
  for (const [, label, number] of standardized.matchAll(/\b(movement|mvt|part|act|no|op|bwv|variation)\b\.?\s*(\d+|[ivxlc]+)\b/gi)) {
    const kind = label.toLowerCase() === 'mvt' ? 'movement' : label.toLowerCase();
    tagged.push([kind, /^\d+$/.test(number) ? Number(number) : romanNumber(number)]);
  }
  for (const [, number] of standardized.matchAll(/(?:^|:\s*)([IVXL]{1,5}|\d+)[.·](?=\s)/g)) {
    tagged.push(['movement', /^\d+$/.test(number) ? Number(number) : romanNumber(number)]);
  }
  return { tagged, numbers: [...(standardized.match(/\d+/g) || []).map(Number), ...tagged.map(([, number]) => number)] };
}

function hasDifferentIdentifier(input, answers) {
  const given = identifiers(input);
  const expected = answers.map(identifiers);
  const numbers = new Set(expected.flatMap(answer => answer.numbers));
  if (numbers.size && given.numbers.some(number => !numbers.has(number))) return true;
  const tagged = expected.flatMap(answer => answer.tagged);
  return given.tagged.some(([kind, number]) => {
    const sameKind = tagged.filter(([expectedKind]) => expectedKind === kind);
    return sameKind.length > 0 && !sameKind.some(([, expectedNumber]) => expectedNumber === number);
  });
}

export function gradeAnswer(input, { answers, partial = [], otherAnswers = [] }) {
  const text = normalizeAnswer(input);
  const expected = answers.map(normalizeAnswer).filter(Boolean);
  if (!text || !expected.length) return { verdict: 'incorrect', percent: 0 };
  const best = Math.max(...expected.map(answer => similarity(text, answer)));
  const percent = Math.floor(best * 100 + 1e-9);
  if (expected.includes(text)) return { verdict: 'correct', percent: 100 };
  if (partial.some(answer => normalizeAnswer(answer) === text)) return { verdict: 'inexact', percent, reason: 'selection' };
  if (otherAnswers.some(answer => normalizeAnswer(answer) === text)) return { verdict: 'incorrect', percent, reason: 'different' };

  if (hasDifferentIdentifier(input, answers)) {
    return { verdict: 'incorrect', percent, reason: 'number' };
  }
  const verdict = percent >= 80 ? 'correct' : percent >= 60 ? 'inexact' : 'incorrect';
  return { verdict, percent };
}
