
(()=>{'use strict';
const cvs=document.getElementById('game'),ctx=cvs.getContext('2d');
const S=30,COLS=16,ROWS=16;
const UI={moves:document.getElementById('moves'),best:document.getElementById('best'),levelNo:document.getElementById('levelNo'),levelMax:document.getElementById('levelMax'),
target:document.getElementById('target'),perfect:document.getElementById('perfectBadge'),
btnUndo:document.getElementById('btnUndo'),btnReset:document.getElementById('btnReset'),btnPrev:document.getElementById('btnPrev'),btnNext:document.getElementById('btnNext'),
touchBtns:document.querySelectorAll('[data-dir]'),soundToggle:document.getElementById('soundToggle'),crtToggle:document.getElementById('crtToggle'),
palette:document.getElementById('palette'),levelSelect:document.getElementById('levelSelect'),btnShare:document.getElementById('btnShare'),btnA2HS:document.getElementById('btnA2HS'),btnPalette:document.getElementById('btnPalette')};

const LEVELS=["\n  #######\n  #  .  #\n  #  $  #\n  #  @  #\n  #     #\n  #######\n", "\n  #######\n  # . . #\n  # $$  #\n  #  @  #\n  #     #\n  #######\n", "\n   #######\n   #  .  #\n ### # # #\n # $$ $  #\n #   @   #\n #   .   #\n #########\n", "\n  ########\n  #  ..  #\n  # $$$  #\n  #  @   #\n  #      #\n  ########\n", "\n  #########\n  #   .   #\n  #  $$$  #\n  #   @   #\n  #   .   #\n  #       #\n  #########\n", "\n  #########\n  #  . .  #\n  #  $$   #\n  #   @   #\n  #   $   #\n  #   .   #\n  #########\n", "\n  ###########\n  # .     . #\n  # $$#$#$$ #\n  #    @    #\n  #         #\n  ###########\n", "\n  #########\n  #  . .  #\n  #  # #  #\n  # $$@$$ #\n  #  # #  #\n  #  . .  #\n  #########\n", "\n  #########\n  #   .   #\n  #  #$#  #\n  #  $@$  #\n  #  #$#  #\n  #   .   #\n  #########\n", "\n  #########\n  # ...   #\n  # $$$$  #\n  #   @   #\n  #       #\n  #########\n", "\n  #########\n  # .   . #\n  # $$ $$ #\n  #   @   #\n  #  ###  #\n  #   .   #\n  #########\n", "\n  #########\n  # ..    #\n  # $$#   #\n  #  @    #\n  #   #   #\n  #   $$  #\n  #   ..  #\n  #########\n", "\n  #########\n  #  . .  #\n  # $# #$ #\n  #  @    #\n  # $# #$ #\n  #  . .  #\n  #########\n", "\n  #########\n  #   .   #\n  # $$ $$ #\n  #  @    #\n  # $$ $$ #\n  #   .   #\n  #########\n", "\n  #########\n  # .   . #\n  #  $$$  #\n  #  $@$  #\n  #  $$$  #\n  # .   . #\n  #########\n"].map(s=>s.replace(/^\n|\n$/g,'').split('\n').map(r=>r.replace(/\s+$/,'')));
const TARGETS=[6, 10, 18, 16, 14, 16, 22, 20, 18, 18, 20, 22, 20, 22, 24];
UI.levelMax.textContent=LEVELS.length.toString();

function haptic(){ if(navigator.vibrate) try{ navigator.vibrate(10); }catch(e){} }

// Audio
const sounds={};['move','push','undo','win','reset'].forEach(n=>{const a=new Audio('audio/'+n+'.wav');a.preload='auto';sounds[n]=a;});
let audioEnabled=(localStorage.getItem('push81.audio')??'1')==='1'; UI.soundToggle.checked=audioEnabled;
function beep(n){ if(!audioEnabled) return; const a=sounds[n]; if(!a) return; try{ a.currentTime=0; a.play(); }catch{} }

// CRT
const body=document.body; UI.crtToggle.checked=(localStorage.getItem('push81.crt')??'1')==='1';
function applyCRT(){ if(UI.crtToggle.checked) body.classList.add('crt-boost'); else body.classList.remove('crt-boost'); } applyCRT();

// Palette
const root=document.documentElement;
const PALETTES={
  classic:{goal:'#00d1ff',box:'#ffc14d',boxGoal:'#2bf089',bg:'#0b1022',panel:'#0f1734',ink:'#e8f0ff'},
  phosphor:{goal:'#00ff7a',box:'#88ff9b',boxGoal:'#00ff7a',bg:'#011b11',panel:'#072018',ink:'#caffd9'},
  amber:{goal:'#ffb000',box:'#ffd277',boxGoal:'#ffcc33',bg:'#201300',panel:'#2a1800',ink:'#ffe9c2'},
  ice:{goal:'#a8e1ff',box:'#b7d0ff',boxGoal:'#d6f3ff',bg:'#0b1220',panel:'#0f1932',ink:'#e9f3ff'}
};
const paletteOrder=['classic','phosphor','amber','ice'];
function applyPalette(n){ const p=PALETTES[n]||PALETTES.classic;
  root.style.setProperty('--goal',p.goal); root.style.setProperty('--box',p.box); root.style.setProperty('--boxGoal',p.boxGoal);
  root.style.setProperty('--bg',p.bg); root.style.setProperty('--panel',p.panel); root.style.setProperty('--ink',p.ink);
}
let savedPalette=localStorage.getItem('push81.palette'); if(!savedPalette){ const isMobile=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent); savedPalette=isMobile?'phosphor':'amber'; }
UI.palette.value=savedPalette; applyPalette(savedPalette);

if(UI.btnPalette){ UI.btnPalette.addEventListener('click',()=>{ const i=(paletteOrder.indexOf(UI.palette.value)+1)%paletteOrder.length; const v=paletteOrder[i]; UI.palette.value=v; localStorage.setItem('push81.palette',v); applyPalette(v); haptic(); draw(); }); }

// State
let levelIndex=+localStorage.getItem('push81.level')||1; if(levelIndex<1||levelIndex>LEVELS.length) levelIndex=1;
let grid,player,goals,boxes; let moves=0; const history=[];

// Level select populate
function buildLevelSelect(){ UI.levelSelect.innerHTML=''; for(let i=1;i<=LEVELS.length;i++){ const opt=document.createElement('option'); opt.value=String(i); opt.textContent=String(i); UI.levelSelect.appendChild(opt); } }
buildLevelSelect();

function parseLevel(idx){
  const raw=LEVELS[idx-1], h=raw.length, w=Math.max(...raw.map(r=>r.length));
  grid=Array.from({length:ROWS}, _=>Array.from({length:COLS}, _=>' ')); goals=new Set(); boxes=new Set(); player={x:1,y:1};
  for(let y=0;y<h;y++) for(let x=0;x<raw[y].length;x++){ const ch=raw[y][x]||' '; const gx=x+Math.floor((COLS-w)/2); const gy=y+Math.floor((ROWS-h)/2);
    switch(ch){ case '#': grid[gy][gx]='#'; break; case '.': grid[gy][gx]='.'; goals.add(gx+','+gy); break;
      case '$': boxes.add(gx+','+gy); break; case '*': boxes.add(gx+','+gy); goals.add(gx+','+gy); break;
      case '@': player={x:gx,y:gy}; break; case '+': goals.add(gx+','+gy); player={x:gx,y:gy}; break; default: break; }
  }
  moves=0; history.length=0; UI.levelNo.textContent=String(idx); UI.levelSelect.value=String(idx);
  UI.target.textContent = TARGETS[idx-1]||'—'; UI.perfect.style.display='none'; updateHUD(); draw();
}

const key=(x,y)=>x+','+y, isWall=(x,y)=>grid[y]&&grid[y][x]==='#', isGoal=(x,y)=>goals.has(key(x,y)), hasBox=(x,y)=>boxes.has(key(x,y));

function move(dx,dy){
  const nx=player.x+dx, ny=player.y+dy; if(isWall(nx,ny)) return;
  if(hasBox(nx,ny)){ const bx=nx+dx, by=ny+dy; if(isWall(bx,by)||hasBox(bx,by)) return;
    history.push({player:{...player},boxes:new Set(boxes),moves}); boxes.delete(key(nx,ny)); boxes.add(key(bx,by));
    player.x=nx; player.y=ny; moves++; updateHUD(); draw(); checkWin(); beep('push'); haptic();
  } else {
    history.push({player:{...player},boxes:new Set(boxes),moves}); player.x=nx; player.y=ny; moves++; updateHUD(); draw(); checkWin(); beep('move'); haptic();
  }
}

function undo(){ const h=history.pop(); if(!h) return; player=h.player; boxes=h.boxes; moves=h.moves; updateHUD(); draw(); beep('undo'); haptic(); }
function reset(){ parseLevel(levelIndex); beep('reset'); haptic(); }
function prev(){ levelIndex=Math.max(1,levelIndex-1); localStorage.setItem('push81.level', levelIndex); parseLevel(levelIndex); haptic(); }
function next(){ levelIndex=Math.min(LEVELS.length,levelIndex+1); localStorage.setItem('push81.level', levelIndex); parseLevel(levelIndex); haptic(); }

function updateHUD(){
  UI.levelNo.textContent = String(levelIndex);
  UI.moves.textContent = String(moves);
  const bestKey='push81.best.'+levelIndex; let best=+localStorage.getItem(bestKey)||0;
  if(best===0 || (moves>0 && isSolved() && moves<best)){ best=moves; localStorage.setItem(bestKey, best); }
  UI.best.textContent = best>0?best:'—';
}

function isSolved(){ for(const b of boxes) if(!goals.has(b)) return false; return true; }
function checkWin(){ if(isSolved()){ const tgt=TARGETS[levelIndex-1]||Infinity; if(moves<=tgt) UI.perfect.style.display='inline-block';
  cvs.style.boxShadow='0 0 0 3px var(--boxGoal), 0 0 18px var(--boxGoal)'; setTimeout(()=>cvs.style.boxShadow='none',250); beep('win'); } }

function draw(){
  const w=cvs.width,h=cvs.height; ctx.fillStyle='#000'; ctx.fillRect(0,0,w,h);
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const px=x*S,py=y*S;
    ctx.fillStyle=(x+y)%2?'#0b0f22':'#0a0c1c'; ctx.fillRect(px,py,S,S);
    if(grid[y][x]==='#'){ ctx.fillStyle='#1b2550'; ctx.fillRect(px,py,S,S); ctx.fillStyle='#22306a'; ctx.fillRect(px+2,py+2,S-4,S-4); continue; }
    if(isGoal(x,y)){ ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--goal').trim()||'#00d1ff'; ctx.lineWidth=2; ctx.strokeRect(px+6,py+6,S-12,S-12); }
  }
  const cs=getComputedStyle(document.documentElement);
  for(const b of boxes){ const [x,y]=b.split(',').map(Number); const px=x*S,py=y*S;
    ctx.fillStyle=isGoal(x,y)?(cs.getPropertyValue('--boxGoal').trim()||'#2bf089'):(cs.getPropertyValue('--box').trim()||'#ffc14d');
    ctx.fillRect(px+4,py+4,S-8,S-8); ctx.strokeStyle='#000'; ctx.strokeRect(px+4,py+4,S-8,S-8);
  }
  const px=player.x*S,py=player.y*S; ctx.fillStyle='#e8f0ff'; ctx.fillRect(px+8,py+8,S-16,S-16); ctx.fillStyle=cs.getPropertyValue('--boxGoal').trim()||'#2bf089'; ctx.fillRect(px+12,py+12,S-24,S-24);
}

// Keyboard
addEventListener('keydown', e=>{ const k=e.key.toLowerCase();
  if(k==='arrowup'||k==='w') move(0,-1);
  else if(k==='arrowdown'||k==='s') move(0,1);
  else if(k==='arrowleft'||k==='a') move(-1,0);
  else if(k==='arrowright'||k==='d') move(1,0);
  else if(k==='r') reset();
  else if(k==='z') undo();
  else if(k==='j') prev();
  else if(k==='k') next();
});

// Touch buttons
UI.touchBtns.forEach(b=>{
  b.addEventListener('click',()=>{ const d=b.dataset.dir; if(d==='up') move(0,-1); else if(d==='down') move(0,1); else if(d==='left') move(-1,0); else if(d==='right') move(1,0); else if(d==='reset') reset(); else if(d==='undo') undo(); });
  b.addEventListener('touchstart',e=>{ e.preventDefault(); }, {passive:false});
});

// Level select
document.getElementById('levelSelect').addEventListener('change', e=>{ levelIndex = parseInt(e.target.value,10)||1; localStorage.setItem('push81.level', levelIndex); parseLevel(levelIndex); });

// Toggles
UI.soundToggle.addEventListener('change', ()=>{ audioEnabled=UI.soundToggle.checked; localStorage.setItem('push81.audio', audioEnabled?'1':'0'); });
UI.crtToggle.addEventListener('change', ()=>{ localStorage.setItem('push81.crt', UI.crtToggle.checked?'1':'0'); (UI.crtToggle.checked?document.body.classList.add('crt-boost'):document.body.classList.remove('crt-boost')); });
UI.palette.addEventListener('change', ()=>{ const v=UI.palette.value; localStorage.setItem('push81.palette', v); applyPalette(v); draw(); });

// Share & A2HS
let deferredPrompt=null; window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;});
if(UI.btnA2HS) UI.btnA2HS.addEventListener('click', async ()=>{ if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt=null; } else { alert('Condividi → Aggiungi alla Home'); } });
if(UI.btnShare) UI.btnShare.addEventListener('click', async ()=>{ try{ if(navigator.share){ await navigator.share({title:'PUSH-81',text:'Prova questo rompicapo!',url:location.href}); } else { await navigator.clipboard.writeText(location.href); alert('Link copiato!'); } }catch(_){}});

function fitCanvas(){ cvs.width=COLS*S; cvs.height=ROWS*S; draw(); } addEventListener('resize', fitCanvas);

// Boot
parseLevel(levelIndex); fitCanvas();
})();