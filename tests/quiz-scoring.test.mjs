import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeAnswer } from '../assets/quiz-scoring.js';

test('typed answers use inclusive similarity thresholds and ignore accents, punctuation, and case', () => {
  assert.deepEqual(gradeAnswer('François · COUPERIN', { answers: ['Francois Couperin'] }), { verdict: 'correct', percent: 100 });
  assert.deepEqual(gradeAnswer('aBcXé', { answers: ['abcde'] }), { verdict: 'correct', percent: 80 });
  assert.deepEqual(gradeAnswer('aXcYé', { answers: ['abcde'] }), { verdict: 'inexact', percent: 60 });
  assert.deepEqual(gradeAnswer('aXcYZ', { answers: ['abcde'] }), { verdict: 'incorrect', percent: 40 });
  assert.deepEqual(gradeAnswer('MACHÀUT', { answers: ['Guillaume de Machaut', 'Machaut', '马肖'] }), { verdict: 'correct', percent: 100 });
});

test('a shared parent title or conflicting movement identifier cannot pass as the intended selection', () => {
  const answer = { answers: ['Missa pro defunctis: Dies irae', 'Dies irae'], partial: ['Missa pro defunctis'], otherAnswers: ['Missa pro defunctis: Requiem aeternam'] };
  assert.equal(gradeAnswer('Missa pro defunctis', answer).verdict, 'inexact');
  assert.equal(gradeAnswer('Missa pro defunctis: Requiem aeternam', answer).verdict, 'incorrect');
  const wrongMovement = gradeAnswer('Symphony No. 104: III. Finale Spiritoso', { answers: ['Symphony No. 104: IV. Finale Spiritoso'] });
  assert.ok(wrongMovement.percent > 80);
  assert.equal(wrongMovement.verdict, 'incorrect');
  assert.equal(wrongMovement.reason, 'number');
  assert.equal(gradeAnswer('Symphony No. 3: III. Allegro', { answers: ['Symphony No. 3: I. Allegro'] }).reason, 'number');
});
