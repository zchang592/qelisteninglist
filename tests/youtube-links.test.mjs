import test from 'node:test';
import assert from 'node:assert/strict';
import { youtubeVideoId, bilibiliVideo } from '../assets/media.js';

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

test('Bilibili player accepts only a valid BV ID or official HTTPS video URL',()=>{
  assert.deepEqual(bilibiliVideo('BV1xx411c7mD'),{id:'BV1xx411c7mD',page:1});
  assert.deepEqual(bilibiliVideo('https://www.bilibili.com/video/BV1xx411c7mD/?p=2'),{id:'BV1xx411c7mD',page:2});
  for(const invalid of ['http://www.bilibili.com/video/BV1xx411c7mD','https://bilibili.com.evil.example/video/BV1xx411c7mD','https://www.bilibili.com/video/BV1xx411c7mD?p=0','javascript:alert(1)','BVwrong'])assert.equal(bilibiliVideo(invalid),null);
});
