/* A clickable visual map synchronized with the already-tested wallet-stage inspector. */
(() => {
'use strict';
const buttons=[...document.querySelectorAll('[data-stage]')];
const progress=[...document.querySelectorAll('[data-timeline-stage]')];
if(!buttons.length||!progress.length)return;
const choose=stage=>{
 const target=buttons.find(b=>b.dataset.stage===stage);
 if(!target)return;target.click();
 progress.forEach(b=>{const active=b.dataset.timelineStage===stage;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 document.querySelector('.pipeline-card')?.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
};
progress.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.timelineStage)));
buttons.forEach(b=>b.addEventListener('click',()=>progress.forEach(t=>{const active=t.dataset.timelineStage===b.dataset.stage;t.classList.toggle('active',active);t.setAttribute('aria-pressed',String(active));})));
// Keep initial visual state without scrolling away from the hero.
})();
