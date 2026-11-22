/* Self-contained WebGL model: no downloads or external runtime required. */
(() => {
  'use strict';
  const canvas = document.getElementById('mango3d');
  const hint = document.getElementById('orbitHint');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) { hint.textContent = 'Mode ilustrasi · 3D tidak tersedia di browser ini'; return; }
  const vertex = `
    precision mediump float;
    attribute vec3 position; attribute vec3 normal;
    uniform float yaw, pitch, age, kind, opening, side;
    uniform mat4 projection; uniform float distance;
    varying vec3 local, N, V;
    void main(){
      vec3 p=position; vec3 n=normal; local=position;
      float decay=smoothstep(7.,14.,age);
      if(kind<.5){
        float ripple=sin(p.y*49.+sin(p.x*18.)*1.8)*sin(p.z*27.+p.y*7.);
        p+=n*ripple*.017*decay*smoothstep(0.,.1,abs(p.z));
      }
      // Deform the entire assembly together so the stalk and leaf stay attached.
      p.y=p.y*(1.-decay*.17)-decay*.15;
      p.x*=1.-decay*.04;
      float turn=side>.5?opening*3.14159265:0.;
      float ct=cos(turn),st=sin(turn);
      mat3 halfTurn=mat3(ct,0.,-st,0.,1.,0.,st,0.,ct);
      p=halfTurn*p;n=halfTurn*n;
      p.x+=side*opening*1.12;
      float cy=cos(yaw),sy=sin(yaw),cx=cos(pitch),sx=sin(pitch);
      mat3 ry=mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy);
      mat3 rx=mat3(1.,0.,0.,0.,cx,sx,0.,-sx,cx);
      p=rx*ry*p; N=normalize(rx*ry*n); V=vec3(0.,0.,distance)-p;
      gl_Position=projection*vec4(p.x,p.y-.05,p.z-distance,1.);
    }`;
  const fragment = `
    precision mediump float;
    varying vec3 local,N,V; uniform float age,kind;
    uniform vec3 lightColor,midColor,darkColor;
    float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    void main(){
      vec3 n=normalize(N);vec3 l=normalize(vec3(-3.,4.,5.));
      float diffuse=max(dot(n,l),0.); float grain=noise(local*110.);
      vec3 color=mix(midColor,lightColor,clamp(local.y*.36+.35+noise(local*3.)*.3,0.,1.));
      color=mix(darkColor,color,.62+noise(local*5.)*.38);
      float rot=smoothstep(4.5,14.,age);
      float patches=noise(local*6.3)*.62+noise(local*15.)*.26+noise(local*37.)*.12;
      float spots=smoothstep(.79-rot*.43,.87-rot*.43,patches)*smoothstep(4.5,7.,age);
      color=mix(color,vec3(.12,.085,.038)+noise(local*30.)*.045,spots*.94);
      float mold=smoothstep(.66,.76,noise(local*9.+vec3(19.,4.,7.)))*smoothstep(8.,14.,age);
      color=mix(color,mix(vec3(.23,.38,.28),vec3(.81,.85,.69),grain),mold*.9);
      color*=.92+grain*.12;
      color*=1.-smoothstep(.84,.94,noise(local*170.))*.28;
      if(kind>.5&&kind<1.5)color=vec3(.27,.17,.07)*( .7+grain*.6);
      if(kind>1.5&&kind<2.5){color=mix(vec3(.12,.32,.12),vec3(.28,.25,.09),smoothstep(5.,14.,age));color+=vec3(.09,.12,.035)*pow(abs(sin(local.x*35.+local.y*21.)),14.);}
      if(kind>2.5&&kind<3.5||kind>4.5){
        float y=local.y/1.14;
        float center=.17*(1.-y*y)+.15*y;
        float x=(local.x-center)/(.83*(1.+.14*y));
        float radius=sqrt(x*x+y*y);
        vec3 flesh=mix(vec3(.93,.88,.48),vec3(1.,.63,.055),smoothstep(0.,4.,age));
        flesh=mix(flesh,vec3(.36,.23,.065),smoothstep(6.,14.,age)*(.55+patches*.45));
        flesh*=.94+grain*.10;
        flesh+=vec3(.045,.025,0.)*sin(local.y*95.+local.x*16.)*.25;
        if(kind>4.5){float socket=length(vec2((local.x-.08)/.37,(local.y+.05)/.78));flesh=mix(flesh,flesh*vec3(.67,.53,.32),1.-smoothstep(.85,1.05,socket));}
        flesh=mix(flesh,vec3(.27,.32,.18),mold*.35);
        color=mix(flesh,color,smoothstep(.958,.982,radius));
      }
      if(kind>3.5&&kind<4.5){
        float fiber=pow(abs(sin(local.y*95.+sin(local.x*28.)*2.)),5.);
        color=mix(vec3(.91,.79,.46),vec3(.56,.39,.17),fiber*.42);
        color=mix(color,vec3(.36,.27,.13),smoothstep(7.,14.,age)*.6);
      }
      float spec=pow(max(dot(reflect(-l,n),normalize(V)),0.),mix(42.,9.,rot));
      float rim=pow(1.-max(dot(n,normalize(V)),0.),3.);
      vec3 lit=color*(.35+diffuse*.86)+vec3(1.,.95,.77)*spec*(.22-rot*.15)+vec3(.14,.22,.12)*rim;
      gl_FragColor=vec4(lit,1.);
    }`;
  let program;
  try {
    const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  } catch (error) { console.error('Model 3D:',error);hint.textContent='Mode ilustrasi · 3D tidak dapat dimuat';return; }
  gl.useProgram(program);
  const U={};for(const key of ['yaw','pitch','age','kind','opening','side','distance','projection','lightColor','midColor','darkColor'])U[key]=gl.getUniformLocation(program,key);
  const A={position:gl.getAttribLocation(program,'position'),normal:gl.getAttribLocation(program,'normal')};
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function surface(fn,rows,cols,kind,side=-1,fixedNormal=null){
    const positions=[],normals=[],indices=[];
    for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
      const u=i/rows,v=j/cols,p=fn(u,v),du=sub(fn(Math.min(.99999,u+.0001),v),fn(Math.max(.00001,u-.0001),v)),dv=sub(fn(u,v+.0001),fn(u,v-.0001));
      const n=fixedNormal||cross(dv,du),len=Math.hypot(...n)||1;positions.push(...p);normals.push(...n.map(x=>x/len));
    }
    for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const buffer=(type,data)=>{const b=gl.createBuffer();gl.bindBuffer(type,b);gl.bufferData(type,data,gl.STATIC_DRAW);return b;};
    return {p:buffer(gl.ARRAY_BUFFER,new Float32Array(positions)),n:buffer(gl.ARRAY_BUFFER,new Float32Array(normals)),i:buffer(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices)),count:indices.length,kind,side};
  }
  function skinPoint(u,v,front){const phi=.00001+u*(Math.PI-.00002),theta=v*Math.PI+(front?0:Math.PI),y=Math.cos(phi),r=Math.sin(phi),width=.83*(1+.14*y);return [width*r*Math.cos(theta)+.17*(1-y*y)+.15*y,1.14*y,.60*r*Math.sin(theta)*(1+.07*y)];}
  const back=surface((u,v)=>skinPoint(u,v,false),90,64,0,-1);
  const front=surface((u,v)=>skinPoint(u,v,true),90,64,0,1);
  function cutPoint(u,v,z){const theta=v*Math.PI*2,y=u*Math.sin(theta);return [.83*(1+.14*y)*u*Math.cos(theta)+.17*(1-y*y)+.15*y,1.14*y,z];}
  const backFlesh=surface((u,v)=>cutPoint(u,v,.001),36,128,3,-1,[0,0,1]);
  const frontFlesh=surface((u,v)=>cutPoint(u,v,-.001),36,128,5,1,[0,0,-1]);
  const stone=surface((u,v)=>{const phi=.00001+u*(Math.PI-.00002),theta=v*Math.PI*2;return [.08+.35*Math.sin(phi)*Math.cos(theta),-.05+.76*Math.cos(phi),.035+.16*Math.sin(phi)*Math.sin(theta)];},56,64,4,-1);
  const stem=surface((u,v)=>{const t=v*Math.PI*2;return [.15+u*.12+Math.cos(t)*.038,1.10+u*.37,.02+Math.sin(t)*.038];},16,12,1);
  const leaf=surface((u,v)=>{const curve=Math.sin(u*Math.PI),w=curve*.19,s=(v-.5)*2;return [.24+u*.88,1.3775+curve*.15+s*w,.02+s*w*.95+curve*(.07-s*s*.06)];},36,16,2);
  let yaw=-.3,pitch=-.12,distance=6.1,age=0,auto=false,dirty=true,previous=0,split=true,opening=1;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function home(){yaw=-.3;pitch=-.12;distance=split?6.1:4.8;dirty=true;}
  function zoom(amount){distance=clamp(distance+amount,3.4,8.5);dirty=true;}
  function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(w&&h&&(canvas.width!==w||canvas.height!==h)){canvas.width=w;canvas.height=h;dirty=true;}}
  function draw(t){
    resize();const elapsed=previous?Math.min(t-previous,60):16;
    if(Math.abs(opening-Number(split))>.001){opening+=(Number(split)-opening)*(1.-Math.exp(-elapsed/110));dirty=true;}else if(opening!==Number(split)){opening=Number(split);dirty=true;}
    if(auto&&!document.hidden){if(previous)yaw+=elapsed*.00024;dirty=true;}previous=t;
    if(dirty&&!gl.isContextLost()){
      dirty=false;gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
      const aspect=canvas.width/canvas.height,f=1/Math.tan(34*Math.PI/360),near=.1,far=30;
      gl.uniformMatrix4fv(U.projection,false,new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]));
      const fit=1.+opening*(Math.max(1.,1.55/aspect)-1.);
      gl.uniform1f(U.yaw,yaw);gl.uniform1f(U.pitch,pitch);gl.uniform1f(U.distance,distance*fit);gl.uniform1f(U.age,age);
      gl.uniform1f(U.opening,opening);
      const meshes=opening>.001?[back,front,backFlesh,frontFlesh,stone,stem,leaf]:[back,front,stem,leaf];
      for(const mesh of meshes){
        for(const [key,buf] of [['position',mesh.p],['normal',mesh.n]]){gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(A[key]);gl.vertexAttribPointer(A[key],3,gl.FLOAT,false,0,0);}
        gl.uniform1f(U.kind,mesh.kind);gl.uniform1f(U.side,mesh.side);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.i);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
      }
    }
    requestAnimationFrame(draw);
  }
  globalThis.mango3D={update(nextAge,colors){age=nextAge;for(let i=0;i<3;i++){const c=colors[i].slice(1).match(/../g).map(h=>parseInt(h,16)/255);gl.uniform3fv(U[['lightColor','midColor','darkColor'][i]],c);}dirty=true;}};
  globalThis.mango3D.update(0,['#b3d45f','#73a638','#305d28']);
  const pointers=new Map();let pinchDistance=0;
  canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.classList.add('dragging');if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}});
  canvas.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);zoom((pinchDistance-d)*.012);pinchDistance=d;}else{yaw+=dx*.009;pitch=clamp(pitch+dy*.009,-1.15,1.15);dirty=true;}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete(e.pointerId);if(!pointers.size)canvas.classList.remove('dragging');});
  canvas.addEventListener('wheel',e=>{if(!canvas.matches(':focus'))return;e.preventDefault();zoom(clamp(e.deltaY*.003,-.4,.4));},{passive:false});
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.15;if(e.key==='ArrowRight')yaw+=.15;if(e.key==='ArrowUp')pitch=clamp(pitch-.12,-1.15,1.15);if(e.key==='ArrowDown')pitch=clamp(pitch+.12,-1.15,1.15);if(e.key==='+'||e.key==='=')zoom(-.3);if(e.key==='-')zoom(.3);if(e.key==='Home')home();dirty=true;}});
  document.getElementById('zoomIn').addEventListener('click',()=>zoom(-.35));document.getElementById('zoomOut').addEventListener('click',()=>zoom(.35));document.getElementById('viewReset').addEventListener('click',home);
  document.getElementById('splitMango').addEventListener('click',e=>{split=!split;e.currentTarget.setAttribute('aria-pressed',String(split));e.currentTarget.textContent=split?'Satukan mangga':'Belah dua';document.getElementById('anatomyLegend').hidden=!split;document.querySelector('.scene').classList.toggle('is-split',split);home();});
  document.getElementById('autoRotate').addEventListener('click',e=>{auto=!auto;e.currentTarget.setAttribute('aria-pressed',String(auto));e.currentTarget.textContent=auto?'Hentikan putaran':'Putar otomatis';dirty=true;});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.querySelector('.scene').classList.remove('has-3d');hint.textContent='Tampilan 3D terhenti. Muat ulang untuk mencoba lagi.';});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  document.querySelector('.scene').classList.add('has-3d','is-split');hint.textContent='Geser untuk memutar · Cubit atau gunakan + / − untuk zoom';
  requestAnimationFrame(draw);
})();
