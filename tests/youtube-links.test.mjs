import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from '../assets/data.js';
import { workParts, scopeNotes } from '../assets/work-parts.js';
import { youtubeVideoId, bilibiliVideo, youtubeRecordings } from '../assets/media.js';

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

test('all 160 works have at least one valid YouTube recording',()=>{
  for(const [,composers] of data)for(const [,works] of composers)for(const [id] of works){
    assert.ok(youtubeRecordings[id]?.length,`missing recording for ${id}`);
    for(const recording of youtubeRecordings[id])assert.ok(youtubeVideoId(recording.url),`invalid video for ${id}`);
  }
});

test('part listings keep source tracks and explicitly flagged ambiguous scopes',()=>{
  const ids=new Set(data.flatMap(([,cs])=>cs.flatMap(([,tracks])=>tracks.map(([id])=>id))));
  for(const [id,parts] of Object.entries(workParts)){
    assert.ok(ids.has(Number(id)));assert.ok(parts.length>1);
    for(const part of parts){assert.ok(part.name);if(part.video)assert.ok(youtubeVideoId(`https://www.youtube.com/watch?v=${part.video}`));}
  }
  assert.deepEqual(workParts[138].map(p=>p.start),[0,432,1182]);
  assert.equal(workParts[149].length,4);
  assert.match(scopeNotes[39],/没有指定/);assert.match(scopeNotes[160],/四个段落/);
});
