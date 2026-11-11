/* Second interactive module — MSB double-and-add + statistical visual diagnostics.
   Uses the exact tested F17 point arithmetic already exported by script.js. */
(() => {
'use strict';
const E=window.ToyECC,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
if(!E||!$('binary-key'))return;
const svg=(tag,attrs={},txt)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(txt!==undefined)n.textContent=txt;return n;};
let steps=[],current=0,timer=null;
const K=() => Number($('binary-key').value);
const G={x:1,y:5};
const desc=E.describe;
function makeSteps(k){
 const bits=k.toString(2),entries=[];let r=null,opCount=0,doubles=0,adds=0;
 for(let i=0;i<bits.length;i++){
  const bit=Number(bits[i]),before=r;
  let afterDouble=before;
  let operation='LOAD',detail=`Initialize: R = G = ${desc(G)}`;
  if(i>0){afterDouble=E.add(before,before);doubles++;opCount++;operation='DOUBLE';detail=`2R = ${desc(afterDouble)}`;}
  r=afterDouble;
  if(bit===1){r=E.add(r,G);if(i>0){adds++;opCount++;}if(i===0){detail=`Start: 𝒪 + G = ${desc(r)}`;operation='INITIAL LOAD';} else{detail+=`  ·  +G = ${desc(r)}`;operation='DOUBLE + ADD';}}
  else {operation='DOUBLE ONLY';detail+=`  ·  bit 0 → skip addition`;}
  entries.push({index:i+1,bit,position:bits.length-i-1,operation,detail,result:r,before,afterDouble,opCount,doubles,adds});
 }
 return entries;
}
function stop(){if(timer)clearInterval(timer);timer=null;$('binary-run').textContent='▶ Run animation';}
function renderStep(){
 const k=K(),bits=k.toString(2),r=steps[current-1]?.result??null;
 $('binary-step').textContent=`Step ${current} / ${steps.length}`;
 $('binary-result').textContent=desc(r);
 $('binary-ops').textContent=String(steps[current-1]?.opCount??0);
 $('binary-doubles').textContent=String(steps[current-1]?.doubles??0);
 $('binary-adds').textContent=String(steps[current-1]?.adds??0);
 $('binary-final').textContent=`${k}G = ${desc(E.multiply(G,k))}`;
 $('binary-progress').style.width=`${steps.length?current/steps.length*100:0}%`;
 $('binary-explanation').textContent=current===0?'Press Step Forward to process the most significant binary digit.':'Bit '+steps[current-1].position+': '+steps[current-1].detail;
 $('binary-bitstrip').replaceChildren(...bits.split('').map((b,i)=>{const box=document.createElement('div');box.className='binary-bit'+(i===current-1?' active':'')+(i<current?' processed':'');const big=document.createElement('strong');big.textContent=b;const sm=document.createElement('small');sm.textContent='2^'+(bits.length-i-1);box.append(big,sm);return box;}));
 document.querySelectorAll('#binary-trace tbody tr').forEach((row,i)=>{row.classList.toggle('is-current',i===current-1);row.classList.toggle('is-future',i>=current);});
 $('binary-reset').disabled=current===0;$('binary-next').disabled=current===steps.length;
}
function render(){stop();const k=K();if(!Number.isSafeInteger(k)||k<1)return;
 steps=makeSteps(k);current=0;
 const ones=k.toString(2).split('1').length-1,bitLen=k.toString(2).length;
 const efficient=(bitLen-1)+(ones-1); // skips identity-group addition on first 1-bit
 $('binary-naive').textContent=(k-1).toLocaleString('en-US');$('binary-fast').textContent=String(efficient);
 $('binary-savings').textContent=(k>1?`${Math.max(0,(1-efficient/(k-1))*100).toFixed(1)}% fewer additions`:'Both methods use no group additions');
 $('binary-length').textContent=`${bitLen} bits · ${ones} ones`;
 const tbody=$('binary-trace').querySelector('tbody');tbody.replaceChildren();
 for(const entry of steps){const tr=document.createElement('tr');tr.tabIndex=0;tr.setAttribute('aria-label',`Show binary step ${entry.index}`);
  [String(entry.index),`bit ${entry.position} = ${entry.bit}`,entry.operation,desc(entry.result)].forEach((value,i)=>{const td=document.createElement('td');td.textContent=value;if(i===2)td.className='binary-operation';tr.append(td);});
  const jump=()=>{stop();current=entry.index;renderStep();};tr.addEventListener('click',jump);tr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();jump();}});tbody.append(tr);
 }
 renderStep();
}
$('binary-key').addEventListener('change',render);
$('binary-next').addEventListener('click',()=>{stop();current=Math.min(steps.length,current+1);renderStep();});
$('binary-reset').addEventListener('click',()=>{stop();current=0;renderStep();});
$('binary-run').addEventListener('click',()=>{if(timer){stop();return;}if(current>=steps.length)current=0;current++;renderStep();if(current<steps.length){$('binary-run').textContent='Ⅱ Pause';timer=setInterval(()=>{current++;renderStep();if(current>=steps.length)stop();},700);}});
render();
// Real-valued curve drawn only as a geometric comparison, not as a calculation on F17.
const real=$('real-curve-plot');function drawReal(){
 const frag=document.createDocumentFragment();const X=x=>75+(x+2.3)/8.8*565,Y=y=>268-y/19*219;
 for(let x=-2;x<=6;x+=2){frag.append(svg('line',{x1:X(x),y1:42,x2:X(x),y2:487,class:'real-grid'}));frag.append(svg('text',{x:X(x),y:510,'text-anchor':'middle',class:'real-axis'},x));}
 for(let y=-15;y<=15;y+=5){frag.append(svg('line',{x1:55,y1:Y(y),x2:655,y2:Y(y),class:'real-grid'}));frag.append(svg('text',{x:43,y:Y(y)+4,'text-anchor':'end',class:'real-axis'},y));}
 for(const sign of [1,-1]){let d='';for(let i=0;i<=550;i++){const x=-Math.cbrt(7)+(6.3+Math.cbrt(7))*i/550;const y=sign*Math.sqrt(Math.max(0,x*x*x+7));const py=Y(y);d+=(i===0?'M':'L')+X(x).toFixed(2)+' '+py.toFixed(2)+' ';}frag.append(svg('path',{d,fill:'none',stroke:sign===1?'#9c8eff':'#4edec8','stroke-width':3.5,'stroke-linecap':'round'}));}
 frag.append(svg('text',{x:325,y:36,'text-anchor':'middle',fill:'#abbad7','font-size':14},'Over ℝ: continuous curve, purely geometric illustration'));
 real.replaceChildren(frag);
}
drawReal();
document.querySelectorAll('[data-plot-mode]').forEach(button=>button.addEventListener('click',()=>{const isReal=button.dataset.plotMode==='real';$('finite-plot-wrap').hidden=isReal;$('real-plot-wrap').hidden=!isReal;document.querySelectorAll('[data-plot-mode]').forEach(b=>{b.classList.toggle('is-selected',b===button);b.setAttribute('aria-pressed',String(b===button));});$('plot-mode-note').textContent=isReal?'Real-number curve: continuous visualization only. Point arithmetic in this homework remains modulo 17.':'Finite field: only discrete points satisfying y² ≡ x³ + 7 (mod 17) exist.';}));
function drawSample(){
 const baseStr=$('base-select').value;
 const parts=baseStr.split(',').map(Number);const base=parts.length===2&&parts.every(Number.isFinite)?{x:parts[0],y:parts[1]}:G;
 if(!E.isOnCurve(base))return;
 const n=Number($('sample-count').value);
 const data=E.analyze(base,n),scatter=$('sample-scatter'),series=$('key-vs-x');
 if(!scatter||!series)return;
 const pts=data.finite;
 function makePlot(svgEl,what){const w=610,h=295,left=45,right=18,top=25,bottom=36;const X=x=>left+(w-left-right)*x/(what==='scatter'?16:Math.max(2,n));const Y=y=>h-bottom-(h-top-bottom)*y/16;
 const group=document.createDocumentFragment();for(let v=0;v<=16;v+=4){group.append(svg('line',{x1:left,x2:w-right,y1:Y(v),y2:Y(v),class:'data-gridline'}));group.append(svg('text',{x:left-11,y:Y(v)+4,'text-anchor':'end',class:'data-tick'},v));}
 const xMax=what==='scatter'?16:n;for(let v=0;v<=xMax;v+=(what==='scatter'?4:Math.max(1,Math.ceil(n/6)))){group.append(svg('text',{x:X(v),y:h-12,'text-anchor':'middle',class:'data-tick'},v));}
 for(const {k,point} of pts){const px=X(what==='scatter'?point.x:k),py=Y(what==='scatter'?point.y:point.x);const circle=svg('circle',{cx:px,cy:py,r:5,fill:what==='scatter'?'#5ceac8':'#8c80ff',stroke:'#121827','stroke-width':1.4,opacity:.85});circle.append(svg('title',{},`k=${k}: ${E.describe(point)}`));group.append(circle);}
 svgEl.replaceChildren(group);
 }
 makePlot(scatter,'scatter');makePlot(series,'key');
 $('scatter-caption').textContent=`${pts.length} finite outputs; ${data.infinityCount} identity elements omitted. Points P and −P share x.`;
 }
$('sample-count').addEventListener('input',drawSample);$('base-select').addEventListener('change',drawSample);drawSample();
// Keep section navigation visually synchronized with scroll position.
const targets=['playground','algorithm','binary-lab','statistics','discussion'];const links=[...document.querySelectorAll('.site-nav a[href^="#"]')];
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){links.forEach(link=>{const selected=link.getAttribute('href')==='#'+e.target.id;link.classList.toggle('nav-active',selected);if(selected)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}}},{rootMargin:'-20% 0px -66% 0px'});targets.map($).filter(Boolean).forEach(n=>observer.observe(n));}
})();
