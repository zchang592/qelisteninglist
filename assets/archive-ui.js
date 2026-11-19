// UI-only deep links from the independent home page; the existing library owns selection.
window.addEventListener('DOMContentLoaded',()=>{
  const params=new URLSearchParams(location.search);
  if(params.get('view')==='player') return;
  const track=params.get('track');
  if(track && /^\d{1,3}$/.test(track) && document.getElementById(`track-${track}`)) {
    const search=document.getElementById('trackSearch');
    search.value=track;
    search.dispatchEvent(new Event('input'));
    return;
  }
  const value=params.get('period');
  if(value!==null && /^[0-5]$/.test(value))document.querySelector(`#periodNav [aria-controls="period-${value}"]`)?.click();
});
