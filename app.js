// ================= CONFIG DIDÁTICA =================
const SEQUENCE = [
  {
    name: 'Marketing',
    riddle: 'Eu crio a demanda e preparo o terreno para a receita, antes do caixa tocar. Quem sou eu?',
    accepted: ['marketing']
  },
  {
    name: 'Vendas',
    riddle: 'Transformo leads em pedidos, negocio prazos e condições. Quem sou eu?',
    accepted: ['vendas', 'comercial']
  },
  {
    name: 'Contas a Receber',
    riddle: 'Registro duplicatas, acompanho inadimplência e faço a cobrança. Quem sou eu?',
    accepted: ['contas a receber', 'carteira', 'cobrança', 'cobranca']
  },
  {
    name: 'Financeiro',
    riddle: 'Cuido do fluxo de caixa, capital de giro e pagamentos. Quem sou eu?',
    accepted: ['financeiro', 'tesouraria']
  },
  {
    name: 'Compras',
    riddle: 'Faço cotações, escolho fornecedores e emito pedidos. Quem sou eu?',
    accepted: ['compras', 'suprimentos']
  },
  {
    name: 'Estoques',
    riddle: 'Guardo, confiro e controlo materiais e produtos. Quem sou eu?',
    accepted: ['estoques', 'almoxarifado', 'almox']
  },
  {
    name: 'Produção',
    riddle: 'Transformo insumos em produtos dentro do prazo e padrão. Quem sou eu?',
    accepted: ['produção', 'producao', 'operações', 'operacoes']
  },
  {
    name: 'Logística',
    riddle: 'Planejo a distribuição e garanto a entrega no cliente. Quem sou eu?',
    accepted: ['logística', 'logistica', 'distribuição', 'distribuicao']
  }
];

// ================= PARÂMETROS DO JOGO =================
const GRID = 12;           // 12x12
const CELL = 50;           // px
const WALL = 1, FLOOR = 0, SLOT = 2;

// Layout: 0 chão, 1 parede, 2 slot
const map = [
  // Layout: 0 chão, 1 parede, 2 slot
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,1],
  //            4   5   6   7   (x)
  [1,0,0,0,2,  2,  2,  2, 0,0,0,1], // y=4 → slots #1..#4
  [1,0,0,0,2,  2,  2,  2, 0,0,0,1], // y=5 → slots #5..#8
  [1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1]
];

// Posições iniciais
const initialBlocks = [
  { name: SEQUENCE[0].name, x: 2, y: 2 }, // Marketing
  { name: SEQUENCE[1].name, x: 3, y: 3 }, // Vendas
  { name: SEQUENCE[2].name, x: 8, y: 2 }, // Contas a Receber
  { name: SEQUENCE[3].name, x: 2, y: 7 }, // Financeiro
  { name: SEQUENCE[4].name, x: 3, y: 9 }, // Compras
  { name: SEQUENCE[5].name, x: 6, y: 8 }, // Estoques
  { name: SEQUENCE[6].name, x: 9, y: 3 }, // Produção
  { name: SEQUENCE[7].name, x: 9, y: 7 }  // Logística
];
const initialPlayer = { x: 6, y: 10 };

// ================= ESTADO =================
let blocks = JSON.parse(JSON.stringify(initialBlocks));
let player = { ...initialPlayer };
let moveCount = 0;
let stageIndex = 0;                 // próximo slot a preencher
let lockedSlots = new Set();        // índices lineares de slots travados
let startTime = Date.now();
let timerInterval = null;

// ================= UTIL =================
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2000);
}
function resetGame(){
  blocks = JSON.parse(JSON.stringify(initialBlocks));
  player = { ...initialPlayer };
  moveCount = 0; stageIndex = 0; lockedSlots.clear();
  startTime = Date.now();
  document.getElementById('moves').textContent = 'Movimentos: 0';
  document.getElementById('stage').textContent = 'Etapa: 1';
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 500);
  draw();
}
function updateTimer(){
  const sec = Math.floor((Date.now()-startTime)/1000);
  const m = String(Math.floor(sec/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  document.getElementById('timer').textContent = `Tempo: ${m}:${s}`;
}
function cellToIndex(x,y){ return y*GRID + x; }

// slots no mapa (na ordem de leitura)
const slotCells = [];
for(let y=0;y<GRID;y++){
  for(let x=0;x<GRID;x++){
    if(map[y][x]===SLOT) slotCells.push({x,y});
  }
}
const slots = slotCells.slice(0, SEQUENCE.length);

// ================= DESENHO =================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function drawCell(x,y, color){
  ctx.fillStyle = color;
  ctx.fillRect(x*CELL, y*CELL, CELL, CELL);
}
function drawGrid(){
  for(let y=0;y<GRID;y++){
    for(let x=0;x<GRID;x++){
      if(map[y][x]===WALL) drawCell(x,y,'#1f2937');
      else if(map[y][x]===SLOT) drawCell(x,y,'#075985');
      else drawCell(x,y,'#0b1224');
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for(let i=0;i<=GRID;i++){
    ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL,GRID*CELL); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,i*CELL); ctx.lineTo(GRID*CELL,i*CELL); ctx.stroke();
  }
}
function drawSlots(){
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 16px Inter, system-ui';
  slots.forEach((s, i)=>{
    const idx = cellToIndex(s.x,s.y);
    if(lockedSlots.has(idx)){
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(s.x*CELL+6, s.y*CELL+6, CELL-12, CELL-12);
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.strokeRect(s.x*CELL+6, s.y*CELL+6, CELL-12, CELL-12);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(String(i+1), s.x*CELL + CELL/2, s.y*CELL + CELL/2);
  });
}
function roundedPath(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}
function wrapText(text, x, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line = '';
  let lines = [];
  for(let n=0;n<words.length;n++){
    const test = line + words[n] + ' ';
    if(ctx.measureText(test).width > maxWidth && n>0){
      lines.push(line.trim());
      line = words[n] + ' ';
    } else line = test;
  }
  lines.push(line.trim());
  const offset = (lines.length-1)*lineHeight/2;
  lines.forEach((ln,i)=>ctx.fillText(ln, x, y - offset + i*lineHeight));
}
function drawBlocks(){
  ctx.textAlign='center'; ctx.textBaseline='middle';
  blocks.forEach(b=>{
    const bx = b.x*CELL, by = b.y*CELL;
    ctx.fillStyle = '#6d28d9';
    roundedPath(bx+4, by+4, CELL-8, CELL-8, 10); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Inter, system-ui';
    wrapText(b.name, bx+CELL/2, by+CELL/2, CELL-14, 14);
  });
}
function drawPlayer(){
  const px = player.x*CELL, py = player.y*CELL;
  ctx.fillStyle = '#0d9488';
  roundedPath(px+6, py+6, CELL-12, CELL-12, 12); ctx.fill();
  ctx.font = 'bold 11px Inter, system-ui'; ctx.fillStyle='white';
  ctx.fillText('VOCÊ', px+CELL/2, py+CELL/2);
}
function draw(){
  ctx.clearRect(0,0,canvas.width, canvas.height);
  drawGrid();
  drawSlots();
  drawBlocks();
  drawPlayer();
}

// ================= MOVIMENTO =================
function blockAt(x,y){ return blocks.find(b=>b.x===x && b.y===y); }
function canPush(bx,by, dx,dy){
  const nx = bx+dx, ny = by+dy;
  if(nx<0||ny<0||nx>=GRID||ny>=GRID) return false;
  if(map[ny][nx]===WALL) return false;
  if(blockAt(nx,ny)) return false;
  return true;
}
function move(dx,dy){
  const nx = player.x+dx, ny = player.y+dy;
  if(nx<0||ny<0||nx>=GRID||ny>=GRID) return;
  if(map[ny][nx]===WALL) return;

  const blk = blockAt(nx,ny);
  if(blk){
    if(!canPush(blk.x, blk.y, dx,dy)) return;
    blk.x += dx; blk.y += dy;
    player.x = nx; player.y = ny;
    moveCount++; afterMove();
  } else {
    player.x = nx; player.y = ny;
    moveCount++; afterMove();
  }
}

// ================= REGRAS / ENIGMAS =================
function afterMove(){
  document.getElementById('moves').textContent = `Movimentos: ${moveCount}`;
  const nextSlot = slots[stageIndex];
  if(!nextSlot){ showToast('Parabéns! Você concluiu a sequência.'); return; }

  const b = blockAt(nextSlot.x, nextSlot.y);
  if(b){
    const expectedName = SEQUENCE[stageIndex].name;
    if(b.name !== expectedName){
      gameOver('Bloco incorreto no slot! Sequência reiniciada.');
      return;
    }
    const idx = cellToIndex(nextSlot.x,nextSlot.y);
    if(!lockedSlots.has(idx)){ openRiddle(stageIndex, b); }
  }
  draw();
}
function gameOver(msg){ showToast(msg); resetGame(); }

// Modal
const dlg = document.getElementById('dlg');
const dlgText = document.getElementById('dlgText');
const dlgAnswer = document.getElementById('dlgAnswer');
const dlgStage = document.getElementById('dlgStage');

function openRiddle(i){
  dlgStage.textContent = `#${i+1}`;
  dlgText.textContent = SEQUENCE[i].riddle + ' (Dica: responda com o nome do departamento)';
  dlgAnswer.value = '';
  dlg.showModal();

  function onClose(ev){
    if(ev.target.returnValue !== 'ok'){
      gameOver('Cancelou o enigma. Reiniciando…');
    }
    dlg.removeEventListener('close', onClose);
  }
  dlg.addEventListener('close', onClose, { once:true });

  document.getElementById('dlgOk').onclick = (e)=>{
    e.preventDefault();
    const ans = (dlgAnswer.value||'').trim().toLowerCase();
    const accepted = SEQUENCE[i].accepted;
    const ok = accepted.some(a=> ans === a || ans.includes(a));
    if(ok){
      dlg.close('ok');
      const s = slots[i];
      lockedSlots.add(cellToIndex(s.x,s.y));
      stageIndex++;
      document.getElementById('stage').textContent =
        `Etapa: ${stageIndex+1 > SEQUENCE.length ? '✔' : stageIndex+1}`;
      showToast('Correto! Slot travado.');
      draw();
      if(stageIndex>=SEQUENCE.length){
        setTimeout(()=>{
          alert(`Vitória! ${document.getElementById('timer').textContent} • Movimentos: ${moveCount}`);
        }, 150);
      }
    } else {
      dlg.close('ok');
      gameOver('Resposta incorreta! Sequência reiniciada.');
    }
  };
}

// ================= CONTROLES =================
window.addEventListener('keydown', (e)=>{
  if(dlg.open) return;
  const key = e.key.toLowerCase();
  if(['arrowup','w'].includes(key)) move(0,-1);
  else if(['arrowdown','s'].includes(key)) move(0,1);
  else if(['arrowleft','a'].includes(key)) move(-1,0);
  else if(['arrowright','d'].includes(key)) move(1,0);
});

document.getElementById('btnReset').onclick = resetGame;
document.getElementById('btnHow').onclick = ()=>{
  alert(
`Como jogar:

1) Use as setas (ou WASD) para mover o jogador.
2) Empurre blocos (departamentos) até os slots numerados (1..8).
3) O slot #1 espera o 1º departamento (Marketing), o #2 o segundo, e assim por diante.
4) Ao posicionar o bloco correto no slot, responda ao enigma.
5) Errou o bloco ou o enigma? Reinicia do zero.

Objetivo: completar a sequência no menor tempo e com menos movimentos.`
  );
};

// ================= INÍCIO =================
resetGame();
updateTimer();
draw();
