const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/mango3d.js','utf8');
const shaderSources=['vertex','fragment'].map(name=>source.match(new RegExp('const '+name+' = `([\\s\\S]*?)`;'))[1]);
const precision=shaderSources.map(shader=>shader.match(/precision\s+(lowp|mediump|highp)\s+float\s*;/)?.[1]);
assert(precision.every(Boolean),'Both shaders must declare a float precision');
assert.equal(precision[0],precision[1],'Shared uniforms and varyings must have matching precision');
const html=fs.readFileSync('dist/index.html','utf8');
assert(html.includes('href="favicon.svg"'));assert(fs.existsSync('dist/favicon.svg'));
const buffers=[],uniforms={},frames=[],drawKinds=[];let draws=0;
const noop=()=>{}, gl=new Proxy({createBuffer:()=>({}),createShader:()=>({}),createProgram:()=>({}),getShaderParameter:()=>true,getProgramParameter:()=>true,getUniformLocation:(_,n)=>n,getAttribLocation:(_,n)=>n==='position'?0:1,bufferData:(_,data)=>{assert([...data].every(Number.isFinite));buffers.push(data)},uniform1f:(n,v)=>uniforms[n]=v,uniform3fv:(n,v)=>{assert(v.every(Number.isFinite))},isContextLost:()=>false,drawElements:()=>{draws++;drawKinds.push(uniforms.kind);}},{get:(o,k)=>k in o?o[k]:/^[A-Z_]+$/.test(k)?k:noop});
class El{constructor(){this.style={};this.events={};this.classList={add:noop,remove:noop,toggle:noop};}addEventListener(n,f){this.events[n]=f;}setAttribute(n,v){this[n]=v;}getBoundingClientRect(){return {width:760,height:435};}matches(){return true;}focus(){}setPointerCapture(){}}
const els={};const get=n=>els[n]??=(new El());get('mango3d').getContext=()=>gl;
const context={document:{getElementById:get,querySelector:get,hidden:false},devicePixelRatio:1,requestAnimationFrame:f=>frames.push(f),console};
vm.runInNewContext(fs.readFileSync('dist/mango3d.js','utf8'),context);
assert.equal(buffers.length,21);for(let i=0;i<21;i+=3){const vertexCount=buffers[i].length/3;assert(Math.max(...buffers[i+2])<vertexCount);}
// The leaf root must coincide with the stalk center, including after shared shrinkage.
const leafRoot=Array.from(buffers[18].slice(0,3));
const stalkRing=Array.from({length:12},(_,j)=>Array.from(buffers[15].slice((12*13+j)*3,(12*13+j)*3+3)));
const stalkCenter=[0,1,2].map(axis=>stalkRing.reduce((sum,p)=>sum+p[axis],0)/12);
for(const decay of [0,.5,1]){const deform=p=>[p[0]*(1-decay*.04),p[1]*(1-decay*.17)-decay*.15,p[2]];assert(Math.hypot(...deform(leafRoot).map((v,i)=>v-deform(stalkCenter)[i]))<1e-6);}
// Both cut faces exactly share the skin boundary, avoiding exposed empty edges.
for(let j=0;j<=128;j++){const point=Array.from(buffers[6].slice((36*129+j)*3,(36*129+j)*3+3));const y=point[1]/1.14;const center=.17*(1-y*y)+.15*y;const radius=Math.hypot((point[0]-center)/(.83*(1+.14*y)),y);assert(Math.abs(radius-1)<1e-5);}
frames.shift()(0);assert.equal(draws,7);assert.equal(uniforms.age,0);assert.equal(uniforms.opening,1);assert.deepEqual(drawKinds.slice(-7),[0,0,3,5,4,1,2]);
context.mango3D.update(14,['#716449','#494832','#272c23']);frames.shift()(16);assert.equal(uniforms.age,14);assert.equal(draws,14);
get('zoomIn').events.click();frames.shift()(32);assert(uniforms.distance<6.1);
get('mango3d').events.keydown({key:'ArrowRight',preventDefault:noop});frames.shift()(48);assert(uniforms.yaw>-.3);
get('viewReset').events.click();frames.shift()(64);assert.equal(uniforms.distance,6.1);assert.equal(uniforms.yaw,-.3);
get('splitMango').events.click({currentTarget:get('splitMango')});for(let i=1;i<=80;i++)frames.shift()(64+i*16);assert.equal(uniforms.opening,0);assert.equal(get('anatomyLegend').hidden,true);assert.deepEqual(drawKinds.slice(-4),[0,0,1,2]);
get('splitMango').events.click({currentTarget:get('splitMango')});for(let i=1;i<=80;i++)frames.shift()(1344+i*16);assert.equal(uniforms.opening,1);assert.equal(get('anatomyLegend').hidden,false);assert.deepEqual(drawKinds.slice(-7),[0,0,3,5,4,1,2]);
get('mango3d').getBoundingClientRect=()=>({width:360,height:370});get('zoomIn').events.click();frames.shift()(2640);assert(uniforms.distance>6.1,'Narrow screens must fit both halves in view');
console.log('Passed: shader precision, valid geometry, attached leaf root, closed cut edges, seed and flesh rendering commands, split animation, mobile framing, zoom, orbit, and simulation updates. Actual GPU rendering is not verified.');
