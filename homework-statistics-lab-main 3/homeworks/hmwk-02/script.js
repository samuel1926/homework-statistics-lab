/* HMWK 02 — Client-side interface and statistical experiments. */
(() => {
  'use strict';
  const C=window.WalletLabCrypto;
  const $=id=>document.getElementById(id);
  const fixtures={
    hardhat:'test test test test test test test test test test test junk',
    bip39:'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  };
  const explanations={
    mnemonic:['Mnemonic sentence / BIP-39','A human-readable representation of wallet entropy (including mnemonic checksum bits). This is a publicly disclosed test phrase, not a secret.'],
    seed:['512-bit BIP-39 seed','The real 64-byte result of PBKDF2-HMAC-SHA512 using 2048 iterations, UTF-8 NFKD normalization and the salt "mnemonic" plus empty passphrase.'],
    private:['BIP-32 derived private key','The scalar k at the selected BIP-44 path. HMAC-SHA512 produces a hierarchy of child private keys and chain codes; the path alone does not generate randomness. This test key is public.'],
    public:['Uncompressed secp256k1 public key','Multiply the private scalar by the secp256k1 base point: Q = kG. Displayed as 64 bytes x‖y without the usual optional 0x04 uncompressed prefix.'],
    hash:['Keccak-256 → 20-byte address','Keccak-256 processes the 64 public-key coordinate bytes; the last 20 bytes of the 32-byte digest form the 160-bit Ethereum EOA address (before EIP-55 casing).'],
    checksum:['EIP-55 checksum address','Keccak-256 of the lowercase ASCII hex address chooses the uppercase/lowercase spelling of hexadecimal letters. This does not change the underlying 20 address bytes.']
  };
  let current=null;
  let commonCache=new Map();
  let addressCache=new Map();
  let running=false;
  let activeStage='checksum';
  let revealKey=false;
  const stageButtons=Array.from(document.querySelectorAll('[data-stage]'));
  const stages=['mnemonic','seed','private','public','hash','checksum'];
  const status=$('derive-status');
  const countSelect=$('sample-count');
  let analysisInProgress=false;

  function setStatus(text,error=false) { status.textContent=text;status.classList.toggle('error',error); }
  function truncatePrivate(key) { return key ? `0x${key.slice(0,8)} •••••••• ${key.slice(-8)}  [test key hidden]`: '—'; }
  function stagedValue(stage) {
    if(!current) return 'Awaiting experiment…';
    const {data,common,mnemonic}=current;
    switch(stage) {
      case 'mnemonic': return mnemonic;
      case 'seed': return '0x'+C.toHex(common.seed);
      case 'private': return revealKey ? '0x'+data.privateHex : truncatePrivate(data.privateHex);
      case 'public': return '0x'+data.publicHex;
      case 'hash': return `Keccak-256 digest:\n0x${data.digestHex}\n\nLast 20 bytes (raw address):\n${data.raw}`;
      case 'checksum': return data.checksummed;
      default: return '—';
    }
  }
  function renderStage(stage) {
    activeStage=stage;
    stageButtons.forEach(button=>{const selected=button.dataset.stage===stage;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
    const [name,text]=explanations[stage];
    $('stage-name').textContent=name;
    $('stage-explanation').textContent=text;
    $('stage-value').textContent=stagedValue(stage);
  }
  function updatePath() {
    const i=Number($('address-index').value);
    $('path-label').textContent=Number.isInteger(i)&&i>=0&&i<=20?`m/44'/60'/0'/0/${i}`:'Enter an index between 0 and 20';
  }
  async function getCommon(fixture) {
    if(!commonCache.has(fixture)) commonCache.set(fixture,await C.deriveCommon(fixtures[fixture]));
    return commonCache.get(fixture);
  }
  async function getAddress(fixture,index,common) {
    const key=fixture+':'+index;
    if(!addressCache.has(key)) addressCache.set(key,await C.deriveAddress(common,index));
    return addressCache.get(key);
  }
  async function derive() {
    if(running) return;
    const i=Number($('address-index').value),fixture=$('mnemonic-select').value;
    if(!Number.isInteger(i)||i<0||i>20) {setStatus('Choose a whole-number address index between 0 and 20.',true);return;}
    running=true;const button=$('derive-button');button.disabled=true;button.textContent='Deriving…';setStatus('Running PBKDF2, HD key derivation, point multiplication and Keccak-256…');
    try {
      // Yield to browser before synchronous BigInt operations to paint the progress state.
      await new Promise(resolve=>window.requestAnimationFrame(()=>window.requestAnimationFrame(resolve)));
      const common=await getCommon(fixture);
      const data=await getAddress(fixture,i,common);
      current={mnemonic:fixtures[fixture],common,data};
      revealKey=false;$('toggle-private').textContent='Show test private key';
      $('result-address').textContent=data.checksummed;
      $('preview-address').textContent=data.checksummed;
      $('copy-address').disabled=false;$('toggle-private').disabled=false;
      $('private-key-output').hidden=true;
      $('private-key-output').textContent='0x'+data.privateHex;
      $('address-valid').textContent='✓ EIP-55 VALID';
      $('checksum-input').value=data.checksummed;
      checkChecksum();
      renderStage(activeStage);
      setStatus(`✓ Address derived successfully via ${data.path}. No information leaves the browser.`);
    } catch(error) {setStatus(`Derivation failed: ${error.message}`,true);console.error(error);}
    finally {running=false;button.disabled=false;button.innerHTML='Run derivation <span>↗</span>';}
  }
  async function copyAddress() {
    if(!current) return;
    try {
      await navigator.clipboard.writeText(current.data.checksummed);
      $('copy-address').textContent='✓ Copied';window.setTimeout(()=>$('copy-address').textContent='Copy address',1500);
    } catch (_) { $('copy-address').textContent='Copy unavailable'; }
  }
  function togglePrivate() {
    if(!current) return;
    revealKey=!revealKey;
    $('private-key-output').hidden=!revealKey;
    $('toggle-private').textContent=revealKey?'Hide test private key':'Show test private key';
    renderStage(activeStage);
  }
  function fillHistogram(element,values,suffix='',percent=false) {
    element.replaceChildren();
    const max=Math.max(1,...values);
    const labels='0123456789ABCDEF';
    values.forEach((value,i)=>{
      const group=document.createElement('div');group.className='bar-col';
      const chart=document.createElement('span');chart.className='bar-column';
      chart.style.height=`${Math.max(2, value/max*100)}%`;
      const text=document.createElement('span');text.className='bar-label';text.textContent=labels[i];
      const info=percent?`${(value*100).toFixed(1)}%`:`${value}${suffix}`;
      group.title=`${i}: ${info}`;
      group.append(chart,text);element.append(group);
    });
  }
  function fillBitChart(container,values) {
    // 16 buckets, each averaging 10 of the 160 bit positions.
    const buckets=Array.from({length:16},(_,i)=>values.slice(i*10,(i+1)*10).reduce((a,b)=>a+b,0)/10);
    container.replaceChildren();
    for(let i=0;i<16;i++) {
      const group=document.createElement('div');group.className='bar-col';
      const bar=document.createElement('span');bar.className='bar-column purple-bar';bar.style.height=`${Math.max(2,buckets[i]*100)}%`;
      const text=document.createElement('span');text.className='bar-label';text.textContent=String(i+1);
      group.title=`Position group ${i+1} (${i*10}–${i*10+9}): ${(buckets[i]*100).toFixed(1)}% ones`;
      group.append(bar,text);container.append(group);
    }
  }
  async function analyze() {
    if(analysisInProgress) return;
    const fixture=$('mnemonic-select').value;
    const count=Number(countSelect.value);
    analysisInProgress=true;const button=$('analyze-button');button.disabled=true;
    const progress=$('statistics-status');progress.classList.remove('error');progress.textContent='Deriving sample addresses locally…';
    try {
      const common=await getCommon(fixture);
      const samples=[];
      for(let i=0;i<count;i++) {
        samples.push(await getAddress(fixture,i,common));
        if(i%4===3) {progress.textContent=`Computed ${i+1} of ${count} addresses…`;await new Promise(resolve=>setTimeout(resolve,0));}
      }
      const stats=C.analyzeAddresses(samples);
      $('metric-unique').textContent=`${stats.distinct} / ${stats.count}`;
      $('metric-ones').textContent=(stats.oneRatio*100).toFixed(2)+'%';
      $('metric-distance').textContent=stats.meanHamming===null?'n/a':`${stats.meanHamming.toFixed(1)} / 160`;
      fillHistogram($('nibble-chart'),stats.nibbleCounts);
      fillBitChart($('bit-chart'),stats.bitProportions);
      const tbody=$('sample-rows');tbody.replaceChildren();
      samples.forEach((s,i)=>{
        const tr=document.createElement('tr');
        const oneCount=Array.from(s.addressBytes).reduce((sum,b)=>{let x=b;while(x){sum+=x&1;x>>=1;}return sum;},0);
        const distance=i===0?'—':`${stats.distances[i-1]} / 160`;
        [String(i).padStart(2,'0'),s.checksummed,`${oneCount} / 160`,distance].forEach((value,j)=>{const td=document.createElement('td');td.textContent=value;if(j===1)td.className='addr-td';tr.append(td);});
        tbody.append(tr);
      });
      progress.textContent=`✓ ${count} addresses derived from the selected public mnemonic. All ${stats.distinct} observed addresses are distinct. This is an exploratory sample, not a cryptographic security proof.`;
    }catch(error){progress.classList.add('error');progress.textContent='Analysis failed: '+error.message;console.error(error);}
    finally{analysisInProgress=false;button.disabled=false;}
  }
  function hashes() {
    const text=$('hash-input').value;
    const bytes=C.utf8.encode(text);
    $('keccak-out').textContent='0x'+C.toHex(C.keccak256(bytes));
    $('sha3-out').textContent='0x'+C.toHex(C.sha3_256(bytes));
    if(!bytes.length){$('changed-out').textContent='Enter at least one character.';$('avalanche-result').textContent='—';return;}
    const changed=Uint8Array.from(bytes);changed[0]^=1;
    const original=C.keccak256(bytes),different=C.keccak256(changed);
    $('changed-out').textContent='0x'+C.toHex(different);
    $('avalanche-result').textContent=`${C.hamming(original,different)} / 256 digest bits changed`;
  }
  function checkChecksum() {
    const result=C.validateChecksum($('checksum-input').value);
    const output=$('checksum-state');
    output.textContent=(result.valid?'✓ ':'✕ ')+result.reason;
    output.classList.toggle('bad',!result.valid);
    $('corrected-address').textContent=result.normalized||'—';
  }
  stageButtons.forEach(btn=>btn.addEventListener('click',()=>renderStage(btn.dataset.stage)));
  $('derive-button').addEventListener('click',derive);
  $('copy-address').addEventListener('click',copyAddress);
  $('toggle-private').addEventListener('click',togglePrivate);
  $('address-index').addEventListener('input',updatePath);
  $('mnemonic-select').addEventListener('change',()=>setStatus('A different public test vector has been selected. Run derivation to refresh the result.'));
  $('analyze-button').addEventListener('click',analyze);
  $('checksum-input').addEventListener('input',checkChecksum);
  $('hash-input').addEventListener('input',hashes);
  updatePath();renderStage('checksum');hashes();checkChecksum();derive();
})();
