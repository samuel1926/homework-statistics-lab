/* Synchronize embedded experiment height and anchor navigation, same-origin only. */
(() => {
 const frames=[...document.querySelectorAll('.lesson-frame')];
 const frameByWindow = win => frames.find(f => f.contentWindow===win);
 window.addEventListener('message', event => {
   if(event.origin !== window.location.origin || !event.data || event.data.source!=='statistics-lab-embed') return;
   const frame=frameByWindow(event.source);
   if(!frame) return;
   if(event.data.type==='resize'){
     const height=Number(event.data.height);
     if(Number.isFinite(height)&&height>=500&&height<40000&&Math.abs(frame.getBoundingClientRect().height-height)>2){frame.style.height=`${Math.ceil(height+5)}px`}
   } else if(event.data.type==='anchor'){
     const id=String(event.data.id||'');
     const section=frame.contentDocument?.getElementById(id);
     if(!section) return;
     const y=window.scrollY+frame.getBoundingClientRect().top+section.getBoundingClientRect().top-115;
     window.scrollTo({top:y,behavior:'smooth'});
   }
 });
 // Trigger a size recheck when a lazy iframe enters the viewport.
 const observer = new IntersectionObserver(entries=>{
   for(const entry of entries){if(entry.isIntersecting){const f=entry.target;try{f.contentWindow?.dispatchEvent(new Event('resize'))}catch{}}}
 },{rootMargin:'400px'});
 frames.forEach(f=>{observer.observe(f);f.addEventListener('load',()=>{try{f.contentWindow?.dispatchEvent(new Event('resize'))}catch{}})});
})();
