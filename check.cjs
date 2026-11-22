const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class El{constructor(){this.children=[];this.style={};this.attrs={};this.handlers={};this.classList={toggle(){}};this.value='';}setAttribute(k,v){this.attrs[k]=v;}append(e){this.children.push(e)}addEventListener(k,v){this.handlers[k]=v;}showModal(){this.open=true}close(){this.open=false}}
const els=new Map(),get=id=>{if(!els.has(id))els.set(id,new El());return els.get(id)},envs=['room','cold','warm'].map(name=>Object.assign(new El(),{dataset:{env:name}}));
const document={getElementById:get,createElement:()=>new El(),createElementNS:()=>new El(),querySelectorAll:q=>q==='[data-env]'?envs:get('phaseCards').children,addEventListener(){}};
vm.runInNewContext(fs.readFileSync('dist/app.js','utf8'),{document,requestAnimationFrame(){},console});
assert.equal(get('phaseName').textContent,'Segar');assert.equal(get('phaseCards').children.length,5);
get('time').handlers.input({target:{value:'14'}});assert.equal(get('phaseName').textContent,'Membusuk');assert.equal(get('freshValue').textContent,'0%');
envs[1].handlers.click();assert.equal(get('phaseName').textContent,'Terlalu matang');assert.equal(get('phaseCards').children[4].disabled,true);
envs[2].handlers.click();assert.equal(get('phaseName').textContent,'Membusuk');
get('reset').handlers.click();assert.equal(get('phaseName').textContent,'Segar');assert.equal(get('time').value,0);
get('play').handlers.click();assert.equal(get('playText').textContent,'Jeda simulasi');get('play').handlers.click();assert.equal(get('playText').textContent,'Mulai simulasi');
get('about').handlers.click();assert.equal(get('aboutDialog').open,true);get('closeAbout').handlers.click();assert.equal(get('aboutDialog').open,false);
console.log('Passed: phase progression, storage changes, reset, playback, and information dialog.');
