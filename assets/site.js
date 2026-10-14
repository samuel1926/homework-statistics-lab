/* The catalog is the only place to edit when you add a new homework. */
const HOMEWORKS = [
 {id:'01',topic:'elliptic',eyebrow:'PUBLIC-KEY CRYPTOGRAPHY',title:'Elliptic-Curve Scalar Multiplication',summary:'Private key → Public key',description:'Visualize kG over F₁₇, animate point addition, follow binary double-and-add and examine the empirical distribution of public points.',tags:['ECC','Double-and-add','Statistical exploration'],url:'homeworks/hmwk-01/',short:'Q = kG',mode:'curve',chapters:'04',accent:'violet'},
 {id:'02',topic:'wallet',eyebrow:'ETHEREUM / KEY MANAGEMENT',title:'From Wallet Seed to Ethereum Address',summary:'Mnemonic → Checksummed address',description:'Explore the real BIP-39/32/44 pipeline, secp256k1, Keccak-256 and EIP-55 using reproducible public test vectors.',tags:['BIP-39 · BIP-32 · BIP-44','Keccak-256','EIP-55'],url:'homeworks/hmwk-02/',short:'0x',mode:'wallet',chapters:'06',accent:'mint'}
];
(() => {
'use strict';
const $ = id => document.getElementById(id);
const grid=$('homework-grid');
let filter='all';
const published=HOMEWORKS.length;
$('published-count').textContent=String(published).padStart(2,'0');
$('index-count').textContent=String(published).padStart(2,'0');
$('filter-count').textContent=String(published).padStart(2,'0');
function renderCards(){
 const query=$('homework-search').value.trim().toLowerCase();
 const records=HOMEWORKS.filter(h=>(filter==='all'||h.topic===filter)&&[h.id,h.title,h.summary,h.description,h.eyebrow,...h.tags].join(' ').toLowerCase().includes(query));
 const fragment=document.createDocumentFragment();
 for(const h of records){
  const article=document.createElement('article');article.className=`assignment assignment-${h.accent}`;
  article.innerHTML=`<div class="assignment-top"><span><span class="assignment-indicator"></span> HMWK / ${h.id}</span><span class="assignment-status">● COMPLETED</span></div>
   <div class="assignment-art ${h.mode}" aria-hidden="true"><div class="orbital orbital-a"></div><div class="orbital orbital-b"></div><span class="art-glyph">${h.short}</span><span class="art-caption">${h.eyebrow}</span><span class="art-ref">${h.mode==='curve'?'k ↦ (x, y)':'12 WORDS ↦ 0x…'}</span></div>
   <div class="assignment-body"><p class="assignment-eyebrow">${h.eyebrow}</p><h3>${h.title}</h3><p class="assignment-summary">${h.summary}</p><p class="assignment-description">${h.description}</p><div class="tags">${h.tags.map(t=>`<span>${t}</span>`).join('')}</div></div><div class="assignment-bottom"><span><strong>${h.chapters}</strong> LEARNING SECTIONS</span><a href="${h.url}" aria-label="Open Homework ${h.id}: ${h.title}">EXPLORE LAB <b>↗</b></a></div>`;
  fragment.append(article);
 }
 grid.replaceChildren(fragment);$('no-results').hidden=records.length>0;
}
$('homework-search').addEventListener('input',renderCards);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});renderCards();
}));
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();$('homework-search').focus();}});
renderCards();
// Independent toy-ECC preview: no private data, real wallet generation, or external dependency.
const p=17,base={x:1,y:5};
const mod=n=>((n%p)+p)%p;
function inverse(n){for(let i=1;i<p;i++)if(mod(n*i)===1)return i;throw Error('No inverse');}
function add(a,b){if(!a)return b;if(!b)return a;if(a.x===b.x&&mod(a.y+b.y)===0)return null;const doubled=a.x===b.x&&a.y===b.y;const slope=mod((doubled?3*a.x*a.x:b.y-a.y)*inverse(doubled?2*a.y:b.x-a.x));const x=mod(slope*slope-a.x-b.x);return{x,y:mod(slope*(a.x-x)-a.y)};}
function multiply(k){let r=null,b=base;while(k){if(k%2)r=add(r,b);b=add(b,b);k=Math.floor(k/2);}return r;}
const valid=[];for(let x=0;x<p;x++)for(let y=0;y<p;y++)if(mod(y*y)===mod(x*x*x+7))valid.push({x,y});
const svg=$('mini-curve'),NS='http://www.w3.org/2000/svg';
const s=(tag,attrs={},label)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(label!==undefined)n.textContent=label;return n;};
const ptX=x=>44+x*27.9,ptY=y=>256-y*13.8;
function renderPreview(){
 const k=Number($('demo-k').value),q=multiply(k);
 $('demo-k-text').textContent=`k = ${k}`;$('mini-private').textContent=String(k).padStart(2,'0');$('mini-public').textContent=q?`(${q.x}, ${q.y})`:'𝒪';$('mini-note').textContent=`${k}G = ${q?`(${q.x}, ${q.y})`:'𝒪'} · ${q?'valid point':'identity element (point at infinity)'}`;
 $('demo-k').style.setProperty('--slider-progress',`${((k-1)/16)*100}%`);
 const frag=document.createDocumentFragment();
 for(let v=0;v<=16;v+=2){frag.append(s('line',{x1:ptX(v),x2:ptX(v),y1:34,y2:256,class:'mini-gridline'}));frag.append(s('line',{x1:44,x2:490,y1:ptY(v),y2:ptY(v),class:'mini-gridline'}));if(v%4===0){frag.append(s('text',{x:ptX(v),y:277,class:'mini-axis','text-anchor':'middle'},String(v)));frag.append(s('text',{x:32,y:ptY(v)+4,class:'mini-axis','text-anchor':'end'},String(v)));}}
 for(const v of valid)frag.append(s('circle',{cx:ptX(v.x),cy:ptY(v.y),r:4.1,class:'mini-point'}));
 const route=[];for(let i=1;i<=k;i++){const r=multiply(i);if(r)route.push(r);else route.push(null);}
 let last=null;for(const point of route){if(last&&point)frag.append(s('line',{x1:ptX(last.x),y1:ptY(last.y),x2:ptX(point.x),y2:ptY(point.y),class:'mini-route'}));if(point)last=point;else last=null;}
 frag.append(s('circle',{cx:ptX(base.x),cy:ptY(base.y),r:12,class:'mini-base-halo'}));frag.append(s('circle',{cx:ptX(base.x),cy:ptY(base.y),r:6,class:'mini-base'}));frag.append(s('text',{x:ptX(base.x)+12,y:ptY(base.y)-9,class:'mini-label'},'G'));
 if(q){frag.append(s('circle',{cx:ptX(q.x),cy:ptY(q.y),r:17,class:'mini-target-halo'}));frag.append(s('circle',{cx:ptX(q.x),cy:ptY(q.y),r:7,class:'mini-target'}));frag.append(s('text',{x:ptX(q.x)+13,y:ptY(q.y)-13,class:'mini-target-label'},'Q = kG'));}
 svg.replaceChildren(frag);
}
$('demo-k').addEventListener('input',renderPreview);renderPreview();
})();
