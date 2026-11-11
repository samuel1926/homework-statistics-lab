/* SVG UI renderer for Lesson 5. Works on GitHub Pages or file:// without a backend. */
(() => {
'use strict';
const M=window.LabMath,R=window.CDF_REFERENCE;
const $=id=>document.getElementById(id);
const Ns=[15,31,63,127,255,511,1023], Bs=[8,16,32,64,128,256,512], Ms=[8,16,32,64,128,256,512,1024], Ks=[4,8,12,20,36,52,80];
const cyan='#6de6d7',purple='#b3a0ff',muted='#8196b0';
const fmt=(x,d=7)=>Number.isFinite(x)?(Math.abs(x)<1e-7&&x!==0?x.toExponential(2):x.toFixed(d)):'—';
const efmt=x=>Number.isFinite(x)?(x===0?'0':x.toExponential(2)):'n/a';
const svg=(id,body,caption='')=>{const el=$(id);el.setAttribute('viewBox','0 0 500 260');el.innerHTML=body; if(caption)el.setAttribute('aria-label',caption);};
const text=(x,y,value,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${value}</text>`;
const XY={left:48,right:483,top:20,bottom:222};
function frame(maxY=1,yMin=0,xLabels=['0','1'],yLabel=''){
  const {left,right,top,bottom}=XY;let html='';
  for(let i=0;i<=4;i++){
    const y=bottom-(bottom-top)*i/4;
    html+=`<line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="#25364b" stroke-dasharray="3 5"/>`;
    html+=text(left-8,y+4,fmt(yMin+(maxY-yMin)*i/4,2),'text-anchor="end" fill="#7188a4" font-size="10"');
  }
  html+=`<line x1="${left}" x2="${right}" y1="${bottom}" y2="${bottom}" stroke="#51617c"/>`;
  html+=text(left,244,xLabels[0],'fill="#8396b0" font-size="11"');
  html+=text(right,244,xLabels[1],'text-anchor="end" fill="#8396b0" font-size="11"');
  if(yLabel)html+=text(left,12,yLabel,'fill="#7188a4" font-size="9"');
  return html;
}
function chartDomain(id,n){
 const def=M.defs[id],a=def.a,b=def.b,{left,right,top,bottom}=XY,w=right-left,h=bottom-top;
 const cap=id==='singular'?5.0:id==='step13'?3.4:id==='thomae'?1.15:id==='dirichlet'?1.15:1.15;
 let html=frame(cap,0,[fmt(a,2),fmt(b,2)],'f(x)');
 const numBars=Math.min(70,n);
 for(let j=0;j<numBars;j++){
   const i=Math.round((j+.5)*n/numBars-.5);
   const mid=a+(i+.5)*(b-a)/n;
   const v=Math.min(cap,M.defs[id]?valAt(id,mid,i,n):0);
   const bh=v/cap*h;
   html+=`<rect x="${left+j*w/numBars+1}" y="${bottom-bh}" width="${Math.max(.5,w/numBars-2)}" height="${Math.max(0,bh)}" fill="${cyan}" opacity=".18"/>`;
 }
 if(id==='dirichlet'){
    html+=`<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="${purple}" stroke-width="3"/>`;
    for(let i=0;i<17;i++){const x=left+i*w/16;html+=`<circle cx="${x}" cy="${bottom-h/cap}" r="2.5" fill="${cyan}"/>`;}
    html+=text(180,top+13,'Rational samples = 1; a.e. value = 0','fill="#d2c7ff" font-size="10"');
 } else if(id==='thomae'){
    html+=`<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="${purple}" stroke-width="2"/>`;
    for(let q=1;q<=11;q++)for(let p=0;p<=q;p++){
       if(gcd(p,q)!==1)continue;
       const x=left+w*p/q,y=bottom-h*(1/q)/cap;
       html+=`<line x1="${x}" x2="${x}" y1="${bottom}" y2="${y}" stroke="${cyan}" stroke-width="1.5" opacity=".8"/>`;
    }
 } else {
    const p=[];
    for(let i=0;i<=290;i++){
      const x=a+(b-a)*(i/290),v=valAt(id,x,-1,n);
      const yy=bottom-h*Math.min(cap,Math.max(0,Number.isFinite(v)?v:cap))/cap;
      p.push(`${i?'L':'M'}${(left+w*i/290).toFixed(2)} ${yy.toFixed(2)}`);
    }
    html+=`<path d="${p.join(' ')}" fill="none" stroke="${cyan}" stroke-width="2.6" stroke-linecap="round"/>`;
 }
 svg('domain-chart',html,`Domain chart for ${def.formula}`);
 $('domain-note').textContent=id==='dirichlet'?'Every uniform midpoint is rational: the sample average is 1, but no Riemann integral exists.':id==='thomae'?'The dense rational spikes are schematic; irrational values are 0.':id==='singular'?'The unbounded endpoint is clipped in the plot (not in the midpoint calculation).':'Transparent bars: a representative view of the domain midpoint partition.';
}
function gcd(a,b){while(b){const t=a%b;a=b;b=t;}return a;}
function valAt(id,x,i,n){
 switch(id){case 'sin':return Math.sin(x);case 'square':return x*x;case 'step13':return x<.5?1:3;case 'absolute':return Math.abs(x-.5);case 'singular':return x>0?1/Math.sqrt(x):Infinity;case 'step10':return x<.5?1:0;case 'sinc':return M.sinc(x);case 'dirichlet':return 0;case 'thomae':return i>=0?gcd(2*i+1,2*n)/(2*n):0;}
}
function chartRange(id,B){
 const data=M.rangeLevelSets(id,B),src=data.levels,{left,right,top,bottom}=XY,w=right-left,h=bottom-top;
 const bars=[];
 if(src.length<=45){src.forEach(p=>bars.push(p));}
 else {
   const count=40;
   for(let j=0;j<count;j++){
     const slice=src.slice(Math.floor(j*src.length/count),Math.floor((j+1)*src.length/count));
     if(slice.length)bars.push({lo:slice[0].lo,hi:slice[slice.length-1].hi,mass:slice.reduce((a,v)=>a+v.mass,0)});
   }
 }
 const max=Math.max(.005,...bars.map(x=>x.mass))*1.13;
 const xLabels=data.kind==='geometric'?['1 (log levels)',`B = ${B}`]:src.length? [fmt(src[0].lo,2),fmt(src[src.length-1].hi,2)]:['0','1'];
 let html=frame(max,0,xLabels,'μ(preimage)');
 bars.forEach((point,j)=>{
   const bw=w/bars.length;
   const bh=Math.min(h,(point.mass/max)*h);
   html+=`<rect x="${left+j*bw+Math.min(3,bw*.13)}" y="${bottom-bh}" width="${Math.max(.5,bw-Math.min(6,bw*.26))}" height="${bh}" rx="2" fill="${purple}" opacity="${j%2===0?.78:.94}"/>`;
 });
 svg('range-chart',html,`Value partition and preimage measure for ${M.defs[id].formula}`);
 $('range-note').textContent=data.kind==='atoms'?'Two exact atom heights: their level-set masses sum to the interval length.':data.kind==='almost-everywhere'?'One atom of full measure at value 0. Nonzero values occur on a null set.':data.kind==='geometric'?'Geometric level bins. Tail x < 1/B² omitted; mass of tail = 1/B².':'Bars are level-set measures (consecutive bands grouped for readability).';
}
function convergenceChart(id,pairs,chartId,nonR=false){
 const {left,right,top,bottom}=XY,w=right-left,h=bottom-top;
 const colors=[cyan,purple],cols=[0,1];
 const logErr=v=>Math.log10(Math.max(v,1e-15));
 const errors=pairs.flatMap(p=>[p.rErr,p.lErr]).filter(Number.isFinite).map(logErr);
 const hi=Math.max(-6,...errors),lo=Math.min(-15,...errors);const topLog=Math.max(-.05,Math.ceil(hi));const bottomLog=Math.min(-15,Math.floor(lo));
 let html='';
 for(let i=0;i<=5;i++){
   const val=topLog+(bottomLog-topLog)*i/5,y=top+(bottom-top)*i/5;
   html+=`<line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="#25364b" stroke-dasharray="4 5"/>`;
   html+=text(left-7,y+4,`10^${val.toFixed(0)}`,'text-anchor="end" fill="#7188a4" font-size="10"');
 }
 html+=text(left,244,'15','fill="#8196b0" font-size="11"')+text(right,244,'1,023','fill="#8196b0" text-anchor="end" font-size="11"');
 for(const [column,color] of [[0,cyan],[1,purple]]){
   let d='';let segments=0;
   pairs.forEach((p,i)=>{
     const err=column===0?p.rErr:p.lErr;
     if(!Number.isFinite(err))return;
     const x=left+w*i/(pairs.length-1),y=top+(topLog-logErr(err))/(topLog-bottomLog)*(bottom-top);
     d+=`${segments?' L':'M'}${x.toFixed(1)},${y.toFixed(1)}`;segments++;
   });
   if(segments)html+=`<path d="${d}" fill="none" stroke="${color}" stroke-width="2.4"/><g fill="${color}">${pairs.map((p,i)=>{const err=column===0?p.rErr:p.lErr;if(!Number.isFinite(err))return '';const x=left+w*i/(pairs.length-1),y=top+(topLog-logErr(err))/(topLog-bottomLog)*(bottom-top);return `<circle cx="${x}" cy="${y}" r="3"/>`;}).join('')}</g>`;
 }
 if(nonR)html+=text(95,30,'No Riemann integral — midpoint errors are not defined','fill="#e5b0af" font-size="10"');
 svg(chartId,html,'Convergence plot on a logarithmic absolute-error scale');
}
function renderIntegral(){
 const id=$('fn-choice').value,n=Ns[Number($('n-slider').value)],B=Bs[Number($('b-slider').value)],D=M.defs[id];
 $('n-out').textContent=n.toLocaleString('en-US');$('b-out').textContent=B;
 const r=M.riemann(id,n),level=M.rangeLevelSets(id,B),l=level.estimate;
 $('true-val').textContent=fmt(D.exact,8);$('riemann-val').textContent=fmt(r,8);$('lebesgue-val').textContent=fmt(l,8);
 $('integrability').textContent=id==='dirichlet'?'Lebesgue only · Riemann does not exist':id==='singular'?'Improper Riemann & Lebesgue':'Riemann & Lebesgue';
 $('riemann-error').textContent=id==='dirichlet'?'Not an integral · rational samples':`Absolute error ${efmt(Math.abs(r-D.exact))}`;
 $('lebesgue-error').textContent=`Absolute error ${efmt(Math.abs(l-D.exact))}`;
 $('gap-val').textContent=fmt(Math.abs(r-l),7);$('gap-caption').textContent=id==='dirichlet'?'Sample mismatch, not integral mismatch':'|domain estimate − range estimate|';
 chartDomain(id,n);chartRange(id,B);
 let extra='';
 if(id==='dirichlet')extra='<strong>Key distinction:</strong> the midpoint algorithm always returns 1, but that is not the Riemann integral—the Riemann integral is undefined. Lebesgue integration returns 0 because rational points form a null set.';
 else if(id==='thomae'){const dar=M.thomaeUpper(n);extra=`<strong>Darboux certificate:</strong> lower sum = 0; upper sum ≤ ${fmt(dar.upper,6)} (enumerated denominators q ≤ ${dar.Q}; all larger denominators have height &lt; 1/${dar.Q+1}). This rigorous upper bound shrinks as the partition is refined.`;}
 else if(id==='singular')extra=`<strong>Improper endpoint:</strong> classical proper Riemann integrability does not apply. The range calculation excludes the tail x &lt; 1/B²; its exact missing integral is <strong>${fmt(level.residual,6)}</strong>. The estimator therefore approaches 2 from a truncated interval.`;
 else extra='<strong>Interpretation:</strong> this function is bounded and Riemann-integrable, so both mathematical integrals exist and agree. Error and rate of convergence still depend on the numerical approximation.';
 $('function-insight').innerHTML=`<strong>${D.label}:</strong> ${D.note}<br>${extra}<br><span style="color:#95a9c0">Range algorithm: ${level.description}</span>`;
 const perf=(fn)=>{fn();const ts=[];for(let j=0;j<4;j++){const start=performance.now();for(let i=0;i<3;i++)fn();ts.push((performance.now()-start)/3);}ts.sort((a,b)=>a-b);return ts[2];};
 const domainMs=perf(()=>M.riemann(id,n)),rangeMs=perf(()=>M.rangeLevelSets(id,B));
 const rangeWork=(id==='step13'||id==='step10'||id==='dirichlet'||id==='thomae')?'O(1) exact set measures':id==='sinc'?'O(B × 44) inverse-bisection steps':'O(B) level-set operations';
 $('integral-performance').innerHTML=`<strong>Measured computational cost:</strong> domain ${n} evaluations · ${domainMs.toFixed(3)} ms/call · O(N) <span class="note">vs.</span> range ${B} bands · ${rangeMs.toFixed(3)} ms/call · ${rangeWork}. <span class="note">Device-dependent timings; exact preimage formulas are assumed.</span>`;
 const pairs=Ns.map((nn,i)=>{const bb=Bs[i],rv=M.riemann(id,nn),lv=M.rangeLevelSets(id,bb).estimate;return {n:nn,b:bb,r:rv,l:lv,rErr:id==='dirichlet'?NaN:Math.abs(rv-D.exact),lErr:Math.abs(lv-D.exact)};});
 $('integral-rows').innerHTML=pairs.map(p=>`<tr><td>${p.n} / ${p.b}</td><td>${fmt(p.r,6)}</td><td>${fmt(p.l,6)}</td><td>${efmt(p.rErr)}</td><td class="good">${efmt(p.lErr)}</td></tr>`).join('');
 convergenceChart(id,pairs,'convergence-chart',id==='dirichlet');
 let c='';
 switch(id){
   case 'dirichlet':c='<strong>Different integrability:</strong> the Lebesgue integral equals 0, while the Riemann integral does not exist. Uniform rational midpoint samples remain 1 at every N; numerical sampling cannot certify integrability.';break;
   case 'thomae':c='<strong>Same integral despite dense spikes:</strong> both mathematical integrals equal 0. Rational midpoint samples tend to 0; the Darboux upper-sum certificate supplies a rigorous convergence argument beyond the sample points.';break;
   case 'singular':c='<strong>Same finite improper/Lebesgue value:</strong> both converge to 2, but the function is unbounded at 0, so it is not Riemann-integrable in the classical proper sense. Range truncation explicitly accounts for the missing near-zero contribution.';break;
   default:c='<strong>Same integral, different numerical errors:</strong> bounded Riemann-integrable functions have identical Lebesgue integrals. The domain and range estimators here converge towards the same reference, but their convergence speeds can differ substantially.';
 }
 $('integral-conclusion').innerHTML=c;
}
function renderGaussian(z){
 const {left,right,top,bottom}=XY,w=right-left,h=bottom-top,max=.44;
 let html=frame(max,0,['−6σ','+6σ'],'φ(x)');
 const xmap=x=>left+(x+6)/12*w,ymap=y=>bottom-M.normalPdf(y)*h/max;
 const paths=[];for(let i=0;i<=350;i++){let x=-6+12*i/350;paths.push([xmap(x),ymap(x),x]);}
 const cut=Math.max(-6,Math.min(6,z));
 const fill=paths.filter(v=>v[2]<cut);
 fill.push([xmap(cut),ymap(cut),cut]);
 let area=`M ${left} ${bottom} `+fill.map(a=>`L ${a[0].toFixed(2)} ${a[1].toFixed(2)}`).join(' ')+` L ${xmap(cut)} ${bottom} Z`;
 html+=`<path d="${area}" fill="${cyan}" opacity=".23"/>`;
 html+=`<path d="${paths.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')}" stroke="${cyan}" stroke-width="2.5" fill="none"/>`;
 const cX=xmap(cut);
 html+=`<line x1="${cX}" x2="${cX}" y1="${ymap(cut)}" y2="${bottom}" stroke="${purple}" stroke-dasharray="5 4" stroke-width="1.8"/>`;
 html+=`<circle cx="${cX}" cy="${ymap(cut)}" r="4" fill="${purple}"/>`;
 html+=text(Math.max(70,Math.min(445,cX+9)),Math.max(27,ymap(cut)-10),`z = ${z.toFixed(2)}`,'fill="#c7baff" font-size="10"');
 svg('gaussian-chart',html,`Normal PDF and filled area for cumulative probability at z = ${z}`);
}
function cdfVal(z){const key=z.toFixed(2);if(!(key in R))throw Error('Missing independent reference at '+key);return R[key];}
function renderNormal(skipTiming=false){
 const z=Number($('z-slider').value),m=Ms[Number($('m-slider').value)],k=Ks[Number($('k-slider').value)],reference=cdfVal(z);
 $('z-out').textContent=z.toFixed(2);$('m-out').textContent=m.toLocaleString('en-US');$('k-out').textContent=k;
 const rows=[['Trapezoidal',M.methods.trapezoid(z,m),`${m+1} evaluations`],['Simpson',M.methods.simpson(z,m),`${m+1} evaluations`],['Power series',M.methods.series(z,k),`${k} terms`],['erf approximation',M.methods.erfApprox(z),'constant work']];
 $('normal-reference').textContent=fmt(reference,10);$('normal-estimate').textContent=fmt(rows[1][1],10);$('normal-error').textContent=`Absolute error: ${efmt(Math.abs(rows[1][1]-reference))}`;
 $('normal-central').textContent=fmt(2*cdfVal(Math.abs(z))-1,8);
 $('cdf-method-rows').innerHTML=rows.map(([name,v,cost])=>{const err=Math.abs(v-reference);return `<tr><td>${name}</td><td class="${err<1e-8?'good':''}">${fmt(v,10)}</td><td class="${err>1e-4?'bad':''}">${efmt(err)}</td><td>${cost}</td></tr>`;}).join('');
 renderGaussian(z);
 const points=Ms.map(nn=>({n:nn,rErr:Math.abs(M.methods.simpson(z,nn)-reference),lErr:Math.abs(M.methods.trapezoid(z,nn)-reference)}));
 convergenceChart(null,points,'normal-convergence',false);
 // Update chart tick labels for panel count, rather than domain sizes.
 const el=$('normal-convergence'),s=el.innerHTML;el.innerHTML=s.replace(/>15<\/text>/g,'>8</text>').replace(/>1,023<\/text>/g,'>1,024</text>');
 if(!skipTiming)timings(z,m,k);
}
function benchmarkOne(fn,repeat){let sink=0;
 for(let i=0;i<100;i++)sink+=fn();
 const samples=[];
 for(let rep=0;rep<5;rep++){
  const t0=performance.now();for(let i=0;i<repeat;i++)sink+=fn();
  samples.push((performance.now()-t0)*1000/repeat);
 }
 samples.sort((a,b)=>a-b);
 return {value:samples[2],sink};
}
function timings(z,m,k){
 const funcs=[['Trapezoidal',()=>M.methods.trapezoid(z,m),m+1],['Simpson',()=>M.methods.simpson(z,m),m+1],['Power series',()=>M.methods.series(z,k),k],['erf approximation',()=>M.methods.erfApprox(z),'O(1)']];
 $('timings-rows').innerHTML=funcs.map(([label,fn,cost])=>{
   const time=benchmarkOne(fn,Math.max(120,Math.floor(150000/Math.max(50,Number(cost)||50)))).value;
   return `<tr><td>${label}</td><td>${fmt(time,3)} μs</td><td>${cost}</td></tr>`;
 }).join('');
}
function benchmarkTable(){
 const zs=[-4,-3,-2,-1,-.5,0,.5,1,2,3,4];
 $('reference-rows').innerHTML=zs.map(z=>{const ref=cdfVal(z),s=M.methods.simpson(z,256),e=M.methods.erfApprox(z);
   return `<tr><td>${z.toFixed(1)}</td><td>${fmt(ref,10)}</td><td>${fmt(s,10)}</td><td class="good">${efmt(Math.abs(s-ref))}</td><td>${efmt(Math.abs(e-ref))}</td></tr>`;
 }).join('');
}
function init(){
 $('fn-choice').addEventListener('change',renderIntegral);
 $('n-slider').addEventListener('input',renderIntegral);
 $('b-slider').addEventListener('input',renderIntegral);
 for(let id of ['z-slider','m-slider','k-slider'])$(id).addEventListener('input',()=>renderNormal(false));
 $('benchmark-button').addEventListener('click',()=>timings(Number($('z-slider').value),Ms[Number($('m-slider').value)],Ks[Number($('k-slider').value)]));
 renderIntegral();benchmarkTable();renderNormal();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
