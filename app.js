/* ================= app.js - OS Umysłu v2 ================= */

// ===== UTILS =====
function escapeHtml(s){ return (s||'').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c])); }

function $(id){ return document.getElementById(id); }

function showView(viewId){
    document.querySelectorAll('main .view').forEach(v=>v.classList.add('hidden'));
    $(viewId).classList.remove('hidden');
}

// ===== NAVIGATION =====
document.querySelectorAll('nav button[data-view]').forEach(btn=>{
    btn.addEventListener('click', ()=> showView(btn.getAttribute('data-view')));
});

// ================= GIGA LISTA ZADAŃ =================
let tasks = JSON.parse(localStorage.getItem('tasks')||'[]');
let totalPoints = 0;

function renderTasks(){
    const ul = $('taskList'); ul.innerHTML=''; totalPoints=0;
    tasks.forEach((t,i)=>{
        const li = document.createElement('li');
        li.innerHTML=`<input type='checkbox' data-id='${i}' ${t.done?'checked':''}/> <b>${escapeHtml(t.title)}</b> (${t.points} pkt)`;
        ul.appendChild(li);
        if(t.done) totalPoints += t.points;
    });
    $('pointsTotal').innerText=totalPoints;
}

$('addTask').addEventListener('click', ()=>{
    const title = $('taskTitle').value.trim();
    const points = parseInt($('taskPoints').value) || 0;
    if(!title) return;
    tasks.push({title, points, done:false});
    localStorage.setItem('tasks', JSON.stringify(tasks));
    $('taskTitle').value=''; $('taskPoints').value='';
    renderTasks();
});

$('taskList').addEventListener('change', e=>{
    if(e.target.tagName==='INPUT' && e.target.type==='checkbox'){
        const idx = parseInt(e.target.getAttribute('data-id'));
        tasks[idx].done=e.target.checked;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }
});

renderTasks();

// ================= OŚ CZASU =================
let timeline = JSON.parse(localStorage.getItem('timeline')||'[]');

function renderTimeline(){
    const div = $('timelineGraph'); div.innerHTML='';
    timeline.sort((a,b)=> new Date(a.date+'T'+(a.time||'00:00')) - new Date(b.date+'T'+(b.time||'00:00')));
    timeline.forEach(ev=>{
        const d = document.createElement('div');
        d.className='timeline-event';
        d.innerText=`${ev.date} ${ev.time||''} → ${ev.text}`;
        div.appendChild(d);
    });
}

$('addTime').addEventListener('click', ()=>{
    const date=$('timeDate').value; const time=$('timeHour').value; const text=$('timeText').value.trim();
    if(!date || !text) return;
    timeline.push({date,time,text});
    localStorage.setItem('timeline', JSON.stringify(timeline));
    $('timeDate').value=''; $('timeHour').value=''; $('timeText').value='';
    renderTimeline();
});

renderTimeline();

// ================= DZIENNIK =================
let journal = JSON.parse(localStorage.getItem('journal')||'[]');

function renderJournal(){
    const ul = $('journalList'); ul.innerHTML='';
    journal.forEach((entry,i)=>{
        const li = document.createElement('li'); li.innerText=`${entry.date}: ${entry.text}`;
        ul.appendChild(li);
    });
}

$('saveJournal').addEventListener('click', ()=>{
    const text=$('journalText').value.trim();
    if(!text) return;
    journal.push({text,date:new Date().toLocaleString()});
    localStorage.setItem('journal', JSON.stringify(journal));
    $('journalText').value='';
    renderJournal();
});

renderJournal();

// ================= STREFA CHILL =================
const canvas = $('drawCanvas'); const ctx = canvas.getContext('2d');
function resizeCanvas(){ canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

let drawing=false;
canvas.addEventListener('mousedown', ()=>drawing=true);
canvas.addEventListener('mouseup', ()=>drawing=false);
canvas.addEventListener('mousemove', e=>{
    if(!drawing) return;
    const rect=canvas.getBoundingClientRect();
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(e.clientX-rect.left,e.clientY-rect.top,4,4);
});

$('clearCanvas').addEventListener('click', ()=>ctx.clearRect(0,0,canvas.width,canvas.height));

$('randomChaos').addEventListener('click', ()=>{
    alert('✨ Bonus Chaos!');
    // random easter egg
});

// ================= ASSISTANT NOTES =================
let assistantNotes = JSON.parse(localStorage.getItem('assistantNotes')||'[]');
function renderAssistant(){
    const ul=$('assistantList'); ul.innerHTML='';
    assistantNotes.slice().reverse().forEach(n=>{
        const li=document.createElement('li'); li.innerHTML=`<b>${escapeHtml(n.title)}</b> <span class='mini'>(${n.date})</span><div>${escapeHtml(n.summary)}</div>`;
        ul.appendChild(li);
    });
}

$('copyPrompt').addEventListener('click', ()=>{
    const prompt=`Proszę przygotuj notatki na temat: <TU_TEMAT> w formacie JSON:
{
  "title":"Tytuł",
  "date":"YYYY-MM-DD",
  "summary":"Streszczenie 3-6 zdań",
  "action_items":["kroki"],
  "tags":["tag1"]
}`;
    navigator.clipboard.writeText(prompt);
    alert('Skopiowano prompt DeepThinking');
});

$('previewAssistant').addEventListener('click', ()=>{
    const text=$('assistantInput').value;
    $('assistantPreview').style.display='block';
    $('assistantPreview').innerText=text;
});

$('saveAssistant').addEventListener('click', ()=>{
    const text=$('assistantInput').value.trim();
    if(!text) return;
    assistantNotes.push({title:'Notatka', summary:text, date:new Date().toLocaleString()});
    localStorage.setItem('assistantNotes', JSON.stringify(assistantNotes));
    $('assistantInput').value='';
    $('assistantPreview').style.display='none';
    renderAssistant();
});

renderAssistant();

// ================= EASTER EGGS =================
setInterval(()=>{
    if(Math.random()<0.01) alert('🎉 Losowy bonus chaos!');
},60000);
