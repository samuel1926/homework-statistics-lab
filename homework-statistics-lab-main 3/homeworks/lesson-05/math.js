/* Lesson 5 — self-contained computational engine; no libraries, no network requests. */
(function (root) {
  'use strict';
  const PI=Math.PI, SQRT2PI=Math.sqrt(2*PI);
  const sinc=x=>x===0?1:Math.sin(x)/x;
  const gcd=(a,b)=>{while(b){const t=a%b;a=b;b=t;}return a;};
  const defs={
    sin:{label:'Sine wave', formula:'f(x) = sin(x)',a:0,b:PI,exact:2,note:'Continuous on [0, π]; both integrals equal 2.'},
    square:{label:'Quadratic',formula:'f(x) = x²',a:0,b:1,exact:1/3,note:'Continuous and monotone. Its level-set measure is derived from x = √y.'},
    step13:{label:'Two-level step',formula:'f(x) = 1 (x < 0.5), otherwise 3',a:0,b:1,exact:2,note:'A finite jump does not prevent Riemann integrability. Lebesgue integrates the two simple-function levels exactly.'},
    absolute:{label:'Absolute value',formula:'f(x) = |x − 0.5|',a:0,b:1,exact:1/4,note:'Continuous with a corner. Level sets have measure 2Δy.'},
    singular:{label:'Integrable singularity',formula:'f(x) = 1 / √x, x > 0',a:0,b:1,exact:2,note:'Unbounded at 0: not (proper) Riemann-integrable. Its improper Riemann integral and Lebesgue integral both equal 2.'},
    step10:{label:'Binary step',formula:'f(x) = 1 (x < 0.5), otherwise 0',a:0,b:1,exact:0.5,note:'Discontinuous at a single point; this does not affect either integral.'},
    sinc:{label:'Sinc function',formula:'f(x) = sin(x) / x (f(0) = 1)',a:0,b:PI,exact:1.851937051982466,note:'Continuous after setting f(0)=1. Integral is the sine integral Si(π), a special function.'},
    dirichlet:{label:'Dirichlet function',formula:'f(x) = 1 on ℚ; 0 on ℝ∖ℚ',a:0,b:1,exact:0,note:'Not Riemann-integrable: every nontrivial interval contains rational and irrational numbers. Lebesgue integral is 0.'},
    thomae:{label:'Thomae (popcorn) function',formula:'f(p/q) = 1/q in lowest terms; 0 on irrationals',a:0,b:1,exact:0,note:'Riemann- and Lebesgue-integrable with value 0. Dense rational spikes nevertheless give nonzero rational-grid samples.'}
  };
  function f(id,x,midIndex,n){
    switch(id){
      case 'sin':return Math.sin(x);
      case 'square':return x*x;
      case 'step13':return x<0.5?1:3;
      case 'absolute':return Math.abs(x-0.5);
      case 'singular':return 1/Math.sqrt(x);
      case 'step10':return x<0.5?1:0;
      case 'sinc':return sinc(x);
      case 'dirichlet':return 1; // exact rational midpoint of each uniform partition
      case 'thomae':{ // midpoint x=(2i+1)/(2n), reduced denominator exact in integer arithmetic
        if(!Number.isInteger(midIndex)||!Number.isInteger(n))return 0;
        const numer=2*midIndex+1,denom=2*n;
        return gcd(numer,denom)/denom;
      }
      default:throw Error('Unknown function: '+id);
    }
  }
  function riemann(id,n){
    if(!Number.isInteger(n)||n<1||n>200000)throw Error('n out of range');
    const {a,b}=defs[id];let sum=0;
    for(let i=0;i<n;i++)sum+=f(id,a+(i+.5)*(b-a)/n,i,n);
    return sum*(b-a)/n;
  }
  function inverseSinc(y){
    if(y<=0)return PI;if(y>=1)return 0;
    let lo=0,hi=PI;
    for(let i=0;i<44;i++){let mid=(lo+hi)/2;if(sinc(mid)>y)lo=mid;else hi=mid;}
    return (lo+hi)/2;
  }
  function distribution(id,y){ // G(y) = measure{x in domain: f(x) ≤ y}; continuous cases
    const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
    switch(id){
      case 'sin':return 2*Math.asin(cl(y,0,1));
      case 'square':return Math.sqrt(cl(y,0,1));
      case 'absolute':return 2*cl(y,0,.5);
      case 'sinc':return PI-inverseSinc(y);
      default:throw Error('Distribution not needed for this function');
    }
  }
  function rangeLevelSets(id,bins){
    if(!Number.isInteger(bins)||bins<2||bins>10000)throw Error('bin count out of range');
    const D=defs[id];
    if(id==='step13')return {levels:[{lo:1,hi:1,value:1,mass:0.5},{lo:3,hi:3,value:3,mass:0.5}],estimate:2,residual:0,kind:'atoms',description:'Exact preimage measures: μ(f⁻¹({1})) = μ(f⁻¹({3})) = 1/2.'};
    if(id==='step10')return {levels:[{lo:0,hi:0,value:0,mass:.5},{lo:1,hi:1,value:1,mass:.5}],estimate:.5,residual:0,kind:'atoms',description:'Exact simple-function decomposition on two sets of measure 1/2.'};
    if(id==='dirichlet'||id==='thomae')return {levels:[{lo:0,hi:0,value:0,mass:1}],estimate:0,residual:0,kind:'almost-everywhere',description:'The rational support is countable and has Lebesgue measure 0; the function equals 0 almost everywhere. This uses a mathematical fact, not a floating-point irrationality test.'};
    if(id==='singular'){
      const levels=[];let sum=0;
      for(let k=0;k<bins;k++){
        const lo=Math.exp(k*Math.log(bins)/bins),hi=Math.exp((k+1)*Math.log(bins)/bins);
        const mass=1/(lo*lo)-1/(hi*hi);
        const value=(lo+hi)/2;
        sum+=mass*value;levels.push({lo,hi,value,mass});
      }
      return {levels,estimate:sum,residual:2/bins,kind:'geometric',description:'Geometric range bins over 1 ≤ y ≤ B. The omitted tail x < 1/B² contributes exactly 2/B; the displayed estimate excludes that tail.'};
    }
    const ymax=id==='absolute'?.5:1;
    const levels=[];let sum=0;
    for(let k=0;k<bins;k++){
      const lo=ymax*k/bins,hi=ymax*(k+1)/bins;
      const mass=Math.max(0,distribution(id,hi)-distribution(id,lo));
      const value=(lo+hi)/2;sum+=value*mass;levels.push({lo,hi,value,mass});
    }
    return {levels,estimate:sum,residual:0,kind:'continuous',description:'Partition the value range into B measurable bands. Preimage measures come from the exact value-distribution formula G(y) = μ({x : f(x) ≤ y}); apply a midpoint level to each band.'};
  }
  function thomaeUpper(n){
    const Q=Math.max(4,Math.min(512,Math.ceil(6*Math.sqrt(n))));
    const peaks=new Float64Array(n);
    for(let q=1;q<=Q;q++)for(let p=0;p<=q;p++){
      if(gcd(p,q)!==1)continue;
      const num=p*n;const index=Math.floor(num/q),height=1/q;
      if(index<n)peaks[index]=Math.max(peaks[index],height);
      if(num%q===0&&index>0)peaks[index-1]=Math.max(peaks[index-1],height);
    }
    let upper=0;for(let i=0;i<n;i++)upper+=Math.max(peaks[i],1/(Q+1))/n;
    return {lower:0,upper,Q}; // certified bound: unenumerated rationals have q>Q
  }
  const normalPdf=x=>Math.exp(-.5*x*x)/SQRT2PI;
  function trapezoid(z,n){
    if(!Number.isInteger(n)||n<2)throw Error('Trapezoids >=2');
    const a=Math.abs(z),h=a/n,fn=t=>Math.exp(-t*t/2);
    let sum=(fn(0)+fn(a))/2;
    for(let i=1;i<n;i++)sum+=fn(i*h);
    return .5+Math.sign(z)*h*sum/SQRT2PI;
  }
  function simpson(z,n){
    if(!Number.isInteger(n)||n<2||n%2)throw Error('Simpson needs an even number of subintervals');
    const a=Math.abs(z),h=a/n,fn=t=>Math.exp(-t*t/2);
    let sum=fn(0)+fn(a);
    for(let i=1;i<n;i++)sum+=(i%2?4:2)*fn(i*h);
    return .5+Math.sign(z)*h*sum/(3*SQRT2PI);
  }
  function series(z,terms){
    if(!Number.isInteger(terms)||terms<1)throw Error('Need >=1 term');
    // exp(-t²/2) = Σ (-t²/2)^k / k!; termwise integrate from 0 to |z|.
    const a=Math.abs(z);let numerator=a,s=0,c=0;
    for(let k=0;k<terms;k++){
      const term=numerator/(2*k+1);
      const y=term-c,t=s+y;c=(t-s)-y;s=t;
      numerator*=(-a*a/2)/(k+1);
    }
    return .5+Math.sign(z)*s/SQRT2PI;
  }
  function erfApprox(z){ // Abramowitz–Stegun 7.1.26, typical |erf error|<1.5e−7
    const sign=Math.sign(z),x=Math.abs(z)/Math.SQRT2;
    const t=1/(1+.3275911*x);
    const poly=(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t;
    const erf=1-poly*Math.exp(-x*x);
    return .5*(1+sign*erf);
  }
  const methods={trapezoid,simpson,series,erfApprox};
  const api={defs,riemann,rangeLevelSets,thomaeUpper,normalPdf,methods,distribution,sinc};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.LabMath=api;
})(typeof window!=='undefined'?window:globalThis);
