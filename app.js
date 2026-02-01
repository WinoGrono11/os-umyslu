/* ================= app.js - OS Umysłu v2 (stable) ================= */

/* -------- helpers -------- */
function $(id){ return document.getElementById(id) }
function nowISO(){ return new Date().toISOString() }
function shortDate(iso){ return new Date(iso).toLocaleString() }
function save(key, obj){ localStorage.setItem(key, JSON.stringify(obj)) }
function load(key, def){ try { return JSON.parse(localStorage.getItem(key))||def } catch(e){ return def } }
function uid(pref){ return pref + '_' + Date.now() + '_' + Math.floor(Math.random()*9999) }
function escapeHtml(s){ return (s||'').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\\'':'&#39;','\"':'&quot;'}[c])) }

/* -------- state (persisted) -------- */
let tasks = load('os_tasks', []);
let timeline = load('os_timeline', []);
let journal = load('os_journal', []);
let chillGallery = load('os_chill_gallery', []);
let assistantNotes = load('os_assistant', []);
let state = load('os_state', { points:0, streak:0 });

/* -------- views & clock -------- */
document.querySelectorAll('.nav-btn').forEach(b=>{
  b.addEventListener('click', ()=> {
    const v = b.getAttribute('data-view');
    document.querySelectorAll('main .view').forEach(x=>x.classList.add('hidden'));
    const el = $(v);
    if(el) el.classList.remove('hidden');
  });
});
setInterval(()=>{ const d=new Date(); $('clock').innerText = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) },1000);

/* -------- TASKS -------- */
function renderTasks(){
  const c = $('taskContainer'); c.innerHTML = '';
  tasks.forEach((t,i)=>{
    const div = document.createElement('div'); div.className = 'card';
    div.innerHTML = `
      <div class="card-head">
        <label><input type="checkbox" data-i="${i}" ${t.done?'checked':''}/></label>
        <div style="flex:1;margin-left:8px"><b>${escapeHtml(t.title)}</b><div class="mini">${t.priority} • ${t.points} pkt</div></div>
        <div class="meta">${t.subtasks? t.subtasks.length+' sub': ''}</div>
      </div>
      <div class="card-body">${t.note? escapeHtml(t.note):''}</div>
      <div class="card-actions">
        <button data-act="sub" data-i="${i}" class="btn-small">+Podzadanie</button>
        <button data-act="del" data-i="${i}" class="btn-small">Usuń</button>
      </div>
    `;
    c.appendChild(div);
  });
  // update points UI
  const points = tasks.filter(x=>x.done).reduce((s,x)=>s + (x.points||0), 0);
  $('pointsTotal').innerText = points;
  $('streak').innerText = state.streak || 0;
}

$('addTask').addEventListener('click', ()=>{
  const title = $('taskTitle').value.trim(); const points = parseInt($('taskPoints').value)||0; const priority = $('taskPriority').value;
  if(!title) return alert('Wpisz tytuł zadania');
  tasks.unshift({ id: uid('t'), title, points, priority, done:false, subtasks:[], note: '' });
  save('os_tasks', tasks);
  $('taskTitle').value=''; $('taskPoints').value='';
  renderTasks();
});

// checkbox toggle + actions
$('taskContainer').addEventListener('change', (e)=>{
  if(e.target.tagName === 'INPUT' && e.target.type === 'checkbox'){
    const i = parseInt(e.target.getAttribute('data-i'));
    if(Number.isFinite(i) && tasks[i]){
      tasks[i].done = e.target.checked;
      if(tasks[i].done){
        state.points = (state.points||0) + (tasks[i].points||0);
        // small visual bonus
        spawnBonus('+ ' + (tasks[i].points||0) + ' pkt');
      }
      save('os_tasks', tasks); save('os_state', state);
      renderTasks();
    }
  }
});

$('taskContainer').addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const act = btn.getAttribute('data-act'); const i = parseInt(btn.getAttribute('data-i'));
  if(act === 'del'){ if(confirm('Usuń zadanie?')){ tasks.splice(i,1); save('os_tasks',tasks); renderTasks(); } }
  if(act === 'sub'){ const t = prompt('Tytuł podzadania'); if(t){ tasks[i].subtasks = tasks[i].subtasks||[]; tasks[i].subtasks.push({id:uid('sub'), title: t, done:false}); save('os_tasks',tasks); renderTasks(); } }
});

/* -------- TIMELINE -------- */
function renderTimeline(){
  const graph = $('timelineGraph'); graph.innerHTML = '';
  const zoom = parseFloat($('zoomRange').value||1);
  // group by date
  const byDate = {};
  timeline.slice().sort((a,b)=> new Date(a.date+'T'+(a.time||'00:00')) - new Date(b.date+'T'+(b.time||'00:00')))
    .forEach(ev => { (byDate[ev.date] = byDate[ev.date]||[]).push(ev) });
  Object.keys(byDate).sort().forEach(date => {
    const day = document.createElement('div'); day.className = 'timeline-day'; day.style.transform = `scale(${zoom})`;
    const head = document.createElement('div'); head.className='timeline-day-head'; head.innerText = date;
    day.appendChild(head);
    byDate[date].forEach(ev=>{
      const item = document.createElement('div'); item.className='timeline-item';
      item.innerHTML = `<div class="ti-time">${ev.time||''}</div><div class="ti-text">${escapeHtml(ev.text)}</div>`;
      day.appendChild(item);
    });
    graph.appendChild(day);
  });
}

$('addTime').addEventListener('click', ()=>{
  const useNow = $('timeNowBtn').checked;
  const date = useNow ? new Date().toISOString().slice(0,10) : ($('timeDate').value || new Date().toISOString().slice(0,10));
  const time = useNow ? new Date().toTimeString().slice(0,5) : ($('timeHour').value || new Date().toTimeString().slice(0,5));
  const text = $('timeText').value.trim(); const type = $('timeType').value;
  if(!text) return alert('Dodaj opis wydarzenia');
  timeline.push({ id: uid('ev'), date, time, text, type });
  save('os_timeline', timeline);
  $('timeText').value = '';
  renderTimeline();
});
$('zoomRange').addEventListener('input', renderTimeline);

/* -------- JOURNAL -------- */
function renderJournal(){
  const ul = $('journalList'); ul.innerHTML = '';
  journal.slice().reverse().forEach(entry=>{
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<div class="card-head"><b>${escapeHtml(entry.title||'Wpis')}</b> <span class="mini">${shortDate(entry.date)}</span></div><div class="card-body">${escapeHtml(entry.text)}</div>`;
    ul.appendChild(li);
  });
}
$('saveJournal').addEventListener('click', ()=>{
  const t = $('journalText').value.trim(); if(!t) return alert('Nic do zapisania');
  journal.push({ id: uid('jr'), title: t.split('\n')[0].slice(0,60), text: t, date: nowISO() });
  save('os_journal', journal);
  $('journalText').value = '';
  renderJournal();
});
$('exportJournal').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(journal, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'journal_' + Date.now() + '.json'; a.click();
});
$('clearJournal').addEventListener('click', ()=>{
  if(confirm('Wyczyścić wszystkie wpisy dziennika?')){ journal = []; save('os_journal', journal); renderJournal(); }
});

/* -------- CHILL (paint) -------- */
const drawCanvas = $('drawCanvas'); const dctx = drawCanvas.getContext('2d');
let drawing = false, last = null, brushColor = '#222222', brushSize = 6, erasing = false;

function setupCanvas(){
  // size canvas in device pixels and preserve content
  const rect = drawCanvas.getBoundingClientRect();
  const DPR = window.devicePixelRatio || 1;
  const w = Math.max(600, Math.floor(rect.width));
  const h = Math.max(200, Math.floor(rect.height || 360));
  // save current image
  const prev = drawCanvas.toDataURL();
  drawCanvas.width = Math.floor(w * DPR);
  drawCanvas.height = Math.floor(h * DPR);
  drawCanvas.style.width = w + 'px';
  drawCanvas.style.height = h + 'px';
  dctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  dctx.lineCap = 'round'; dctx.lineJoin = 'round';
  if(prev){
    const img = new Image();
    img.onload = ()=> dctx.drawImage(img, 0, 0, w, h);
    img.src = prev;
  } else {
    dctx.fillStyle = '#ffffff'; dctx.fillRect(0,0,w,h);
  }
}
window.addEventListener('resize', ()=> { try{ setupCanvas(); }catch(e){} });
setupCanvas();

// pointer helpers
function posFromEvent(e){
  const r = drawCanvas.getBoundingClientRect();
  // supports pointer events and touch (clientX/Y)
  const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
  const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
  return { x: clientX - r.left, y: clientY - r.top };
}

function startDraw(e){ drawing = true; last = posFromEvent(e); e.preventDefault(); }
function endDraw(e){ drawing = false; last = null; e.preventDefault(); }
function moveDraw(e){ if(!drawing) return; const p = posFromEvent(e); dctx.strokeStyle = erasing ? '#ffffff' : brushColor; dctx.lineWidth = brushSize; dctx.beginPath(); dctx.moveTo(last.x, last.y); dctx.lineTo(p.x, p.y); dctx.stroke(); last = p; e.preventDefault(); }

drawCanvas.addEventListener('pointerdown', startDraw);
window.addEventListener('pointerup', endDraw);
drawCanvas.addEventListener('pointermove', moveDraw);
// touch fallback
drawCanvas.addEventListener('touchstart', (e)=> startDraw(e), {passive:false});
drawCanvas.addEventListener('touchmove', (e)=> moveDraw(e), {passive:false});
drawCanvas.addEventListener('touchend', (e)=> endDraw(e), {passive:false});

$('brushColor').addEventListener('change', e=>{ brushColor = e.target.value; erasing = false; });
$('brushSize').addEventListener('input', e=>{ brushSize = parseInt(e.target.value) || 6; });
$('eraser').addEventListener('click', ()=>{ erasing = true; });

$('clearCanvas').addEventListener('click', ()=>{
  const w = drawCanvas.clientWidth, h = drawCanvas.clientHeight;
  dctx.clearRect(0,0, w, h);
  dctx.fillStyle = '#ffffff'; dctx.fillRect(0,0,w,h);
});

$('saveChill').addEventListener('click', ()=>{
  const dataUrl = drawCanvas.toDataURL('image/png');
  const note = $('chillNotes').value.trim();
  const entry = { id: uid('cg'), img: dataUrl, note, date: nowISO() };
  chillGallery.unshift(entry);
  save('os_chill_gallery', chillGallery);
  $('chillNotes').value = '';
  renderChillGallery();
  spawnBonus('+ rysunek');
});

function renderChillGallery(){
  const g = $('chillGallery'); g.innerHTML = '';
  chillGallery.forEach(it=>{
    const li = document.createElement('div'); li.className='card';
    li.innerHTML = `<div class="card-head"><span class="mini">${shortDate(it.date)}</span></div>
      <div class="card-body"><img src="${it.img}" style="max-width:100%;height:auto;border-radius:6px;margin-bottom:6px" /><div class="mini">${escapeHtml(it.note||'')}</div></div>`;
    g.appendChild(li);
  });
}

// random chaos
$('randomChaos').addEventListener('click', ()=>{
  // draw shapes
  const colors = ['#ff6666','#66ccff','#ffcc66','#66ff99','#d9b3ff'];
  for(let i=0;i<12;i++){
    dctx.fillStyle = colors[Math.floor(Math.random()*colors.length)];
    const x = Math.random()*drawCanvas.clientWidth; const y = Math.random()*drawCanvas.clientHeight;
    const s = 8 + Math.random()*80;
    dctx.beginPath(); dctx.arc(x,y,s,0,Math.PI*2); dctx.fill();
  }
  // give random small points
  const bonus = Math.floor(2 + Math.random()*10);
  state.points = (state.points||0) + bonus; save('os_state', state); spawnBonus('+'+bonus+' pkt');
});

/* -------- ASSISTANT NOTES -------- */
function renderAssistant(){
  const ul = $('assistantList'); ul.innerHTML = '';
  assistantNotes.slice().reverse().forEach(n=>{
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<div class="card-head"><b>${escapeHtml(n.title||'Notatka')}</b> <span class="mini">${shortDate(n.date)}</span></div>
      <div class="card-body">${n.image?('<img src="'+n.image+'" style="max-width:220px;border-radius:6px;margin-bottom:6px"/>') : ''}${escapeHtml(n.summary||n.text||'')}</div>`;
    ul.appendChild(li);
  });
}

$('copyPrompt').addEventListener('click', ()=>{
  const prompt = `Proszę przygotuj zwięzłe notatki na temat: <TU_TEMAT> i odpowiedz wyłącznie JSON-em w takim formacie:\n{\n  \"title\":\"Tytuł\",\n  \"date\":\"YYYY-MM-DD\",\n  \"summary\":\"3-6 zdań\",\n  \"action_items\":[\"krok1\",\"krok2\"],\n  \"tags\":[\"tag1\"]\n}`;
  navigator.clipboard.writeText(prompt).then(()=>alert('Skopiowano prompt DeepThinking'));
});

// image preview upload
$('assistantImage').addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=> {
    $('assistantPreview').style.display = 'block';
    $('assistantPreview').innerHTML = `<img src="${reader.result}" style="max-width:220px;border-radius:6px;margin-bottom:6px;display:block">`;
    $('assistantPreview').dataset.image = reader.result;
  };
  reader.readAsDataURL(f);
});

$('previewAssistant').addEventListener('click', ()=>{
  const t = $('assistantInput').value.trim(); if(!t) return alert('Wklej tekst od asystenta');
  try{
    const p = JSON.parse(t);
    $('assistantPreview').style.display='block';
    $('assistantPreview').innerHTML = `<b>${escapeHtml(p.title||'Notatka')}</b><div class="mini">${escapeHtml(p.date||'')}</div><div style="margin-top:6px">${escapeHtml(p.summary||'')}</div>`;
  }catch(e){
    $('assistantPreview').style.display='block';
    $('assistantPreview').innerText = t;
  }
});

$('saveAssistant').addEventListener('click', ()=>{
  const txt = $('assistantInput').value.trim(); const img = $('assistantPreview').dataset.image || null;
  if(!txt && !img) return alert('Brak treści do zapisania');
  let parsed = null;
  try{ parsed = JSON.parse(txt) }catch(e){ parsed = { title: (txt.split('\n')[0]||'Notatka'), summary: txt } }
  const entry = { id: uid('as'), title: parsed.title||'Notatka', summary: parsed.summary||parsed.text||'', date: nowISO(), image: img };
  assistantNotes.push(entry);
  save('os_assistant', assistantNotes);
  $('assistantInput').value = ''; $('assistantPreview').style.display='none'; delete $('assistantPreview').dataset.image;
  renderAssistant(); alert('Zapisano notatkę od asystenta');
});

/* -------- EXPORT / IMPORT (full state) -------- */
$('btnExport').addEventListener('click', ()=>{
  const dump = { tasks, timeline, journal, chillGallery, assistantNotes, state };
  const blob = new Blob([JSON.stringify(dump,null,2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'osumyslu_export_' + Date.now() + '.json'; a.click();
});

$('importFile').addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=> {
    try{
      const d = JSON.parse(r.result);
      tasks = d.tasks || []; timeline = d.timeline || []; journal = d.journal || [];
      chillGallery = d.chillGallery || []; assistantNotes = d.assistantNotes || []; state = d.state || state;
      save('os_tasks', tasks); save('os_timeline', timeline); save('os_journal', journal); save('os_chill_gallery', chillGallery); save('os_assistant', assistantNotes); save('os_state', state);
      renderAll(); alert('Zaimportowano stan');
    }catch(err){
      alert('Błąd importu: nieprawidłowy plik');
    }
  };
  r.readAsText(f);
});

/* -------- small UI helpers -------- */
function spawnBonus(text){
  const el = document.createElement('div'); el.className = 'bonus'; el.innerText = text;
  document.body.appendChild(el);
  setTimeout(()=> el.style.transform = 'translateY(-12px)', 20);
  setTimeout(()=> el.remove(), 1200);
}

/* -------- render everything and autosave -------- */
function renderAll(){
  renderTasks(); renderTimeline(); renderJournal(); renderChillGallery(); renderAssistant();
}
renderAll();

// autosave (safety)
setInterval(()=>{
  save('os_tasks', tasks); save('os_timeline', timeline); save('os_journal', journal); save('os_chill_gallery', chillGallery); save('os_assistant', assistantNotes); save('os_state', state);
}, 10000);

// safe init: ensure canvas has white bg if empty
if(chillGallery.length===0 && drawCanvas){
  // ensure initial white bg
  const w = drawCanvas.clientWidth, h = drawCanvas.clientHeight;
  try{ dctx.fillStyle = '#ffffff'; dctx.fillRect(0,0, Math.max(w,600), Math.max(h,300)); } catch(e){}
}

console.log('OS-Umysłu v2 stable loaded');
