import { icon } from './icons.js?v=3';

const $=id=>document.getElementById(id);

export function createAdminController({data, stateButtons, isAdmin, changeState, renderState, refreshStats}) {
  const dialog=$('adminProgressDialog');
  const list=$('adminList');
  let built=false;
  function build() {
    if(built)return;
    for(const [period,composers] of data){
      const section=document.createElement('details');section.className='admin-period';
      const heading=document.createElement('summary');
      const title=document.createElement('span');title.textContent=period;
      const total=document.createElement('span');total.className='admin-group-count';total.textContent=`${composers.reduce((n,[,tracks])=>n+tracks.length,0)} 首`;
      heading.append(title,total,icon('chevron',15));section.append(heading);
      for(const [composer,tracks] of composers){
        const group=document.createElement('details');group.className='admin-composer';
        const summary=document.createElement('summary');
        const name=document.createElement('span');name.textContent=composer;
        const count=document.createElement('span');count.className='admin-group-count';count.textContent=`${tracks.length} 首`;
        summary.append(name,count,icon('chevron',14));group.append(summary);
        for(const [id,fullText] of tracks){
          const row=document.createElement('div');row.className='admin-track';
          const mark=document.createElement('button');mark.type='button';mark.className='state-btn';mark.setAttribute('role','checkbox');
          mark.addEventListener('click',()=>changeState(id));stateButtons.set(id,mark);
          const number=document.createElement('span');number.className='admin-track-number';number.textContent=`${id}.`;
          const title=document.createElement('span');title.className='admin-track-title';title.textContent=fullText;
          const status=document.createElement('span');status.className='admin-track-status';status.id=`state-label-${id}`;
          row.append(mark,number,title,status);group.append(row);
        }
        section.append(group);
      }
      list.append(section);
    }
    built=true;
    for(const id of stateButtons.keys())renderState(id);
    refreshStats();
  }
  function open() {
    if(!isAdmin())return;
    build();if(!dialog.open)dialog.showModal();
  }
  function close() {if(dialog.open)dialog.close();}
  function clear() {close();list.replaceChildren();stateButtons.clear();built=false;}
  $('closeAdminProgress').addEventListener('click',close);
  $('adminExpandBtn').addEventListener('click',()=>list.querySelectorAll('details').forEach(group=>{group.open=true;}));
  $('adminCollapseBtn').addEventListener('click',()=>list.querySelectorAll('details').forEach(group=>{group.open=false;}));
  return {open,close,clear};
}
