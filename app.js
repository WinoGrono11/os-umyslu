// --- STATE ---
let journal = JSON.parse(localStorage.getItem("journal")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let points = Number(localStorage.getItem("points")) || 0;

// --- ELEMENTS ---
const journalInput = document.getElementById("journalInput");
const journalList = document.getElementById("journalList");
const addJournalBtn = document.getElementById("addJournal");
const journalHeader = document.getElementById("journalHeader");

const taskTitle = document.getElementById("taskTitle");
const taskDesc = document.getElementById("taskDesc");
const taskPoints = document.getElementById("taskPoints");
const addTaskBtn = document.getElementById("addTask");
const tasksDiv = document.getElementById("tasks");
const pointsSpan = document.getElementById("points");

const exportBtn = document.getElementById("exportData");
const importBtn = document.getElementById("importData");
const importFile = document.getElementById("importFile");

// --- JOURNAL ---
function renderJournal() {
  journalList.innerHTML = "";
  let lastDay = null;

  journal.forEach(e => {
    const day = e.date.split(",")[0];

    if (day !== lastDay) {
      const sep = document.createElement("div");
      sep.className = "day-separator";
      sep.textContent = day;
      journalList.prepend(sep);
      lastDay = day;
    }

    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <div class="date">${e.date}</div>
      <div class="journal-text">${e.text}</div>
    `;
    journalList.prepend(div);
  });
}

addJournalBtn.onclick = () => {
  if (!journalInput.value.trim()) return;
  journal.push({
    date: new Date().toLocaleString(),
    text: journalInput.value
  });
  journalInput.value = "";
  save();
  renderJournal();
};

// Tryb skupienia
journalHeader.onclick = () => {
  document.body.classList.toggle("focus-mode");
};

// --- TASKS ---
function renderTasks() {
  tasksDiv.innerHTML = "";
  tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task";
    div.innerHTML = `
      <input type="checkbox" ${t.done ? "checked" : ""}>
      <div>
        <div>${t.title}</div>
        ${t.desc ? `<div class="task-desc">${t.desc}</div>` : ""}
      </div>
      <div>${t.points}</div>
    `;
    div.querySelector("input").onchange = e => {
      t.done = e.target.checked;
      points += t.done ? t.points : -t.points;
      save();
      updatePoints();
    };
    tasksDiv.appendChild(div);
  });
}

addTaskBtn.onclick = () => {
  if (!taskTitle.value) return;
  tasks.push({
    title: taskTitle.value,
    desc: taskDesc.value,
    points: Number(taskPoints.value) || 0,
    done: false
  });
  taskTitle.value = taskDesc.value = taskPoints.value = "";
  save();
  renderTasks();
};

// --- EXPORT / IMPORT ---
exportBtn.onclick = () => {
  const data = { journal, tasks, points };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `os-umyslu-${Date.now()}.json`;
  a.click();
};

importBtn.onclick = () => importFile.click();

importFile.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    journal = data.journal || [];
    tasks = data.tasks || [];
    points = data.points || 0;
    save();
    renderAll();
  };
  reader.readAsText(file);
};

// --- UTILS ---
function save() {
  localStorage.setItem("journal", JSON.stringify(journal));
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("points", points);
}

function updatePoints() {
  pointsSpan.textContent = points;
}

function renderAll() {
  renderJournal();
  renderTasks();
  updatePoints();
}

// INIT
renderAll();
