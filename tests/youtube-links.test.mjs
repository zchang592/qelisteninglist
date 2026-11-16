import test from 'node:test';
import assert from 'node:assert/strict';
import { youtubeVideoId } from '../assets/media.js';

test('only valid HTTPS YouTube video links can be embedded', () => {
  const id = 'dQw4w9WgXcQ';
  for (const url of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://www.youtube.com/embed/${id}`,
  ]) assert.equal(youtubeVideoId(url), id);
  for (const url of [
    `http://youtube.com/watch?v=${id}`,
    `https://youtube.com.example.org/watch?v=${id}`,
    'javascript:alert(1)',
    'https://youtu.be/invalid',
    '',
  ]) assert.equal(youtubeVideoId(url), null);
});
