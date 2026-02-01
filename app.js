// OS Umysłu v1 - app logic

// --- Helper Functions ---
function $(id) { return document.getElementById(id); }
function showSection(sectionId) {
    ['tasksSection','timelineSection','chillSection','diarySection'].forEach(id => {
        $(id).classList.add('hidden');
    });
    $(sectionId).classList.remove('hidden');
}

// --- Navigation ---
$('btnTasks').addEventListener('click', () => showSection('tasksSection'));
$('btnTimeline').addEventListener('click', () => showSection('timelineSection'));
$('btnChill').addEventListener('click', () => showSection('chillSection'));
$('btnDiary').addEventListener('click', () => showSection('diarySection'));

// --- Giga Lista Zadań ---
let tasks = [];

function renderTasks() {
    const ul = $('taskList');
    ul.innerHTML = '';
    tasks.forEach((t, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<input type='checkbox' data-index='${i}' ${t.done ? 'checked' : ''}> ${t.name} [${t.points} pkt]`;
        ul.appendChild(li);
    });
}

$('addTaskBtn').addEventListener('click', () => {
    const name = $('newTask').value.trim();
    const points = parseInt($('taskPoints').value) || 0;
    if(name) {
        tasks.push({name, points, done:false});
        $('newTask').value=''; $('taskPoints').value='';
        renderTasks();
    }
});

$('taskList').addEventListener('change', e => {
    if(e.target.type === 'checkbox') {
        const idx = e.target.dataset.index;
        tasks[idx].done = e.target.checked;
    }
});

// --- Oś Czasu ---
let events = [];
$('addEventBtn').addEventListener('click', () => {
    const title = prompt('Nazwa wydarzenia');
    if(title){
        const date = new Date().toISOString().split('T')[0];
        events.push({title, date});
        renderTimeline();
    }
});

function renderTimeline(){
    const container = $('timeline');
    container.innerHTML='';
    events.forEach(ev=>{
        const div = document.createElement('div');
        div.textContent = `${ev.date}: ${ev.title}`;
        div.style.borderBottom='1px dashed #aaa';
        container.appendChild(div);
    });
}

// --- Strefa Chill ---
const chillCanvas = $('chillCanvas');
const ctx = chillCanvas.getContext('2d');
let drawing=false;
chillCanvas.addEventListener('mousedown',()=>drawing=true);
chillCanvas.addEventListener('mouseup',()=>drawing=false);
chillCanvas.addEventListener('mousemove',(e)=>{
    if(drawing){
        const rect = chillCanvas.getBoundingClientRect();
        ctx.fillStyle='rgba(100,150,200,0.5)';
        ctx.beginPath();
        ctx.arc(e.clientX-rect.left,e.clientY-rect.top,5,0,Math.PI*2);
        ctx.fill();
    }
});

// --- Dziennik Szyfrowany ---
async function getKey(password){
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey({name:'PBKDF2', salt:enc.encode('osumyslu_salt'), iterations:100000, hash:'SHA-256'}, keyMaterial, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}

async function encryptDiary(text,password){
    const key = await getKey(password);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(text));
    const blob = new Uint8Array(cipher);
    const combined = new Uint8Array(iv.length + blob.length);
    combined.set(iv,0); combined.set(blob,iv.length);
    return btoa(String.fromCharCode(...combined));
}

async function decryptDiary(data,password){
    const key = await getKey(password);
    const combined = Uint8Array.from(atob(data),c=>c.charCodeAt(0));
    const iv = combined.slice(0,12);
    const cipher = combined.slice(12);
    const dec = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, cipher);
    return new TextDecoder().decode(dec);
}

$('saveDiaryBtn').addEventListener('click',async()=>{
    const pw = $('diaryPassword').value;
    const txt = $('diaryInput').value;
    if(pw && txt){
        const enc = await encryptDiary(txt,pw);
        localStorage.setItem('diary',enc);
        alert('Zapisano!');
    }
});

$('loadDiaryBtn').addEventListener('click',async()=>{
    const pw = $('diaryPassword').value;
    const data = localStorage.getItem('diary');
    if(pw && data){
        try{
            const txt = await decryptDiary(data,pw);
            $('diaryInput').value=txt;
        }catch(e){alert('Błędne hasło lub brak danych');}
    }
});

// --- Chaos / Easter Eggs ---
setInterval(()=>{
    if(Math.random()<0.01){
        alert('🎉 Easter Egg: Znaleziono losowy bonus!');
    }
},5000);

console.log('OS Umysłu v1 - gotowe do użycia!');
