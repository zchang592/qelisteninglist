const storage={get:key=>{try{return localStorage.getItem(key);}catch{return null;}},set:(key,value)=>{try{localStorage.setItem(key,value);}catch{}}};
let language=storage.get('qe-language')||'zh',theme=storage.get('qe-theme')||'light';
function render(){document.documentElement.lang=language==='en'?'en':'zh-CN';document.documentElement.dataset.theme=theme;document.getElementById('homeLanguage').textContent=language==='en'?'中':'EN';document.getElementById('homeTheme').setAttribute('aria-label',language==='en'?'Switch light and dark mode':'切换深浅色模式');document.querySelectorAll('[data-zh]').forEach(el=>{el.textContent=el.dataset[language];});}
document.getElementById('homeLanguage').addEventListener('click',()=>{language=language==='zh'?'en':'zh';storage.set('qe-language',language);render();});
document.getElementById('homeTheme').addEventListener('click',()=>{theme=theme==='light'?'dark':'light';storage.set('qe-theme',theme);render();});render();
