// Standalone, dependency-free secp256k1 implementation using BigInt.
// Educational code only. Do not use as a production cryptography library.
export const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
export const N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
export const G = Object.freeze({
  x: 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n,
  y: 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n
});
const Z = null; // Infinity in affine coordinates
const JJ = () => ({X:0n,Y:1n,Z:0n}); // Infinity in Jacobian coordinates
export function mod(a,m=P) {const r=a%m; return r<0n?r+m:r;}
export function inverse(a,m=P) {
  a=mod(a,m); if(a===0n) throw Error('Division by zero');
  let t=0n, nt=1n, r=m, nr=a;
  while(nr!==0n){ const q=r/nr; [t,nt]=[nt,t-q*nt]; [r,nr]=[nr,r-q*nr]; }
  if(r!==1n) throw Error('No modular inverse');
  return mod(t,m);
}
export function onCurve(a) {return a!==null && a.x>=0n && a.x<P && a.y>=0n && a.y<P && mod(a.y*a.y)===mod(a.x*a.x*a.x+7n);}
export function toJac(a){return a===null?JJ():{X:a.x,Y:a.y,Z:1n};}
export function toAffine(a){
  if(a.Z===0n)return Z;
  const iz=inverse(a.Z),z2=mod(iz*iz);
  return {x:mod(a.X*z2),y:mod(a.Y*z2*iz)};
}
export function doubleJ(a){
  if(a.Z===0n || a.Y===0n)return JJ();
  const A=mod(a.X*a.X),B=mod(a.Y*a.Y),C=mod(B*B);
  const D=mod(2n*(mod((a.X+B)*(a.X+B))-A-C));
  const E=mod(3n*A),F=mod(E*E);
  const X=mod(F-2n*D),Y=mod(E*(D-X)-8n*C),z=mod(2n*a.Y*a.Z);
  return {X,Y,Z:z};
}
export function addJ(a,b){
  if(a.Z===0n)return {...b};if(b.Z===0n)return {...a};
  const z1z1=mod(a.Z*a.Z),z2z2=mod(b.Z*b.Z);
  const u1=mod(a.X*z2z2),u2=mod(b.X*z1z1);
  const s1=mod(a.Y*b.Z*z2z2),s2=mod(b.Y*a.Z*z1z1);
  if(u1===u2){return s1===s2?doubleJ(a):JJ();}
  const h=mod(u2-u1),r=mod(s2-s1),h2=mod(h*h),h3=mod(h2*h),u1h2=mod(u1*h2);
  const X=mod(r*r-h3-2n*u1h2);
  const Y=mod(r*(u1h2-X)-s1*h3);
  const z=mod(h*a.Z*b.Z);
  return {X,Y,Z:z};
}
export function multiply(k,point=G){
  k=BigInt(k);if(k<0n || k>=N)throw Error('Scalar outside [0, n)');
  if(!onCurve(point))throw Error('Point is not on secp256k1');
  let a=JJ(),b=toJac(point);
  while(k){if(k&1n)a=addJ(a,b);b=doubleJ(b);k>>=1n;}
  return toAffine(a);
}
export function equalsJToAffine(j,a){
  if(j.Z===0n || a===null)return j.Z===0n&&a===null;
  const z2=mod(j.Z*j.Z);
  return mod(a.x*z2)===j.X && mod(a.y*z2*j.Z)===j.Y;
}
export const hex = n => n.toString(16).padStart(64,'0');
export const pointKey = p => p===null?'INF':hex(p.x)+hex(p.y);
export function readScalar(v,min=1n,max=N-1n){
  if(!/^\s*(?:0x[\da-f]+|\d+)\s*$/i.test(String(v)))throw Error('Enter a valid integer (decimal or 0x hex).');
  const k=BigInt(v.trim());if(k<min||k>max)throw Error(`Scalar must be between ${min} and ${max}.`);return k;
}
function bigBytes(n){const out=new Uint8Array(32);for(let i=31;i>=0;i--){out[i]=Number(n&255n);n>>=8n;}return out;}
function concat(...buffers){let len=buffers.reduce((s,a)=>s+a.length,0);let out=new Uint8Array(len),i=0;for(const a of buffers){out.set(a,i);i+=a.length;}return out;}
const enc = new TextEncoder();
function randomScalar(){let n;do{const b=new Uint8Array(32);crypto.getRandomValues(b);n=0n;for(const v of b)n=(n<<8n)+BigInt(v);}while(n===0n||n>=N);return n;}
async function digest(b){return new Uint8Array(await crypto.subtle.digest('SHA-256',b));}
async function mask(shared,R,size){
  const seed=concat(bigBytes(shared.x),bigBytes(shared.y),bigBytes(R.x),bigBytes(R.y));
  const blocks=[];let written=0;
  for(let counter=0;written<size;counter++){
    if(counter>100000)throw Error('Message too large');
    const c=new Uint8Array([counter>>>24,(counter>>>16)&255,(counter>>>8)&255,counter&255]);
    const block=await digest(concat(enc.encode('STATISTICS-HMWK3-EDU-V1'),seed,c));
    blocks.push(block);written+=block.length;
  }
  return concat(...blocks).slice(0,size);
}
function base64(bytes){let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary);}
function fromBase64(s){if(!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length%4!==0)throw Error('Invalid base64');return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
export async function encrypt(message,Q){
  if(!onCurve(Q))throw Error('Invalid public key');
  if(!crypto?.subtle)throw Error('HTTPS is required for browser SHA-256 (Web Crypto).');
  const r=randomScalar(),R=multiply(r,G),shared=multiply(r,Q);
  const bytes=enc.encode(message);if(bytes.length>16000)throw Error('Max 16KB for this demonstration.');
  const pad=await mask(shared,R,bytes.length),cipher=bytes.map((v,i)=>v^pad[i]);
  return {version:'edu-ecdh-xor-v1',R:{x:hex(R.x),y:hex(R.y)},ciphertext:base64(cipher)};
}
export async function decrypt(bundle,d){
  if(bundle.version!=='edu-ecdh-xor-v1')throw Error('Unknown payload version');
  if(!/^[0-9a-f]{64}$/i.test(bundle.R?.x)||!/^[0-9a-f]{64}$/i.test(bundle.R?.y))throw Error('Invalid ephemeral point');
  const R={x:BigInt('0x'+bundle.R.x),y:BigInt('0x'+bundle.R.y)};
  if(!onCurve(R))throw Error('Ephemeral point is not on the curve');
  const shared=multiply(d,R),c=fromBase64(bundle.ciphertext),pad=await mask(shared,R,c.length);
  return new TextDecoder('utf-8',{fatal:true}).decode(c.map((v,i)=>v^pad[i]));
}
export async function bruteForce(Q,bound,onProgress=()=>{},signal=()=>false){
  let state=JJ(),checks=0;const started=performance.now();
  for(let d=1;d<=bound;d++){
    if(signal())throw Error('Attack interrupted');
    state=addJ(state,toJac(G));checks++;
    if(equalsJToAffine(state,Q))return {key:d,checks,ms:performance.now()-started,algorithm:'Sequential exhaustive search'};
    if(d%100===0){onProgress(d,bound);await new Promise(resolve=>setTimeout(resolve,0));}
  }
  return {key:null,checks,ms:performance.now()-started,algorithm:'Sequential exhaustive search'};
}
export async function bsgs(Q,bound,onProgress=()=>{},signal=()=>false){
  const m=Math.ceil(Math.sqrt(bound+1)),started=performance.now();
  let baby=JJ(),babyTable=new Map(),checks=0;
  for(let i=0;i<m;i++){
    if(signal())throw Error('Attack interrupted');
    babyTable.set(pointKey(toAffine(baby)),i);baby=addJ(baby,toJac(G));checks++;
    if(i%80===0){onProgress(i,m*2);await new Promise(resolve=>setTimeout(resolve,0));}
  }
  const step=multiply(BigInt(m),G);
  const minus={x:step.x,y:mod(-step.y)};
  let giant=toJac(Q);
  for(let j=0;j<=m;j++){
    if(signal())throw Error('Attack interrupted');
    const key=pointKey(toAffine(giant));checks++;
    if(babyTable.has(key)){
      const d=j*m+babyTable.get(key);
      if(d>=1&&d<=bound)return {key:d,checks,ms:performance.now()-started,algorithm:'Baby-step giant-step',memory:babyTable.size};
    }
    giant=addJ(giant,toJac(minus));
    if(j%40===0){onProgress(m+j,m*2);await new Promise(resolve=>setTimeout(resolve,0));}
  }
  return {key:null,checks,ms:performance.now()-started,algorithm:'Baby-step giant-step',memory:babyTable.size};
}
