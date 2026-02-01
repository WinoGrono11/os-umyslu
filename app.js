/* ================= app.js - OS Umysłu v2 (complete) ================= */

/* ======= Utilities ======= */
function $(id){return document.getElementById(id)}
function nowISO(){return new Date().toISOString()}
function shortDate(d){const dt=new Date(d);return dt.toLocaleString();}
function save(key,obj){localStorage.setItem(key, JSON.stringify(obj))}
function load(key,def){try{return JSON.parse(localStorage.getItem(key))||def}catch(e){return def}}
function uid(prefix){return prefix+'_'+Date.now()+'_'+Math.floor(Math.random()*1000)}

/* ======= Views & Clock ======= */
const views = document.querySelectorAll('nav .nav-btn')
views.forEach(b=>b.addEventListener('click', ()=>{showView(b.getAttribute('data-view'))}))
function showView(id){document.querySelectorAll('main .view').forEach(v=>v.classList.add('hidden')); $(id).classList.remove('hidden')}
setInterval(()=>{const d=new Date(); $('clock').innerText=d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'} )},1000)

/* ======= Data stores ======= */
let tasks = load('os_tasks',[])
let timeline = load('os_timeline',[])
let journal = load('os_journal',[])
let chillGallery = load('os_chill_gallery',[])
let assistantNotes = load('os_assistant',[])
let state = load('os_state',{points:0,streak:0})

/* ======= TASKS ======= */
function renderTasks(){
  const container = $('taskContainer'); container.innerHTML=''
  tasks.forEach((t,i)=>{
    const card=document.createElement('div'); card.className='card';
    const doneCls = t.done? 'done':'';
    card.innerHTML = `
      <div class="card-head ${doneCls}"><input type="checkbox" data-i="${i}" ${t.done? 'checked':''}> <b>${escapeHtml(t.title)}</b>
        <span class="meta">${t.points} pkt • ${t.priority}</span>
      </div>
      <div class="card-body mini">${t.subtasks? t.subtasks.length+' podzadań':''}</div>
      <div class="card-actions">
        <button class="btn-small" data-action="addSub" data-i="${i}">+ podzadanie</button>
        <button class="btn-small" data-action="del" data-i="${i}">usuń</button>
      </div>`
    container.appendChild(card)
  })
  $('pointsTotal').innerText = state.points || 0
  $('streak').innerText = state.streak || 0
}

$('addTask').addEventListener('click', ()=>{
  const title=$('taskTitle').value.trim(); const points=parseInt($('taskPoints').value)||0; const priority=$('taskPriority').value
  if(!title) return alert('Wpisz tytuł zadania')
  tasks.unshift({id:uid('task'),title,points,priority,done:false,subtasks:[]})
  save('os_tasks',tasks); $('taskTitle').value=''; $('taskPoints').value=''; renderTasks()
})

$('taskContainer').addEventListener('change', e=>{
  if(e.target.type==='checkbox'){const i=parseInt(e.target.getAttribute('data-i')); tasks[i].done = e.target.checked; if(tasks[i].done){ state.points = (state.points||0) + (tasks[i].points||0); popBonus(); } save('os_tasks',tasks); save('os_state',state); renderTasks();}
})

$('taskContainer').addEventListener('click', e=>{
  const btn = e.target.closest('button'); if(!btn) return; const act=btn.getAttribute('data-action'); const i=parseInt(btn.getAttribute('data-i'))
  if(act==='del'){ if(confirm('Usuń zadanie?')){ tasks.splice(i,1); save('os_tasks',tasks); renderTasks() } }
  if(act==='addSub'){ const txt=prompt('Nazwa podzadania'); if(txt){ tasks[i].subtasks = tasks[i].subtasks||[]; tasks[i].subtasks.push({id:uid('sub'),title:txt,done:false}); save('os_tasks',tasks); renderTasks() } }
})

function popBonus(){ // small visual + confetti dot
  state.lastBonus = Date.now(); save('os_state',state);
  const el=document.createElement('div'); el.className='bonus'; el.textContent='+BONUS'; document.body.appendChild(el);
  setTimeout(()=>el.remove(),1200);
}

/* ======= TIMELINE ======= */
function renderTimeline(){
  const graph=$('timelineGraph'); graph.innerHTML=''
  const zoom = parseFloat($('zoomRange').value||1)
  // group by date
  const byDate = {}
  timeline.slice().sort((a,b)=> new Date(a.date+'T'+(a.time||'00:00')) - new Date(b.date+'T'+(b.time||'00:00'))).forEach(ev=>{ byDate[ev.date]=byDate[ev.date]||[]; byDate[ev.date].push(ev) })
  Object.keys(byDate).sort().forEach(date=>{
    const day = document.createElement('div'); day.className='timeline-day'; day.style.transform = `scale(${zoom})`;
    const hdr = document.createElement('div'); hdr.className='timeline-day-head'; hdr.textContent = date; day.appendChild(hdr);
    byDate[date].forEach(ev=>{
      const e = document.createElement('div'); e.className='timeline-item'; e.innerHTML = `<div class="ti-time">${ev.time||''}</div><div class="ti-text">${escapeHtml(ev.text)}</div>`; day.appendChild(e)
    })
    graph.appendChild(day)
  })
}

$('addTime').addEventListener('click', ()=>{
  const useNow = $('timeNowBtn').checked
  const date = useNow? new Date().toISOString().slice(0,10) : ($('timeDate').value || new Date().toISOString().slice(0,10))
  const time = useNow? new Date().toTimeString().slice(0,5) : ($('timeHour').value || new Date().toTimeString().slice(0,5))
  const text = $('timeText').value.trim(); const type = $('timeType').value
  if(!text) return alert('Dodaj opis wydarzenia')
  timeline.push({id:uid('ev'),date,time,text,type}); save('os_timeline',timeline); $('timeText').value=''; renderTimeline()
})
$('zoomRange').addEventListener('input', renderTimeline)
renderTimeline()

/* ======= JOURNAL ======= */
function renderJournal(){ const ul=$('journalList'); ul.innerHTML=''; journal.slice().reverse().forEach(e=>{ const li=document.createElement('li'); li.className='card'; li.innerHTML=`<div class="card-head"><b>${escapeHtml(e.title||'Wpis')}</b> <span class="mini">${shortDate(e.date)}</span></div><div class="card-body">${escapeHtml(e.text)}</div>`; ul.appendChild(li) }) }
$('saveJournal').addEventListener('click', ()=>{ const t=$('journalText').value.trim(); if(!t) return alert('Nic do zapisania'); journal.push({id:uid('jr'),title:t.split('\n')[0].slice(0,40),text:t,date:nowISO()}); save('os_journal',journal); $('journalText').value=''; renderJournal() })
$('exportJournal').addEventListener('click', ()=>{ const blob=new Blob([JSON.stringify(journal,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='journal_'+Date.now()+'.json'; a.click(); })
$('clearJournal').addEventListener('click', ()=>{ if(confirm('Wyczyścić wszystkie wpisy?')){ journal=[]; save('os_journal',journal); renderJournal() } })
renderJournal()

/* ======= CHILL (Paint + gallery) ======= */
const drawCanvas = $('drawCanvas'); const dctx = drawCanvas.getContext('2d');
function fitCanvas(){ const r=drawCanvas.getBoundingClientRect(); drawCanvas.width = Math.floor(r.width * devicePixelRatio); drawCanvas.height = Math.floor(r.height * devicePixelRatio); dctx.scale(devicePixelRatio, devicePixelRatio); }
window.addEventListener('resize', ()=>{ // retain drawing by storing image
  const img = drawCanvas.toDataURL(); fitCanvas(); const i=new Image(); i.onload=()=> dctx.drawImage(i,0,0); i.src=img;
});
// initial sizing
(function initCanvas(){ drawCanvas.style.width='100%'; drawCanvas.style.height='360px'; fitCanvas(); dctx.fillStyle='white'; dctx.fillRect(0,0,drawCanvas.width,drawCanvas.height) })()

let drawing=false; let last=null; let brushColor='#2b2b2b'; let brushSize=6; let erasing=false

function getXY(e){const r=drawCanvas.getBoundingClientRect(); const x=(e.clientX - r.left); const y=(e.clientY - r.top); return {x,y}}

function startDraw(e){ drawing=true; last=getXY(e) }
function endDraw(e){ drawing=false; last=null }
function drawMove(e){ if(!drawing) return; const p=getXY(e); dctx.beginPath(); dctx.lineCap='round'; dctx.lineJoin='round'; dctx.strokeStyle = erasing? '#fff': brushColor; dctx.lineWidth = brushSize; dctx.moveTo(last.x,last.y); dctx.lineTo(p.x,p.y); dctx.stroke(); last=p }

drawCanvas.addEventListener('pointerdown', startDraw); window.addEventListener('pointerup', endDraw); drawCanvas.addEventListener('pointermove', drawMove)

$('brushColor').addEventListener('change', e=>{ brushColor=e.target.value; erasing=false })
$('brushSize').addEventListener('input', e=>{ brushSize=parseInt(e.target.value) })
$('eraser').addEventListener('click', ()=>{ erasing=true })
$('clearCanvas').addEventListener('click', ()=>{ dctx.clearRect(0,0,drawCanvas.width,drawCanvas.height); dctx.fillStyle='white'; dctx.fillRect(0,0,drawCanvas.width,drawCanvas.height) })

$('saveChill').addEventListener('click', ()=>{
  const url = drawCanvas.toDataURL('image/png'); const note = $('chillNotes').value.trim(); const entry = {id:uid('cg'),img:url,note,date:nowISO()}; chillGallery.unshift(entry); save('os_chill_gallery',chillGallery); $('chillNotes').value=''; renderChillGallery(); popBonus(); alert('Zapisano rysunek do galerii')
})

function renderChillGallery(){ const g=$('chillGallery'); g.innerHTML=''; chillGallery.forEach(it=>{ const li=document.createElement('div'); li.className='card'; li.innerHTML = `<div class="card-head"><span class="mini">${shortDate(it.date)}</span></div><div class="card-body"><img src="${it.img}" alt="rysunek" style="max-width:100%;height:auto;border-radius:6px"/><div class="mini">${escapeHtml(it.note||'')}</div></div>`; g.appendChild(li) }) }
renderChillGallery()

// random chaos: change canvas background, draw random shapes, give bonus points
$('randomChaos').addEventListener('click', ()=>{
  // random bg
  const cols = ['#fff8e1','#e8f8f5','#fff0f6','#f3f3ff','#e8ffe8']; const c = cols[Math.floor(Math.random()*cols.length)]; drawCanvas.style.background=c
  // draw some shapes
  for(let i=0;i<10;i++){ dctx.fillStyle = ['#ff6666','#66ccff','#ffcc66','#66ff99'][Math.floor(Math.random()*4)]; const x=Math.random()*drawCanvas.clientWidth; const y=Math.random()*drawCanvas.clientHeight; const s=5+Math.random()*80; dctx.beginPath(); dctx.arc(x,y,s,0,Math.PI*2); dctx.fill() }
  // bonus
  state.points = (state.points||0) + Math.floor(2+Math.random()*10); save('os_state',state); renderTasks(); popBonus(); alert('Bonus Chaos! + punkty przyznane')
})

/* ======= ASSISTANT NOTES (image upload + parse) ======= */
function renderAssistant(){ const ul=$('assistantList'); ul.innerHTML=''; assistantNotes.slice().reverse().forEach(n=>{ const li=document.createElement('li'); li.className='card'; li.innerHTML=`<div class="card-head"><b>${escapeHtml(n.title||'Notatka')}</b> <span class="mini">${shortDate(n.date)}</span></div><div class="card-body">${n.image?'<img src="'+n.image+'" style="max-width:200px;border-radius:6px;margin-bottom:6px"/>':''}${escapeHtml(n.summary||n.text||'')}</div>`; ul.appendChild(li) }) }

$('copyPrompt').addEventListener('click', ()=>{ const p=`Proszę przygotuj zwięzłe notatki na temat: <TU_TEMAT> i zwróć tylko JSON w formacie:\n{\n "title":"tytul",\n "date":"YYYY-MM-DD",\n "summary":"3-6 zdań",\n "action_items":["kroki"],\n "tags":["tag1"]\n}`; navigator.clipboard.writeText(p); alert('Skopiowano prompt DeepThinking') })

// image upload for assistant
$('assistantImage').addEventListener('change', e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ $('assistantPreview').style.display='block'; $('assistantPreview').innerHTML=`<img src="${r.result}" style="max-width:220px;border-radius:6px;display:block;margin-bottom:6px">`; $('assistantPreview').dataset.image = r.result } ; r.readAsDataURL(f) })

$('previewAssistant').addEventListener('click', ()=>{ const txt=$('assistantInput').value.trim(); if(!txt) return alert('Wklej tekst'); // try parse JSON
  try{ const p = JSON.parse(txt); $('assistantPreview').style.display='block'; $('assistantPreview').innerHTML = `<b>${escapeHtml(p.title||'Notatka')}</b><div class='mini'>${escapeHtml(p.date||'')}</div><div style='margin-top:6px'>${escapeHtml(p.summary||JSON.stringify(p))}</div>` }catch(e){ $('assistantPreview').style.display='block'; $('assistantPreview').innerText = txt }
})

$('saveAssistant').addEventListener('click', ()=>{
  let img = $('assistantPreview').dataset.image || null; const txt=$('assistantInput').value.trim(); let parsed=null;
  try{ parsed = JSON.parse(txt) }catch(e){ parsed = {title: (txt.split('\n')[0]||'Notatka'), summary: txt} }
  const ent = {id:uid('as'), title: parsed.title||'Notatka', summary: parsed.summary||parsed.text||'', date: nowISO(), image: img}
  assistantNotes.push(ent); save('os_assistant',assistantNotes); $('assistantInput').value=''; $('assistantPreview').style.display='none'; delete $('assistantPreview').dataset.image; renderAssistant(); alert('Zapisano notatkę od asystenta')
})
renderAssistant()

/* ======= Export / Import (full state) ======= */
$('btnExport').addEventListener('click', ()=>{
  const dump = {tasks,timeline,journal,chillGallery,assistantNotes,state}; const blob=new Blob([JSON.stringify(dump,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='osumyslu_export_'+Date.now()+'.json'; a.click();
})
$('importFile').addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const d=JSON.parse(r.result); tasks=d.tasks||[]; timeline=d.timeline||[]; journal=d.journal||[]; chillGallery=d.chillGallery||[]; assistantNotes=d.assistantNotes||[]; state=d.state||state; save('os_tasks',tasks); save('os_timeline',timeline); save('os_journal',journal); save('os_chill_gallery',chillGallery); save('os_assistant',assistantNotes); save('os_state',state); alert('Zaimportowano stan. Odświeżam widoki.'); renderAll(); }catch(err){ alert('Błąd importu: nieprawidłowy plik') } } ; r.readAsText(f) })

/* ======= Helpers & init ======= */
function renderAll(){ renderTasks(); renderTimeline(); renderJournal(); renderChillGallery(); renderAssistant() }
renderAll()

// little auto-save hook every 10s
setInterval(()=>{ save('os_tasks',tasks); save('os_timeline',timeline); save('os_journal',journal); save('os_chill_gallery',chillGallery); save('os_assistant',assistantNotes); save('os_state',state) },10000)

/* small confetti like effect when page loads (hidden early) */
(function tinyStart(){ const el=document.createElement('div'); el.className='start-spark'; document.body.appendChild(el); setTimeout(()=>el.remove(),800) })()

console.log('OS‑Umysłu v2 — app.js loaded')
