import { icon } from './icons.js?v=3';
import { createMediaControls } from './media.js?v=1.6.1';
import { selectedSingleTracks, workParts } from './work-parts.js?v=1.5.7';

const $=id=>document.getElementById(id);
const normalise=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase();
function splitPeriod(period) {
  const chinese=period.search(/[\u3400-\u9fff]/);
  return [period.slice(0,chinese).trim(),period.slice(chinese)];
}

export function buildLibrary({data,app,favorites,makeButton,openComments,openAuth}) {
  let selected=0;
  let beforeSearch=0;
  let favoriteGroup='period';
  let favoriteSignature='';
  const sections=[];
  const navigation=[];
  const items=[];
  const search=$('trackSearch');
  const favoriteApp=$('favoritesApp');
  const favoriteNav=$('favoritesNav');

  function updateFavoriteButtons() {
    const snapshot=favorites.snapshot();
    $('favoritesCount').textContent=String(snapshot.count);
    $('favoritesCount').hidden=!snapshot.ready;
    document.querySelectorAll('[data-favorite-id]').forEach(button=>{
      const id=Number(button.dataset.favoriteId);
      const active=favorites.has(id);
      button.classList.toggle('is-favorite',active);
      button.setAttribute('aria-pressed',String(active));
      button.setAttribute('aria-label',`${active?'取消收藏':'收藏'}第 ${id} 首`);
      button.title=active?'取消收藏':'收藏这首作品';
      button.disabled=favorites.pending(id);
      button.querySelector('.favorite-label').textContent=active?'已收藏':'收藏';
    });
  }
  function makeTrack(item,location='library') {
    const {id,fullText,composer,period}=item;
    const row=document.createElement('article');row.className='track';row.id=location==='library'?`track-${id}`:`favorite-track-${id}`;
    const number=document.createElement('span');number.className='track-index';number.textContent=String(id).padStart(2,'0');
    const title=document.createElement('div');title.className='track-text';
    const split=fullText.indexOf(' — ');
    const titleOnly=split>=0?fullText.slice(split+3):fullText;
    const movement=titleOnly.indexOf(': ');
    const heading=document.createElement('h4');heading.className='work-name';heading.textContent=movement>=0?titleOnly.slice(0,movement):titleOnly;
    title.append(heading);
    if(movement>=0){const context=document.createElement('p');context.className='work-context';context.textContent=titleOnly.slice(movement+2);title.append(context);}
    if(selectedSingleTracks.has(id)||workParts[id]){const marker=document.createElement('span');marker.className='selection-marker';marker.textContent='原清单指定选段';title.append(marker);}
    if(location==='favorite-flat'){
      const meta=document.createElement('p');meta.className='favorite-track-meta';meta.textContent=`${composer} · ${period}`;title.append(meta);
    }
    row.append(number,title);
    const media=createMediaControls(id,fullText);
    const audio=media.querySelector('.local-recording');if(audio)title.append(audio);
    row.append(media);
    const footer=document.createElement('div');footer.className='track-footer';
    const actions=document.createElement('div');actions.className='actions';
    const discuss=document.createElement('button');discuss.type='button';discuss.className='copy comment-button';
    discuss.setAttribute('aria-haspopup','dialog');discuss.setAttribute('aria-label',`打开第 ${id} 首的评论窗口`);
    discuss.append(icon('comment',13),document.createTextNode('讨论'));discuss.addEventListener('click',()=>openComments(id));
    actions.append(discuss,makeButton('复制标题',titleOnly));
    const favorite=document.createElement('button');favorite.type='button';favorite.className='favorite-button';favorite.dataset.favoriteId=id;
    const label=document.createElement('span');label.className='favorite-label';label.textContent='收藏';
    favorite.append(icon('heart',17),label);favorite.addEventListener('click',()=>favorites.toggle(id));
    footer.append(actions,favorite);row.append(footer);
    return row;
  }
  function makeComposer(composer,tracks,location='library',subtitle='') {
    const group=document.createElement('details');group.className='composer';group.open=true;
    const summary=document.createElement('summary');
    const chevron=icon('chevron',14);chevron.classList.add('composer-chevron');
    const name=document.createElement('h3');name.textContent=composer;
    if(subtitle){const meta=document.createElement('span');meta.className='composer-period';meta.textContent=subtitle;name.append(meta);}
    const total=document.createElement('span');total.className='count';total.textContent=`${tracks.length} 首`;
    summary.append(chevron,name,total);group.append(summary);
    for(const track of tracks)group.append(makeTrack(track,location));
    return group;
  }

  for(const [index,[period,composers]] of data.entries()) {
    const [english,chinese]=splitPeriod(period);
    const count=composers.reduce((total,[,tracks])=>total+tracks.length,0);
    const nav=document.createElement('button');nav.type='button';nav.className='period-link';
    nav.setAttribute('aria-controls',`period-${index}`);nav.setAttribute('aria-label',`${period}，${count} 首作品`);
    const order=document.createElement('span');order.className='period-order';order.textContent=String(index+1).padStart(2,'0');
    const label=document.createElement('span');label.className='period-link-name';label.append(document.createTextNode(english));
    const small=document.createElement('small');small.textContent=chinese;label.append(small);
    const total=document.createElement('span');total.className='nav-count';total.textContent=count;
    nav.append(order,label,total);nav.addEventListener('click',()=>selectPeriod(index));$('periodNav').append(nav);navigation.push(nav);
    const section=document.createElement('section');section.className='period';section.id=`period-${index}`;section.setAttribute('aria-label',period);
    const periodLabel=document.createElement('h3');periodLabel.className='period-label';periodLabel.textContent=period;section.append(periodLabel);
    const groups=[];
    for(const [composer,tracks] of composers){
      const groupItems=tracks.map(([id,fullText])=>({id,fullText,composer,period,search:normalise(`${period} ${composer} ${fullText}`)}));
      items.push(...groupItems);
      const group=makeComposer(composer,groupItems);
      section.append(group);groups.push({group,rows:groupItems.map(item=>({item,row:group.querySelector(`#track-${item.id}`)}))});
    }
    sections.push({section,periodLabel,groups});app.append(section);
  }
  const all=document.createElement('button');all.type='button';all.className='period-link all-periods';
  all.append(icon('book',15),document.createTextNode('全部作品'));all.addEventListener('click',()=>selectPeriod(-1));$('periodNav').append(all);
  favoriteNav.addEventListener('click',()=>selectPeriod('favorites'));
  for(const button of $('favoritesControls').querySelectorAll('[data-favorite-group]')) {
    button.addEventListener('click',()=>{
      favoriteGroup=button.dataset.favoriteGroup;
      $('favoritesControls').querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      renderFavorites();
    });
  }
  function selectPeriod(index) {
    selected=index;beforeSearch=index;search.value='';delete search.dataset.searching;updateView();
  }
  function matches(item,query) {
    if(!query)return true;
    return /^\d+$/.test(query)?item.id===Number(query):item.search.includes(query);
  }
  function setFavoriteEmpty(title,description,action,label) {
    const empty=document.createElement('div');empty.className='empty-search favorite-empty';
    empty.append(icon('heart',22));
    const heading=document.createElement('h3');heading.textContent=title;
    const text=document.createElement('p');text.textContent=description;
    empty.append(heading,text);
    if(action){const button=document.createElement('button');button.type='button';button.className='secondary-btn';button.textContent=label;button.addEventListener('click',action);empty.append(button);}
    favoriteApp.append(empty);
  }
  function renderFavorites() {
    favoriteApp.querySelectorAll('audio').forEach(audio=>audio.pause());
    favoriteApp.replaceChildren();
    const status=favorites.snapshot();
    const query=normalise(search.value.trim());
    const filtered=items.filter(item=>favorites.has(item.id) && matches(item,query));
    $('visibleCount').textContent=`${filtered.length} 首作品`;
    $('favoritesControls').hidden=!status.ready || status.count===0;
    if(!status.signedIn){setFavoriteEmpty('登录后收藏作品','收藏会保存在你的账号中，换设备也能找到。',openAuth,'登录 / 注册');return;}
    if(status.loading){setFavoriteEmpty('正在读取收藏','请稍候。');return;}
    if(status.error || !status.ready){setFavoriteEmpty('暂时无法读取收藏','请检查网络后重试。',()=>favorites.load(),'重新加载');return;}
    if(!filtered.length){
      if(query && status.count)setFavoriteEmpty('没有找到这首收藏','试试其他作曲家姓名或作品名称。');
      else setFavoriteEmpty('还没有收藏','在曲目旁点击爱心，就能把作品收进这里。',()=>selectPeriod(0),'浏览曲目');
      return;
    }
    if(favoriteGroup==='all') {
      const flat=document.createElement('div');flat.className='favorite-flat';
      for(const item of filtered)flat.append(makeTrack(item,'favorite-flat'));
      favoriteApp.append(flat);
    } else if(favoriteGroup==='composer') {
      const grouped=new Map();
      for(const item of filtered){if(!grouped.has(item.composer))grouped.set(item.composer,[]);grouped.get(item.composer).push(item);}
      for(const [composer,tracks] of [...grouped].sort((a,b)=>a[0].localeCompare(b[0],'en'))){
        const periods=[...new Set(tracks.map(item=>item.period))].join(' / ');
        favoriteApp.append(makeComposer(composer,tracks,'favorite',periods));
      }
    } else {
      for(const [period,composers] of data){
        const grouped=composers.map(([composer])=>[composer,filtered.filter(item=>item.period===period && item.composer===composer)]).filter(([,tracks])=>tracks.length);
        if(!grouped.length)continue;
        const group=document.createElement('details');group.className='favorite-period';group.open=true;
        const summary=document.createElement('summary');
        const name=document.createElement('span');name.textContent=period;
        const count=document.createElement('span');count.className='count';count.textContent=`${grouped.reduce((n,[,tracks])=>n+tracks.length,0)} 首`;
        summary.append(name,count,icon('chevron',15));group.append(summary);
        for(const [composer,tracks] of grouped)group.append(makeComposer(composer,tracks,'favorite'));
        favoriteApp.append(group);
      }
    }
    updateFavoriteButtons();
  }
  function updateView() {
    const query=normalise(search.value.trim());
    const inFavorites=selected==='favorites';
    const global=!inFavorites && (Boolean(query) || selected===-1);
    let visible=0;
    app.hidden=inFavorites;favoriteApp.hidden=!inFavorites;
    if(inFavorites)app.querySelectorAll('audio').forEach(audio=>audio.pause());
    else favoriteApp.querySelectorAll('audio').forEach(audio=>audio.pause());
    if(!inFavorites){
      for(const [index,{section,periodLabel,groups}] of sections.entries()){
        let periodVisible=0;periodLabel.hidden=!global;
        for(const {group,rows} of groups){
          let groupVisible=0;
          for(const {row,item} of rows){const match=matches(item,query);row.hidden=!match;if(match)groupVisible++;}
          group.hidden=!groupVisible;if(query && groupVisible)group.open=true;periodVisible+=groupVisible;
        }
        section.hidden=(!global && selected!==index) || !periodVisible;
        if(!section.hidden)visible+=periodVisible;
      }
    }
    navigation.forEach((button,index)=>{if(!global && !inFavorites && index===selected)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
    if(!query && selected===-1)all.setAttribute('aria-current','true');else all.removeAttribute('aria-current');
    if(inFavorites)favoriteNav.setAttribute('aria-current','true');else favoriteNav.removeAttribute('aria-current');
    $('periodTitle').replaceChildren();
    if(inFavorites){$('periodTitle').textContent='我的收藏';$('breadcrumbPeriod').textContent='我的收藏';$('periodIndex').textContent='个人曲目';}
    else if(query){$('periodTitle').textContent='Search results';$('breadcrumbPeriod').textContent='搜索结果';$('periodIndex').textContent='全部时期';}
    else if(selected===-1){$('periodTitle').textContent='The complete collection';$('breadcrumbPeriod').textContent='全部作品';$('periodIndex').textContent='06 个时期';}
    else {
      const [english,chinese]=splitPeriod(data[selected][0]);const small=document.createElement('span');small.textContent=chinese;
      $('periodTitle').append(document.createTextNode(english),small);$('breadcrumbPeriod').textContent=english;$('periodIndex').textContent=`${String(selected+1).padStart(2,'0')} / 06`;
    }
    $('favoritesControls').hidden=!inFavorites;
    $('emptySearch').hidden=inFavorites || visible>0;
    $('pilotNote').hidden=inFavorites || !!query || selected!==0;
    if(inFavorites)renderFavorites();else $('visibleCount').textContent=`${visible} 首作品`;
    app.querySelectorAll('audio').forEach(audio=>{if(audio.closest('.period')?.hidden || audio.closest('.track')?.hidden || audio.closest('.composer')?.hidden)audio.pause();});
    updateFavoriteButtons();
  }
  search.addEventListener('input',()=>{
    if(search.value.trim() && !search.dataset.searching){beforeSearch=selected;search.dataset.searching='true';}
    else if(!search.value.trim()){selected=beforeSearch;delete search.dataset.searching;}
    updateView();
  });
  $('clearSearch').addEventListener('click',()=>{search.value='';delete search.dataset.searching;selected=beforeSearch;updateView();search.focus();});
  document.addEventListener('keydown',e=>{if(e.key==='/' && !document.querySelector('dialog[open]') && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();search.focus();}});
  favorites.subscribe(()=>{
    updateFavoriteButtons();
    const state=favorites.snapshot();
    const signature=JSON.stringify([state.signedIn,state.loading,state.ready,state.error,...items.filter(item=>favorites.has(item.id)).map(item=>item.id)]);
    if(selected==='favorites' && signature!==favoriteSignature)renderFavorites();
    favoriteSignature=signature;
  });
  function setAll(open) {
    const container=selected==='favorites'?favoriteApp:app;
    container.querySelectorAll('details.composer,details.favorite-period').forEach(element=>{element.open=open;});
    if(!open)container.querySelectorAll('audio').forEach(audio=>audio.pause());
  }
  updateView();
  return {setAll};
}
