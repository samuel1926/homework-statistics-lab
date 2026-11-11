'use strict';
const assert=require('node:assert/strict');
const lab=require('./math.js');
const ref=require('./references.json').values;
const near=(actual,target,tolerance,label)=>{
 assert.ok(Number.isFinite(actual),`${label}: not finite: ${actual}`);
 assert.ok(Math.abs(actual-target)<=tolerance,`${label}: ${actual} differs from ${target} by more than ${tolerance}`);
};
for(const id of ['sin','square','step13','absolute','sinc','step10']){
 near(lab.riemann(id,1023),lab.defs[id].exact,0.001,`${id}: midpoint`);
 near(lab.rangeLevelSets(id,512).estimate,lab.defs[id].exact,0.001,`${id}: value levels`);
}
near(lab.riemann('singular',1023),2,.025,'singular improper midpoint');
near(lab.rangeLevelSets('singular',512).estimate,2,.01,'singular truncated levels');
assert.equal(lab.riemann('dirichlet',127),1,'rational midpoint samples');
assert.equal(lab.rangeLevelSets('dirichlet',64).estimate,0,'Dirichlet Lebesgue integral');
assert.equal(lab.rangeLevelSets('thomae',64).estimate,0,'Thomae Lebesgue integral');
const t1=lab.thomaeUpper(127),t2=lab.thomaeUpper(1023);
assert.ok(t1.lower===0 && t1.upper>0 && t1.upper<1,'Darboux upper positive bounded');
assert.ok(t2.upper < t1.upper,`Thomae Darboux bound should decrease: ${t1.upper} vs ${t2.upper}`);
for(const raw of Object.keys(ref)){
 const z=Number(raw),target=ref[raw];
 near(lab.methods.simpson(z,512),target,3e-9,`Simpson z=${z}`);
 near(lab.methods.trapezoid(z,1024),target,2e-6,`Trapezoid z=${z}`);
 near(lab.methods.erfApprox(z),target,9e-8,`A&S erf approx z=${z}`);
 if(Math.abs(z)<=3) near(lab.methods.series(z,52),target,5e-14,`Series z=${z}`);
}
near(lab.methods.simpson(1.53,512),0.9369916355360217,2e-9,'NIST example z=1.53');
near(lab.methods.simpson(-1.53,512),0.0630083644639783,2e-9,'NIST example z=-1.53');
console.log('All Lesson 5 tests passed: 9 function classes, pathological integrability, Darboux bounds, 49 Gaussian checkpoints and NIST examples.');
