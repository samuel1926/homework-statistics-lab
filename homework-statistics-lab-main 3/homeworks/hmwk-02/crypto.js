/*
 * HMWK 02 — Wallet standards learning laboratory
 * Standalone educational implementation: BIP-39/BIP-32/BIP-44,
 * secp256k1 public-point multiplication, Keccak-256, EIP-55.
 * Browser runtime: native Web Crypto HMAC-SHA512/PBKDF2; no CDNs or dependencies.
 * NEVER use this educational implementation to manage real funds or enter real secrets.
 */
((root) => {
  'use strict';
  const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
  const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
  const GX = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
  const GY = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
  const G = { x: GX, y: GY };
  const HARDENED = 0x80000000;
  const utf8 = new TextEncoder();
  const MASK64 = (1n << 64n) - 1n;
  const RC = [
    0x0000000000000001n,0x0000000000008082n,0x800000000000808an,0x8000000080008000n,
    0x000000000000808bn,0x0000000080000001n,0x8000000080008081n,0x8000000000008009n,
    0x000000000000008an,0x0000000000000088n,0x0000000080008009n,0x000000008000000an,
    0x000000008000808bn,0x800000000000008bn,0x8000000000008089n,0x8000000000008003n,
    0x8000000000008002n,0x8000000000000080n,0x000000000000800an,0x800000008000000an,
    0x8000000080008081n,0x8000000000008080n,0x0000000080000001n,0x8000000080008008n
  ];
  const ROT = [0,1,62,28,27,36,44,6,55,20,3,10,43,25,39,41,45,15,21,8,18,2,61,56,14];
  const mod = (a, m=P) => ((a % m) + m) % m;
  const rotr = (x, amount) => amount === 0 ? x : ((x << BigInt(amount)) | (x >> BigInt(64 - amount))) & MASK64;
  function keccakRound(state) {
    for (const roundConstant of RC) {
      const col = Array(5).fill(0n);
      for (let x=0;x<5;x++) for(let y=0;y<5;y++) col[x] ^= state[x+5*y];
      const d=col.map((_,x)=> col[(x+4)%5] ^ rotr(col[(x+1)%5],1));
      for (let x=0;x<5;x++) for(let y=0;y<5;y++) state[x+5*y] ^= d[x];
      const b=Array(25).fill(0n);
      for (let x=0;x<5;x++) for(let y=0;y<5;y++) b[y+5*((2*x+3*y)%5)] = rotr(state[x+5*y],ROT[x+5*y]);
      for (let x=0;x<5;x++) for(let y=0;y<5;y++) state[x+5*y]=(b[x+5*y] ^ ((~b[(x+1)%5+5*y]) & b[(x+2)%5+5*y])) & MASK64;
      state[0]^=roundConstant;
    }
  }
  function sponge256(input, domain) {
    const bytes = input instanceof Uint8Array ? input : Uint8Array.from(input);
    const rate=136;
    const blocks=Math.max(1,Math.ceil((bytes.length+1)/rate));
    const padded=new Uint8Array(blocks*rate);
    padded.set(bytes); padded[bytes.length]=domain; padded[padded.length-1]|=0x80;
    const state=Array(25).fill(0n);
    for (let start=0;start<padded.length;start+=rate) {
      for (let i=0;i<rate;i++) state[Math.floor(i/8)] ^= BigInt(padded[start+i])<<BigInt(8*(i%8));
      keccakRound(state);
    }
    const digest=new Uint8Array(32);
    for (let i=0;i<32;i++) digest[i]=Number((state[Math.floor(i/8)]>>BigInt(8*(i%8)))&255n);
    return digest;
  }
  const keccak256 = value => sponge256(value,0x01);
  const sha3_256 = value => sponge256(value,0x06);
  function fromHex(hex) {
    if (!/^(?:[0-9a-fA-F]{2})*$/.test(hex)) throw new Error('Invalid hex input');
    return Uint8Array.from(hex.match(/.{2}/g)||[],x=>parseInt(x,16));
  }
  const toHex = bytes => Array.from(bytes, b=>b.toString(16).padStart(2,'0')).join('');
  const concat = (...chunks) => Uint8Array.from(chunks.flatMap(x=>Array.from(x)));
  function bnBytes(value, length) {
    if(value<0n) throw new Error('Negative integer');
    return fromHex(value.toString(16).padStart(length*2,'0'));
  }
  const parseNum = bytes => BigInt('0x' + (toHex(bytes)||'00'));
  function int32(value) { return Uint8Array.from([(value>>>24)&255,(value>>>16)&255,(value>>>8)&255,value&255]); }
  function modInverse(a, n=P) {
    let [t,newT]=[0n,1n], [r,newR]=[n,mod(a,n)];
    while(newR!==0n) { const q=r/newR; [t,newT]=[newT,t-q*newT]; [r,newR]=[newR,r-q*newR]; }
    if(r!==1n) throw Error('Noninvertible field element');
    return mod(t,n);
  }
  function jacDouble(A) {
    if(A === null || A.y===0n) return null;
    const yy=mod(A.y*A.y), s=mod(4n*A.x*yy), m=mod(3n*A.x*A.x);
    const x=mod(m*m-2n*s), y=mod(m*(s-x)-8n*yy*yy), z=mod(2n*A.y*A.z);
    return {x,y,z};
  }
  function jacAddMixed(A,B) {
    if(A===null) return {x:B.x,y:B.y,z:1n};
    const zz=mod(A.z*A.z), u=mod(B.x*zz), v=mod(B.y*zz*A.z);
    const h=mod(u-A.x), r=mod(v-A.y);
    if(h===0n) return r===0n?jacDouble(A):null;
    const hh=mod(h*h), hhh=mod(hh*h), x1hh=mod(A.x*hh);
    return { x: mod(r*r-hhh-2n*x1hh), y:mod(r*(x1hh-mod(r*r-hhh-2n*x1hh))-A.y*hhh), z:mod(A.z*h) };
  }
  function publicPoint(k) {
    if(k<=0n || k>=N) throw new Error('Private scalar outside secp256k1 range');
    let a=null;
    for (const bit of k.toString(2)) {
      a=jacDouble(a);
      if(bit==='1') a=jacAddMixed(a,G);
    }
    if(!a) throw new Error('Point at infinity');
    const iz=modInverse(a.z), iz2=mod(iz*iz);
    return {x:mod(a.x*iz2),y:mod(a.y*iz2*iz)};
  }
  const uncompressedBytes = Q=> concat(bnBytes(Q.x,32),bnBytes(Q.y,32));
  const compressedBytes = Q=>concat(Uint8Array.of(Q.y&1n?3:2),bnBytes(Q.x,32));
  async function hmac512(key,data) {
    const c=globalThis.crypto;
    if (!c || !c.subtle) throw Error('Web Crypto unavailable. Open through HTTPS (GitHub Pages) or localhost.');
    const material=await c.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-512'},false,['sign']);
    return new Uint8Array(await c.subtle.sign('HMAC',material,data));
  }
  async function mnemonicToSeed(mnemonic,passphrase='') {
    const c=globalThis.crypto;
    if (!c || !c.subtle) throw Error('Web Crypto unavailable. Use HTTPS or localhost.');
    const normalizedMnemonic=mnemonic.normalize('NFKD');
    const salt=('mnemonic'+passphrase).normalize('NFKD');
    const material=await c.subtle.importKey('raw',utf8.encode(normalizedMnemonic),'PBKDF2',false,['deriveBits']);
    return new Uint8Array(await c.subtle.deriveBits({name:'PBKDF2',hash:'SHA-512',salt:utf8.encode(salt),iterations:2048},material,512));
  }
  async function seedToMaster(seed) {
    const i=await hmac512(utf8.encode('Bitcoin seed'),seed);
    const key=parseNum(i.slice(0,32));
    if(key===0n||key>=N) throw Error('Invalid master key');
    return {key,chain:i.slice(32)};
  }
  async function childPrivate(parent,index) {
    if(!Number.isSafeInteger(index)||index<0||index>0xffffffff) throw Error('Invalid child index');
    const payload=index>=HARDENED
      ? concat(Uint8Array.of(0),bnBytes(parent.key,32),int32(index))
      : concat(compressedBytes(publicPoint(parent.key)),int32(index));
    const i=await hmac512(parent.chain,payload);
    const a=parseNum(i.slice(0,32));
    const key=mod(a+parent.key,N);
    if(a>=N||key===0n) throw Error('Rare invalid BIP-32 child; choose next index');
    return {key,chain:i.slice(32)};
  }
  async function deriveCommon(mnemonic,passphrase='') {
    const seed=await mnemonicToSeed(mnemonic,passphrase);
    const master=await seedToMaster(seed);
    let node=master;
    const steps=[];
    for (const [name,index] of [['44\'',44+HARDENED],['60\'',60+HARDENED],['0\'',HARDENED],['0',0]]) {
      node=await childPrivate(node,index);
      steps.push({name,key:toHex(bnBytes(node.key,32)),chain:toHex(node.chain)});
    }
    return {seed,master,parent:node,steps};
  }
  function rawAddress(point) {
    return toHex(keccak256(uncompressedBytes(point)).slice(12));
  }
  function checksumAddress(input) {
    const addr=input.replace(/^0x/i,'').toLowerCase();
    if (!/^[0-9a-f]{40}$/.test(addr)) throw Error('Expected a 20-byte (40-character) hex address');
    const hash=toHex(keccak256(utf8.encode(addr)));
    return '0x'+addr.split('').map((c,i)=> parseInt(hash[i],16)>=8?c.toUpperCase():c).join('');
  }
  function validateChecksum(input) {
    const clean=input.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(clean)) return {valid:false,reason:'Enter 0x plus exactly 40 hexadecimal characters.'};
    const normalized=checksumAddress(clean);
    return {valid:clean===normalized,reason:clean===normalized?'Valid EIP-55 checksum':'Incorrect EIP-55 casing; see the corrected version.',normalized};
  }
  async function deriveAddress(common,index) {
    if(!Number.isInteger(index)||index<0||index>10000) throw Error('Invalid example account index');
    const child=await childPrivate(common.parent,index);
    const point=publicPoint(child.key);
    const raw=rawAddress(point);
    return {
      index,path:`m/44'/60'/0'/0/${index}`,
      privateHex:toHex(bnBytes(child.key,32)),
      chainHex:toHex(child.chain),
      publicHex:toHex(uncompressedBytes(point)),
      compressedHex:toHex(compressedBytes(point)),
      digestHex:toHex(keccak256(uncompressedBytes(point))),
      raw:'0x'+raw,
      checksummed:checksumAddress(raw),
      addressBytes:fromHex(raw)
    };
  }
  function hamming(a,b) {
    if(a.length!==b.length) throw Error('Length mismatch');
    let distance=0;
    for(let i=0;i<a.length;i++) {
      let d=a[i]^b[i];
      while(d){distance+=d&1;d>>=1;}
    }
    return distance;
  }
  function analyzeAddresses(items) {
    if(items.length===0) throw Error('No samples');
    const byteLength=items[0].addressBytes.length;
    const totalBits=byteLength*8;
    const nibble=Array(16).fill(0);
    const perBit=Array(totalBits).fill(0);
    let totalOnes=0;
    for(const item of items) {
      const bytes=item.addressBytes;
      for(let j=0;j<bytes.length;j++) {
        nibble[bytes[j]>>4]++;nibble[bytes[j]&15]++;
        for(let bit=0;bit<8;bit++) {
          const one=(bytes[j]>>(7-bit))&1;
          perBit[j*8+bit]+=one;
          totalOnes+=one;
        }
      }
    }
    const distances=[];
    for(let i=1;i<items.length;i++) distances.push(hamming(items[i-1].addressBytes,items[i].addressBytes));
    return {
      count:items.length,
      distinct:new Set(items.map(v=>v.raw)).size,
      oneRatio:totalOnes/(items.length*totalBits),
      nibbleCounts:nibble,
      bitProportions:perBit.map(v=>v/items.length),
      meanHamming:distances.length?distances.reduce((a,b)=>a+b,0)/distances.length:null,
      distances,
      totalBits
    };
  }
  const API=Object.freeze({ P,N,G,HARDENED,utf8,fromHex,toHex,mod,publicPoint,keccak256,sha3_256,checksumAddress,validateChecksum,mnemonicToSeed,seedToMaster,childPrivate,deriveCommon,deriveAddress,hamming,analyzeAddresses });
  if(typeof module!=='undefined'&&module.exports) module.exports=API;
  if(root) root.WalletLabCrypto=API;
})(typeof window==='undefined'?null:window);
