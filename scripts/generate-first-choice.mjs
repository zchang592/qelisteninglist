import {writeFileSync} from 'node:fs';
import {data} from '../assets/data.js';
import {youtubeRecordings} from '../assets/media.js';
import {workParts,scopeNotes,selectedSingleTracks} from '../assets/work-parts.js';

const link=(video,start)=>`https://www.youtube.com/watch?v=${video}${start?`&t=${start}s`:''}`;
const csvCell=value=>`"${String(value??'').replaceAll('"','""')}"`;
const rows=[];
const markdown=['# QE Listening List · YouTube 首选链接','', '按网站首选顺序列出：完整作品每条一个；明确指定多个选曲的条目，每个选曲各一个。带时间参数的链接从指定位置开始，部分完整录音不会在乐章末尾自动停止。','', '链接是 YouTube 视频页面，不是音频文件。视频可能受地区或版权限制，作品与演奏版本仍应对照原始资料。',''];
for(const [period,composers] of data){
  markdown.push(`## ${period}`,'');
  for(const [,works] of composers)for(const [id,title] of works){
    const note=scopeNotes[id]||'';
    if(workParts[id]){
      markdown.push(`- **${id}. ${title}**${note?` — ${note}`:''}`);
      for(const part of workParts[id]){
        const url=part.video?link(part.video,part.start):'';
        const detail=part.unresolved?'待核对：未提供链接':part.start!==undefined?'完整录音定位':'指定选曲';
        rows.push([period,id,title,part.name,url,detail,note]);
        markdown.push(`  - ${part.name}：${url?`[首选 YouTube](${url})`:'待核对'}${part.start!==undefined?'（完整录音定位）':''}`);
      }
    }else{
      const recording=youtubeRecordings[id]?.[0];
      const url=recording?`${recording.url}${recording.start?`&t=${recording.start}s`:''}`:'';
      const detail=selectedSingleTracks.has(id)?'原清单指定选段':'按原条目';
      rows.push([period,id,title,'',url,detail,note]);
      markdown.push(`- **${id}. ${title}**：[首选 YouTube](${url})${note?` — ${note}`:''}`);
    }
  }
  markdown.push('');
}
writeFileSync('docs/youtube-first-choice.md',markdown.join('\n'));
writeFileSync('docs/youtube-first-choice.csv','\ufeff'+[['时期','序号','作品','指定选曲','YouTube 首选链接','说明','范围备注'],...rows].map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n');
console.log(`${rows.length} rows; ${rows.filter(r=>!r[4]).length} unresolved`);
