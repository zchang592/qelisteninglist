import { AVATAR_KEYS, avatarForUser, avatarName, noteAvatar } from './avatars.js';

const $=id=>document.getElementById(id);

export function createAccountController({getUser, updateProfile, openAuth, openAdmin, signOut}) {
  const menu=$('avatarMenu');
  const popover=$('avatarPopover');
  const trigger=$('avatarTrigger');
  const input=$('profileName');
  const grid=$('avatarGrid');
  let busy=false;
  let lastUser=null;
  let suppressFocusOpen=false;

  function setOpen(open) {
    if(menu.hidden) open=false;
    popover.hidden=!open;
    trigger.setAttribute('aria-expanded',String(open));
  }
  function message(value='',error=false) {
    $('profileMessage').textContent=value;
    $('profileMessage').classList.toggle('error',error);
  }
  function setBusy(value) {
    busy=value;
    grid.querySelectorAll('button').forEach(button=>{button.disabled=value;});
    $('profileSave').disabled=value;input.disabled=value;
  }
  function render() {
    const user=getUser();
    menu.hidden=!user;
    if(!user){lastUser=null;setOpen(false);message();return;}
    const key=avatarForUser(user);
    $('topAvatar').replaceChildren(noteAvatar(key));
    $('profileLargeAvatar').replaceChildren(noteAvatar(key));
    $('profileTitle').textContent=user.user_metadata?.display_name?.trim() || '听者';
    if(lastUser!==user.id) {input.value=user.user_metadata?.display_name || '';lastUser=user.id;message();}
    if(!grid.childElementCount) {
      for(const avatar of AVATAR_KEYS) {
        const button=document.createElement('button');button.type='button';button.className='avatar-option';
        button.dataset.avatarKey=avatar;button.setAttribute('aria-label',`选择${avatarName(avatar)}音符头像`);
        button.title=avatarName(avatar);button.append(noteAvatar(avatar));
        button.addEventListener('click',async()=>{
          if(busy || avatar===avatarForUser(getUser())) return;
          setBusy(true);message('正在保存头像…');
          try {await updateProfile({avatar_key:avatar});message('头像已更新');}
          catch(error){message(error.message || '头像保存失败，请重试。',true);}
          finally{setBusy(false);}
        });
        grid.append(button);
      }
    }
    grid.querySelectorAll('button').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.avatarKey===key));button.disabled=busy;
    });
  }
  menu.addEventListener('mouseenter',()=>setOpen(true));
  menu.addEventListener('mouseleave',event=>{if(!menu.contains(document.activeElement))setOpen(false);});
  menu.addEventListener('focusin',()=>{if(!suppressFocusOpen)setOpen(true);});
  menu.addEventListener('focusout',event=>{if(!menu.contains(event.relatedTarget) && !menu.matches(':hover'))setOpen(false);});
  menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();suppressFocusOpen=true;setOpen(false);trigger.focus();suppressFocusOpen=false;}});
  trigger.addEventListener('click',event=>{event.stopPropagation();setOpen(true);});
  document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))setOpen(false);});
  $('profileSettings').addEventListener('click',()=>{setOpen(false);openAuth();});
  $('profileAdminProgress').addEventListener('click',()=>{setOpen(false);openAdmin();});
  $('profileLogout').addEventListener('click',()=>{setOpen(false);signOut();});
  $('profileForm').addEventListener('submit',async event=>{
    event.preventDefault();if(busy) return;
    const name=input.value.trim();
    if(name.length<2 || name.length>40){message('昵称需要 2–40 个字。',true);input.focus();return;}
    if(name===(getUser()?.user_metadata?.display_name || '').trim()){message('昵称没有变化');return;}
    setBusy(true);message('正在保存昵称…');
    try {await updateProfile({display_name:name});input.value=name;message('昵称已更新');}
    catch(error){message(error.message || '昵称保存失败，请重试。',true);}
    finally {setBusy(false);}
  });
  return {render};
}
