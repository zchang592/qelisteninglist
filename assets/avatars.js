// Ten self-contained note characters; their keys are persisted in Supabase user metadata.
const AVATARS = [
  {name:'晴天',bg:'#f9e9b9',ink:'#d77d49',cheek:'#f8bd9b',detail:'sparkle'},
  {name:'薄荷',bg:'#d5eedb',ink:'#579978',cheek:'#f3b7ac',detail:'leaf'},
  {name:'蓝调',bg:'#dbe9f5',ink:'#5987ad',cheek:'#f5b2b3',detail:'flag'},
  {name:'草莓',bg:'#f7dbe0',ink:'#c96a75',cheek:'#f4aaa9',detail:'bow'},
  {name:'蜜桃',bg:'#fbe4d3',ink:'#df9460',cheek:'#f6b3a4',detail:'hat'},
  {name:'青柠',bg:'#e9efc9',ink:'#8caa62',cheek:'#efb3a4',detail:'star'},
  {name:'葡萄',bg:'#eae1ef',ink:'#967aaa',cheek:'#edb6bd',detail:'double'},
  {name:'海盐',bg:'#d8efeb',ink:'#5a9d9b',cheek:'#f3ada8',detail:'cap'},
  {name:'珊瑚',bg:'#f7ded2',ink:'#d58470',cheek:'#ec9f9e',detail:'flower'},
  {name:'可可',bg:'#e9e0d5',ink:'#9c7865',cheek:'#e6a69a',detail:'glasses'},
];
export const AVATAR_KEYS = AVATARS.map((_,index)=>`note-${String(index+1).padStart(2,'0')}`);

export function avatarForUser(user) {
  const preferred=user?.user_metadata?.avatar_key;
  if(AVATAR_KEYS.includes(preferred)) return preferred;
  const prefix=(user?.id || '').replaceAll('-','').slice(0,8);
  if(prefix.length!==8) return AVATAR_KEYS[0];
  return AVATAR_KEYS[Array.from(prefix).reduce((sum,char)=>sum+char.charCodeAt(0),0)%AVATARS.length];
}

export function randomAvatar() {
  const values=new Uint32Array(1);
  crypto.getRandomValues(values);
  return AVATAR_KEYS[values[0]%AVATARS.length];
}

export function avatarName(key) {
  return AVATARS[AVATAR_KEYS.indexOf(key)]?.name || AVATARS[0].name;
}

export function noteAvatar(key, extraClass='') {
  const index=Math.max(0,AVATAR_KEYS.indexOf(key));
  const {bg,ink,cheek,detail}=AVATARS[index];
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 64 64');
  svg.setAttribute('class',`note-avatar ${extraClass}`.trim());
  svg.dataset.avatar=AVATAR_KEYS[index];
  svg.setAttribute('aria-hidden','true');
  const decorations={
    sparkle:'<path d="M47 13v6m-3-3h6" stroke="#fffdf6" stroke-width="2.3" stroke-linecap="round"/>',
    leaf:'<path d="M43 17c2-6 7-7 9-7-1 6-3 9-9 9" fill="#94bc7d"/>',
    flag:'<path d="M41 12c9 1 12 6 11 11-2-3-5-5-11-6" fill="#87b2d0"/>',
    bow:'<path d="M40 18c-7-6-10 1-4 4l5-2 4 3c6-2 3-9-4-5" fill="#f4a1ae" stroke="#fff8ef" stroke-width="1"/>',
    hat:'<path d="M20 29l5-10 14 5 1 8z" fill="#f5c979"/><path d="M18 30l24 6" stroke="#f5c979" stroke-width="3" stroke-linecap="round"/>',
    star:'<path d="m48 10 1.3 3 3.2.2-2.4 2.1.7 3.2-2.8-1.7-2.7 1.7.7-3.2-2.5-2.1 3.3-.2z" fill="#fff5c8"/>',
    double:'<circle cx="47" cy="37" r="6" fill="#b4a2c7"/><path d="M52 36V17" stroke="#b4a2c7" stroke-width="4" stroke-linecap="round"/>',
    cap:'<path d="M22 29c1-8 13-11 19-3l-2 6-17 1z" fill="#f5c882"/><path d="M21 32c9-1 15-1 21 2" fill="none" stroke="#f5c882" stroke-width="3" stroke-linecap="round"/>',
    flower:'<g fill="#fffbef"><circle cx="49" cy="13" r="2.6"/><circle cx="45" cy="16" r="2.6"/><circle cx="50" cy="18" r="2.6"/><circle cx="53" cy="15" r="2.6"/></g><circle cx="49" cy="15.5" r="2" fill="#f3bd70"/>',
    glasses:'<g fill="none" stroke="#fffaf1" stroke-width="1.5"><circle cx="23" cy="39" r="3.4"/><circle cx="33" cy="39" r="3.4"/><path d="M26.5 39h3"/></g>',
  };
  // The markup and colours are entirely from the fixed list above, never from user input.
  svg.innerHTML=`<circle cx="32" cy="32" r="31" fill="${bg}"/><ellipse cx="31" cy="53" rx="15" ry="3" fill="#3c483d" opacity=".08"/><path d="M40 14v22" fill="none" stroke="${ink}" stroke-width="5.5" stroke-linecap="round"/><path d="M40 14c8 1 10 5 10 9" fill="none" stroke="${ink}" stroke-width="5.5" stroke-linecap="round"/><ellipse cx="28" cy="39" rx="15" ry="12" transform="rotate(-12 28 39)" fill="${ink}"/><circle cx="23.5" cy="38.5" r="1.5" fill="#342d2b"/><circle cx="33" cy="37" r="1.5" fill="#342d2b"/><circle cx="19.5" cy="43" r="2" fill="${cheek}" opacity=".9"/><circle cx="36" cy="41" r="2" fill="${cheek}" opacity=".9"/><path d="M26 43c1.3 2 3.6 2 5 0" fill="none" stroke="#493731" stroke-width="1.4" stroke-linecap="round"/>${decorations[detail]}`;
  return svg;
}
