
/* PUSH-81 — Puzzle Arcade (PWA) v2 — © 2025 pezzaliAPP — MIT
 * Audio 8-bit, CRT boost, livelli extra
 */
(()=>{'use strict';
const cvs=document.getElementById('game');const ctx=cvs.getContext('2d');
const S=30,COLS=16,ROWS=16;
const UI={moves:document.getElementById('moves'),best:document.getElementById('best'),levelNo:document.getElementById('levelNo'),levelMax:document.getElementById('levelMax'),
  btnUndo:document.getElementById('btnUndo'),btnReset:document.getElementById('btnReset'),btnPrev:document.getElementById('btnPrev'),btnNext:document.getElementById('btnNext'),
  touchBtns:document.querySelectorAll('.touch .btn'),soundToggle:document.getElementById('soundToggle'),crtToggle:document.getElementById('crtToggle')};

const LEVELS=["\n  #######\n  #  .  #\n  #  $  #\n  #  @  #\n  #     #\n  #######\n", "\n  #######\n  # . . #\n  # $$  #\n  #  @  #\n  #     #\n  #######\n", "\n   #######\n   #  .  #\n ### # # #\n # $$ $  #\n #   @   #\n #   .   #\n #########\n", "\n  ########\n  #  ..  #\n  # $$$  #\n  #  @   #\n  #      #\n  ########\n", "\n  #########\n  #   .   #\n  #  $$$  #\n  #   @   #\n  #   .   #\n  #       #\n  #########\n", "\n  #########\n  #  . .  #\n  #  $$   #\n  #   @   #\n  #   $   #\n  #   .   #\n  #########\n", "\n  ###########\n  # .     . #\n  # $$#$#$$ #\n  #    @    #\n  #         #\n  ###########\n", "\n  #########\n  #  . .  #\n  #  # #  #\n  # $$@$$ #\n  #  # #  #\n  #  . .  #\n  #########\n", "\n  #########\n  #   .   #\n  #  #$#  #\n  #  $@$  #\n  #  #$#  #\n  #   .   #\n  #########\n", "\n  #########\n  # ...   #\n  # $$$$  #\n  #   @   #\n  #       #\n  #########\n", "\n  #########\n  # .   . #\n  # $$ $$ #\n  #   @   #\n  #  ###  #\n  #   .   #\n  #########\n", "\n  #########\n  # ..    #\n  # $$#   #\n  #  @    #\n  #   #   #\n  #   $$  #\n  #   ..  #\n  #########\n", "\n  #########\n  #  . .  #\n  # $# #$ #\n  #  @    #\n  # $# #$ #\n  #  . .  #\n  #########\n", "\n  #########\n  #   .   #\n  # $$ $$ #\n  #  @    #\n  # $$ $$ #\n  #   .   #\n  #########\n", "\n  #########\n  # .   . #\n  #  $$$  #\n  #  $@$  #\n  #  $$$  #\n  # .   . #\n  #########\n"].map(s=>s.replace(/^\n|\n$/g,'').split('\n').map(r=>r.replace(/\s+$/,'')));
UI.levelMax.textContent=LEVELS.length.toString();

// --- Audio ---
const sounds={};
['move','push','undo','win','reset'].forEach(n=>{const a=new Audio('audio/'+n+'.wav'); a.preload='auto'; sounds[n]=a;});
let audioEnabled = (localStorage.getItem('push81.audio') ?? '1')==='1';
UI.soundToggle.checked = audioEnabled;
function beep(name){ if(!audioEnabled) return; const a=sounds[name]; if(!a) return; try{ a.currentTime=0; a.play(); }catch(_e){} }

// --- CRT toggle ---
const body=document.body;
UI.crtToggle.checked = (localStorage.getItem('push81.crt') ?? '1')==='1';
function applyCRT(){ if(UI.crtToggle.checked) body.classList.add('crt-boost'); else body.classList.remove('crt-boost'); }
applyCRT();

// --- State ---
let levelIndex=+localStorage.getItem('push81.level')||1; if(levelIndex<1||levelIndex>LEVELS.length) levelIndex=1;
let grid,player,goals,boxes; let moves=0; const history=[];

function parseLevel(idx){
  const raw=LEVELS[idx-1]; const h=raw.length,w=Math.max(...raw.map(r=>r.length));
  grid=Array.from({length:ROWS},_=>Array.from({length:COLS},_=>' ')); goals=new Set(); boxes=new Set(); player={x:1,y:1};
  for(let y=0;y<h;y++) for(let x=0;x<raw[y].length;x++){ const ch=raw[y][x]||' '; const gx=x+Math.floor((COLS-w)/2); const gy=y+Math.floor((ROWS-h)/2);
    switch(ch){ case '#': grid[gy][gx]='#'; break; case '.': grid[gy][gx]='.'; goals.add(key(gx,gy)); break;
      case '$': boxes.add(key(gx,gy)); break; case '*': boxes.add(key(gx,gy)); goals.add(key(gx,gy)); break;
      case '@': player={x:gx,y:gy}; break; case '+': goals.add(key(gx,gy)); player={x:gx,y:gy}; break; default: break; }
  }
  moves=0; history.length=0; updateHUD(); draw();
}

const key=(x,y)=>x+','+y, isWall=(x,y)=>grid[y]&&grid[y][x]==='#', isGoal=(x,y)=>goals.has(key(x,y)), hasBox=(x,y)=>boxes.has(key(x,y));

function move(dx,dy){
  const nx=player.x+dx, ny=player.y+dy; if(isWall(nx,ny)) return;
  if(hasBox(nx,ny)){ const bx=nx+dx, by=ny+dy; if(isWall(bx,by)||hasBox(bx,by)) return;
    history.push({player:{...player},boxes:new Set(boxes),moves});
    boxes.delete(key(nx,ny)); boxes.add(key(bx,by)); player.x=nx; player.y=ny; moves++; updateHUD(); draw(); checkWin(); beep('push');
  } else {
    history.push({player:{...player},boxes:new Set(boxes),moves});
    player.x=nx; player.y=ny; moves++; updateHUD(); draw(); checkWin(); beep('move');
  }
}

function undo(){ const h=history.pop(); if(!h) return; player=h.player; boxes=h.boxes; moves=h.moves; updateHUD(); draw(); beep('undo'); }
function reset(){ parseLevel(levelIndex); beep('reset'); }
function prev(){ levelIndex=Math.max(1,levelIndex-1); localStorage.setItem('push81.level',levelIndex); parseLevel(levelIndex); }
function next(){ levelIndex=Math.min(LEVELS.length,levelIndex+1); localStorage.setItem('push81.level',levelIndex); parseLevel(levelIndex); }

function updateHUD(){
  UI.levelNo.textContent=levelIndex.toString(); UI.moves.textContent=moves.toString();
  const bestKey='push81.best.'+levelIndex; let best=+localStorage.getItem(bestKey)||0;
  if(best===0||(moves>0&&isSolved()&&moves<best)){ best=moves; localStorage.setItem(bestKey,best); }
  UI.best.textContent=best>0?best:'—';
}

function isSolved(){ for(const b of boxes) if(!goals.has(b)) return false; return true; }
function checkWin(){ if(isSolved()){ cvs.style.boxShadow='0 0 0 3px #29f07a, 0 0 18px #29f07a'; setTimeout(()=>cvs.style.boxShadow='none',250); beep('win'); } }

// --- Rendering ---
function draw(){
  const w=cvs.width,h=cvs.height; ctx.fillStyle='#000'; ctx.fillRect(0,0,w,h);
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const px=x*S,py=y*S;
    ctx.fillStyle=(x+y)%2?'#0b0f22':'#0a0c1c'; ctx.fillRect(px,py,S,S);
    if(grid[y][x]==='#'){ ctx.fillStyle='#1b2550'; ctx.fillRect(px,py,S,S); ctx.fillStyle='#22306a'; ctx.fillRect(px+2,py+2,S-4,S-4); continue; }
    if(isGoal(x,y)){ ctx.strokeStyle='#00d1ff'; ctx.lineWidth=2; ctx.strokeRect(px+6,py+6,S-12,S-12); }
  }
  for(const b of boxes){ const [x,y]=b.split(',').map(Number); const px=x*S,py=y*S;
    ctx.fillStyle=isGoal(x,y)?'#2bf089':'#ffc14d'; ctx.fillRect(px+4,py+4,S-8,S-8); ctx.strokeStyle='#000'; ctx.strokeRect(px+4,py+4,S-8,S-8);
  }
  const px=player.x*S,py=player.y*S; ctx.fillStyle='#e8f0ff'; ctx.fillRect(px+8,py+8,S-16,S-16); ctx.fillStyle='#29f07a'; ctx.fillRect(px+12,py+12,S-24,S-24);
}

// --- Input ---
window.addEventListener('keydown', e=>{ const k=e.key.toLowerCase();
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
UI.touchBtns.forEach(b=>b.addEventListener('click',()=>{ const d=b.dataset.dir;
  if(d==='up') move(0,-1); else if(d==='down') move(0,1); else if(d==='left') move(-1,0); else if(d==='right') move(1,0);
  else if(d==='reset') reset(); else if(d==='undo') undo();
}));

// Drag gesture
let drag=null; cvs.addEventListener('pointerdown',e=>drag={x:e.clientX,y:e.clientY});
cvs.addEventListener('pointerup',e=>{ if(!drag)return; const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.abs(dx)>Math.abs(dy)) move(dx>0?1:-1,0); else if(Math.abs(dy)>8) move(dy>0?1:-1,0); drag=null;
});

// UI toggles
UI.soundToggle.addEventListener('change',()=>{ audioEnabled=UI.soundToggle.checked; localStorage.setItem('push81.audio', audioEnabled?'1':'0'); });
UI.crtToggle.addEventListener('change',()=>{ localStorage.setItem('push81.crt', UI.crtToggle.checked?'1':'0'); (UI.crtToggle.checked?document.body.classList.add('crt-boost'):document.body.classList.remove('crt-boost')); });

// Fit canvas
function fitCanvas(){ cvs.width=COLS*S; cvs.height=ROWS*S; draw(); }
window.addEventListener('resize', fitCanvas);

// Boot
parseLevel(levelIndex); fitCanvas();

})();