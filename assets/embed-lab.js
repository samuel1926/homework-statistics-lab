/* Isolated old exercises remain functional inside their one-page lesson. */
(function(){
  const params = new URLSearchParams(location.search);
  const embedded = params.has('embed') && window.parent !== window;
  if (!embedded){
    // Preserve original standalone experiments for teachers and direct links.
    return;
  }
  document.documentElement.classList.add('embedded');
  let scheduled = false, lastHeight = 0;
  const sendHeight = () => {
    scheduled = false;
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, document.body.offsetHeight);
    if (height > 0 && Math.abs(height - lastHeight) > 2){
      lastHeight = height;
      window.parent.postMessage({source:'statistics-lab-embed',type:'resize',height},location.origin);
    }
  };
  const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(sendHeight)}};
  window.addEventListener('load',()=>{schedule();setTimeout(schedule,250);setTimeout(schedule,1100)});
  window.addEventListener('resize',schedule);
  document.addEventListener('DOMContentLoaded',()=>{
    new ResizeObserver(schedule).observe(document.body);
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style','class']});
    schedule();
  });
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if (!link || link.getAttribute('href')==='#') return;
    const id=decodeURIComponent(link.getAttribute('href').slice(1));
    if (document.getElementById(id)){
      event.preventDefault();
      window.parent.postMessage({source:'statistics-lab-embed',type:'anchor',id},location.origin);
    }
  });
})();
