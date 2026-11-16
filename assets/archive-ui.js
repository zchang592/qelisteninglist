// UI-only deep links from the independent home page; the existing library owns selection.
window.addEventListener('DOMContentLoaded',()=>{
  const value=new URLSearchParams(location.search).get('period');
  if(value!==null && /^[0-5]$/.test(value))document.querySelector(`#periodNav [aria-controls="period-${value}"]`)?.click();
});
