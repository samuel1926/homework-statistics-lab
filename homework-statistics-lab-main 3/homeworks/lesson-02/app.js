import {P,N,G,hex,multiply,readScalar,encrypt,decrypt,onCurve,bruteForce,bsgs} from './crypto.js';
import {CORPORA} from './corpus.js';
const $=id=>document.getElementById(id);
const ALPHA='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const encoder=new TextEncoder();
let lastPayload=null, lastPlain='', currentPub=null, attacking=false, cancelRequested=false;
let benchmarkData=[];
const seeded=(initial)=>{let s=initial>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z]/g,'');
function caesar(text,key){const k=((Number(key)%26)+26)%26;return text.replace(/[A-Za-z]/g,c=>{let base=c<='Z'?65:97;return String.fromCharCode(base+(c.charCodeAt(0)-base+k)%26);});}
const counts=text=>{const c=Array(26).fill(0);for(const l of normalize(text))c[l.charCodeAt(0)-65]++;return c;};
const freqs=text=>{const c=counts(text),n=c.reduce((a,b)=>a+b,0);return c.map(v=>n?v/n:0);};
function entropy(text){const c=counts(text),n=c.reduce((s,v)=>s+v,0);return n?-c.reduce((s,v)=>v?s+v/n*Math.log2(v/n):s,0):0;}
const idxmax=a=>a.indexOf(Math.max(...a));
const fmt=n=>Number(n).toLocaleString('en-US');
const compact=h=>h.length>30?h.slice(0,18)+'…'+h.slice(-12):h;
function status(id,msg,kind='info'){const x=$(id);x.textContent=msg;x.dataset.kind=kind;}
function setText(id,value){$(id).textContent=value;}
function frequenciesFor(lang){const str=CORPORA[lang].training;const c=counts(str),len=c.reduce((a,b)=>a+b,0);return c.map(v=>Math.max(v/len,0.000001));}
function scores(cipher,language){
  const base=frequenciesFor(language),n=normalize(cipher).length;
  if(n===0)return [];
  const list=[];
  for(let key=0;key<26;key++){
    const candidate=caesar(cipher,-key),O=counts(candidate);
    let chi=0;for(let i=0;i<26;i++){const e=n*base[i];chi+=(O[i]-e)**2/e;}
    const peak=idxmax(O);
    list.push({key,chi,peak,candidate});
  }
  return list.sort((a,b)=>a.chi-b.chi);
}
function trigramModel(language){
  const plain=normalize(CORPORA[language].training),models=[];
  for(const order of [2,3]){
    const map=new Map();for(let i=0;i<=plain.length-order;i++){const k=plain.slice(i,i+order);map.set(k,(map.get(k)||0)+1);}
    const v=26**order,alpha=0.25,total=Math.max(1,plain.length-order+1);
    models.push({order,map,denom:Math.log(total+alpha*v),numerator:Math.log(alpha)});
  }
  return models;
}
const MODELS={en:trigramModel('en'),it:trigramModel('it')};
function ngramScore(text,lang){
  const normalized=normalize(text);let score=0;
  for(const m of MODELS[lang]){
    for(let i=0;i<=normalized.length-m.order;i++){
      const gram=normalized.slice(i,i+m.order);
      score+=(m.order===3?1:0.5)*((m.map.has(gram)?Math.log(m.map.get(gram)+0.25):m.numerator)-m.denom);
    }
  }
  return score;
}
function guesses(cipher,lang){
  const rank=scores(cipher,lang),bestPeak=idxmax(frequenciesFor(lang));
  const peakGuess=(idxmax(counts(cipher))-bestPeak+26)%26;
  let gram={key:0,score:-Infinity};
  for(let k=0;k<26;k++){const s=ngramScore(caesar(cipher,-k),lang);if(s>gram.score)gram={key:k,score:s};}
  return {chi:rank[0]?.key??0,peak:peakGuess,ngram:gram.key,rank};
}
function histogram(id,series,title){
  const root=$(id);root.replaceChildren();
  const top=document.createElement('div');top.className='freq-title';top.textContent=title;root.append(top);
  const wrap=document.createElement('div');wrap.className='histogram';
  series.forEach((v,i)=>{
    const item=document.createElement('div');item.className='hist-item';item.title=`${ALPHA[i]}: ${(v*100).toFixed(2)}%`;
    const bar=document.createElement('div');bar.className='hist-fill';bar.style.height=`${Math.min(100,v*550)}%`;
    const letter=document.createElement('span');letter.textContent=ALPHA[i];item.append(bar,letter);wrap.append(item);
  });root.append(wrap);
}
const getMessage=()=> $('message-input').value;
function updateCaesar(){
 const plain=getMessage(),key=Number($('caesar-key').value),c=caesar(plain,key);
 setText('caesar-key-out',key);setText('caesar-output',c||'Your ciphertext appears here.');setText('caesar-decrypted',caesar(c,-key)||'—');
 setText('entropy-plain',entropy(plain).toFixed(3));setText('entropy-caesar',entropy(c).toFixed(3));
 histogram('hist-original',freqs(plain),'Plaintext · letter frequencies');histogram('hist-caesar',freqs(c),'Caesar ciphertext · shifted frequencies');
 const target=$('analysis-cipher');if(!target.dataset.modified)target.value=c;
 setText('formula-example',`Eₖ(P)=(P+${key}) mod 26,   Dₖ(C)=(C−${key}) mod 26`);
}
function languageChanged(){const v=$('analysis-language').value;setText('corpus-length',fmt(normalize(CORPORA[v].training).length));setText('test-length',fmt(normalize(CORPORA[v].testing).length));histogram('hist-reference',frequenciesFor(v),`${CORPORA[v].label} · training reference distribution`);}
function runAnalysis(){
 const c=$('analysis-cipher').value,lang=$('analysis-language').value;if(!normalize(c).length){status('analysis-status','Please enter at least one letter.','error');return;}
 const a=guesses(c,lang);
 setText('recovered-key',a.chi);setText('recovered-text',caesar(c,-a.chi));setText('peak-key',a.peak);setText('ngram-key',a.ngram);
 const ranks=$('candidate-rows');ranks.replaceChildren();
 for(const r of a.rank.slice(0,5)){
   const tr=document.createElement('tr');
   for(const value of [r.key,r.chi.toFixed(2),r.candidate.slice(0,86)+(r.candidate.length>86?'…':'')]){
     const td=document.createElement('td');td.textContent=value;tr.append(td);
   }ranks.append(tr);
 }
 setText('analysis-n',normalize(c).length);status('analysis-status','Key estimate completed. For very short texts the best score may be incorrect.','success');
}
function wilson(s,n){if(!n)return [0,1];const z=1.96,p=s/n,den=1+z*z/n,c=(p+z*z/(2*n))/den,rad=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den;return [Math.max(0,c-rad),Math.min(1,c+rad)];}
function plotBenchmark(data){
  const wrap=$('benchmark-plot');wrap.replaceChildren();if(!data.length)return;
  const W=800,H=300,L=56,R=18,T=16,B=44;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('role','img');svg.setAttribute('aria-label','Empirical key recovery rates by ciphertext length');
  const add=(tag,attrs,text)=>{const el=document.createElementNS(svg.namespaceURI,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!=null)el.textContent=text;svg.append(el);return el;};
  const xpos=i=>L+(W-L-R)*(i/(data.length-1||1));const ypos=p=>T+(H-T-B)*(1-p);
  for(let q=0;q<=1;q+=.25){const y=ypos(q);add('line',{x1:L,x2:W-R,y1:y,y2:y,stroke:'#2d3a52','stroke-dasharray':'4 6'});add('text',{x:7,y:y+4,fill:'#99a8bd','font-size':12},`${Math.round(q*100)}%`);}
  data.forEach((d,i)=>{const x=xpos(i);add('text',{x,y:H-14,fill:'#99a8bd','text-anchor':'middle','font-size':12},String(d.length));});
  for(const [type,color] of [['chi','#68c2ff'],['ngram','#af91ff'],['peak','#ffba67']]){
    const path=data.map((d,i)=>`${i===0?'M':'L'}${xpos(i)},${ypos(d[type]/d.trials)}`).join(' ');
    add('path',{d:path,fill:'none',stroke:color,'stroke-width':3,'stroke-linejoin':'round'});
    data.forEach((d,i)=>{const circle=add('circle',{cx:xpos(i),cy:ypos(d[type]/d.trials),r:5,fill:color});const title=document.createElementNS(svg.namespaceURI,'title');title.textContent=`${type}: ${d.length} letters, ${(100*d[type]/d.trials).toFixed(1)}%`;circle.append(title);});
  }
  wrap.append(svg);
}
function benchmarkConclusion(data){
 if(!data.length)return;
 const first=data[0],last=data[data.length-1];const pct=(n,d)=>`${(100*n/d).toFixed(1)}%`;
 const bestKey=['chi','ngram','peak'].sort((a,b)=>last[b]-last[a])[0];
 setText('benchmark-conclusion',`Measured on held-out text: chi-square recovery increased from ${pct(first.chi,first.trials)} at N=${first.length} to ${pct(last.chi,last.trials)} at N=${last.length}. For the largest sample, the strongest of the tested estimators was ${bestKey==='chi'?'chi-square':bestKey==='ngram'?'n-gram scoring':'peak-frequency matching'} (${pct(last[bestKey],last.trials)}). These observations depend on the selected corpus, sampling method and random seed; they are not universal success probabilities.`);
}
async function runBenchmark(){
 const btn=$('run-benchmark');btn.disabled=true;const lang=$('analysis-language').value,held=normalize(CORPORA[lang].testing);
 const requested=Number($('benchmark-trials').value),ntrials=Number.isFinite(requested)?Math.min(100,Math.max(5,Math.floor(requested))):30;
 const rng=seeded(20261021);const lengths=[20,40,80,160,320,640,1000].filter(n=>n<=held.length);
 benchmarkData=[];setText('benchmark-trials-label',ntrials);
 try{
  for(let j=0;j<lengths.length;j++){
    const len=lengths[j],result={length:len,trials:ntrials,chi:0,ngram:0,peak:0,chiCI:null};
    for(let t=0;t<ntrials;t++){
      const off=Math.floor(rng()*(held.length-len+1)),key=1+Math.floor(rng()*25);
      const sample=caesar(held.slice(off,off+len),key),a=guesses(sample,lang);
      if(a.chi===key)result.chi++;if(a.ngram===key)result.ngram++;if(a.peak===key)result.peak++;
    }
    result.chiCI=wilson(result.chi,ntrials);benchmarkData.push(result);
    plotBenchmark(benchmarkData);renderBenchmarkTable(benchmarkData);
    status('benchmark-status',`Completed ${j+1} of ${lengths.length} sample sizes. Each size used ${ntrials} independent key draws.`, 'info');
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  benchmarkConclusion(benchmarkData);
  status('benchmark-status',`Finished: ${fmt(ntrials*lengths.length)} real encryption/attack trials (fixed random seed for reproducibility).`,'success');
 }catch(e){status('benchmark-status',e.message,'error');}finally{btn.disabled=false;}
}
function renderBenchmarkTable(data){const body=$('benchmark-rows');body.replaceChildren();for(const row of data){const tr=document.createElement('tr');const pc=n=>`${(100*n/row.trials).toFixed(1)}%`;for(const val of [row.length,`${row.chi}/${row.trials} (${pc(row.chi)})`,pc(row.ngram),pc(row.peak),`${(100*row.chiCI[0]).toFixed(1)}–${(100*row.chiCI[1]).toFixed(1)}%`]){const td=document.createElement('td');td.textContent=val;tr.append(td);}body.append(tr);}}
function publicPreview(){
 try{const d=readScalar($('ecc-secret').value,1n,50000n);currentPub=multiply(d);setText('ecc-public-x',compact(hex(currentPub.x)));setText('ecc-public-y',compact(hex(currentPub.y)));setText('ecc-public-full',`Q = (${hex(currentPub.x)}, ${hex(currentPub.y)})`);status('ecc-status',`Valid toy key: d=${d}. Q=dG computed on the real secp256k1 curve.`,'success');}
 catch(e){currentPub=null;status('ecc-status',e.message,'error');setText('ecc-public-x','—');setText('ecc-public-y','—');}
}
async function doEncrypt(){
 try{const d=readScalar($('ecc-secret').value,1n,50000n);const msg=getMessage();if(!msg)throw Error('Enter a plaintext message first.');
  const Q=multiply(d);status('ecc-status','Computing ephemeral ECDH point and SHA-256 keystream…');lastPayload=await encrypt(msg,Q);lastPlain=msg;
  $('ecc-payload').value=JSON.stringify(lastPayload,null,2);setText('ecc-ephemeral',compact(lastPayload.R.x));setText('ecc-bytes',encoder.encode(msg).length);setText('ecc-cipher-bytes',atob(lastPayload.ciphertext).length);setText('ecc-decrypted','—');status('ecc-status','Fresh ephemeral scalar generated securely. Ciphertext ready; no private key is included.','success');
 }catch(e){status('ecc-status',e.message,'error');}}
async function doDecrypt(){try{const d=readScalar($('ecc-decrypt-key').value,1n,50000n);const bundle=JSON.parse($('ecc-payload').value);const plain=await decrypt(bundle,d);setText('ecc-decrypted',plain);status('ecc-status','Decryption completed. Note: XOR masking is unauthenticated; matching keys do not prove message integrity.','success');}catch(e){setText('ecc-decrypted','—');status('ecc-status',`Decryption failed: ${e.message}`,'error');}}
async function runAttack(){
 if(attacking)return;
 try{
  const target=readScalar($('attack-target').value,1n,50000n),bound=Number($('attack-bound').value);
  if(!Number.isInteger(bound)||bound<1||bound>50000)throw Error('Attack bound must be an integer between 1 and 50,000.');
  attacking=true;cancelRequested=false;$('attack-go').disabled=true;$('attack-stop').disabled=false;
  setText('attack-result','Searching…');setText('attack-time','—');setText('attack-ops','—');setText('attack-recovered','—');
  const Q=multiply(target);setText('attack-public',compact(hex(Q.x)));
  const onProgress=(done,total)=>{const percentage=Math.min(100,100*done/Math.max(1,total));$('attack-progress').style.width=percentage.toFixed(1)+'%';status('attack-status',`Executing curve operations: ${fmt(done)} / ${fmt(total)} steps (${percentage.toFixed(0)}%).`);};
  const result=$('attack-method').value==='bsgs'?await bsgs(Q,bound,onProgress,()=>cancelRequested):await bruteForce(Q,bound,onProgress,()=>cancelRequested);
  $('attack-progress').style.width='100%';setText('attack-result',result.key??'Not found');setText('attack-ops',fmt(result.checks));setText('attack-time',`${result.ms.toFixed(1)} ms`);
  setText('attack-recovered',result.key!=null?'Verified: recoveredKey × G = publicKey':'No matching candidate within searched interval');
  status('attack-status',result.key!=null?`${result.algorithm}: private key recovered by actual secp256k1 point calculations.`:'Key is outside the assumed range. This is a failed attack, not evidence of security.',result.key!=null?'success':'error');
  if(result.key!=null && lastPayload && Number(target)===Number($('ecc-secret').value)){
   try{const recovered=await decrypt(lastPayload,BigInt(result.key));setText('attack-decrypted',recovered);}catch{setText('attack-decrypted','Ciphertext changed or does not match the target key.');}
  }else setText('attack-decrypted','Encrypt in the ECC lab with the same private key to demonstrate message recovery.');
 }catch(e){status('attack-status',e.message,e.message.includes('interrupted')?'info':'error');}
 finally{attacking=false;$('attack-go').disabled=false;$('attack-stop').disabled=true;}
}
function updateComplexity(){const bits=Number($('complexity-bits').value),rate=Number($('complexity-rate').value),t=2**(bits/2),years=t/(rate*86400*365.25);
 setText('complexity-bits-value',bits);setText('complexity-order',`≈ 2^${Math.round(bits/2)} ≈ ${t.toExponential(2)} group operations`);setText('complexity-years',years<1/365.25?`${(years*365.25*86400).toExponential(2)} seconds`:years<1?`${(years*365.25).toFixed(2)} days`:`${years.toExponential(2)} years`);
 setText('complexity-note',`Illustration: generic square-root ECDLP attack at an assumed ${fmt(rate)} group operations/second. Operation speed and implementation costs are hypothetical; this is an order-of-magnitude model, not a measured cracking time.`);
}
function setupNav(){
 const links=[...document.querySelectorAll('.side-nav a[href^="#"]')];
 for(const a of links)a.addEventListener('click',()=>{document.querySelector('.side-nav')?.classList.remove('nav-open');});
 const observer=new IntersectionObserver(entries=>{entries.forEach(x=>{if(x.isIntersecting){links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+x.target.id));}});},{rootMargin:'-15% 0px -75% 0px'});
 document.querySelectorAll('main section[id]').forEach(s=>observer.observe(s));
 $('menu-toggle').addEventListener('click',()=>document.querySelector('.side-nav').classList.toggle('nav-open'));
}
function wire(){
 setupNav();$('message-input').addEventListener('input',updateCaesar);$('caesar-key').addEventListener('input',updateCaesar);
 $('analysis-language').addEventListener('change',languageChanged);$('analysis-cipher').addEventListener('input',()=>{$('analysis-cipher').dataset.modified='yes'});
 $('analysis-from-caesar').addEventListener('click',()=>{$('analysis-cipher').value=caesar(getMessage(),$('caesar-key').value);$('analysis-cipher').dataset.modified='yes';runAnalysis();});
 $('analyze-button').addEventListener('click',runAnalysis);$('run-benchmark').addEventListener('click',runBenchmark);
 $('ecc-secret').addEventListener('change',()=>{publicPreview();$('ecc-decrypt-key').value=$('ecc-secret').value;$('attack-target').value=$('ecc-secret').value;});
 $('ecc-encrypt').addEventListener('click',doEncrypt);$('ecc-decrypt').addEventListener('click',doDecrypt);
 $('attack-go').addEventListener('click',runAttack);$('attack-stop').addEventListener('click',()=>{cancelRequested=true});
 $('complexity-bits').addEventListener('input',updateComplexity);$('complexity-rate').addEventListener('change',updateComplexity);
 $('tamper-payload').addEventListener('click',()=>{try{
   const obj=JSON.parse($('ecc-payload').value);
   if(!obj.ciphertext)throw Error('Encrypt a message first.');
   const binary=atob(obj.ciphertext);if(!binary.length)throw Error('Cannot tamper with an empty ciphertext.');
   const changed=String.fromCharCode(binary.charCodeAt(0)^1)+binary.slice(1);
   obj.ciphertext=btoa(changed);$('ecc-payload').value=JSON.stringify(obj,null,2);
   status('ecc-status','First ciphertext bit flipped; decrypt to observe the unauthenticated modification.','info');
  }catch(e){status('ecc-status',e.message,'error');}});
 $('copy-payload').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('ecc-payload').value);status('ecc-status','Payload copied.','success');}catch(e){status('ecc-status','Clipboard unavailable. Select and copy the JSON manually.','error');}});
 setText('year',new Date().getFullYear());updateCaesar();languageChanged();publicPreview();updateComplexity();
 status('benchmark-status','Click Run experiment to generate empirical data on the held-out corpus.');
}
wire();
// Export pure helpers to facilitate unit testing in Node via source transformation.
export {caesar,counts,freqs,entropy,guesses,wilson,normalize};
