// DOM elements
const welcomeScreen = document.getElementById("welcomeScreen");
const mainApp = document.getElementById("mainApp");
const enterBtn = document.getElementById("enterBtn");
const userNameInput = document.getElementById("userName");
const userBioInput = document.getElementById("userBio");
const userGreeting = document.getElementById("userGreeting");

const subjectList = document.getElementById("subjectList");
const subjectSelect = document.getElementById("subjectSelect");
const taskList = document.getElementById("taskList");

// Data
let userProfile = JSON.parse(localStorage.getItem("studyflowUser")) || {};
let subjects = JSON.parse(localStorage.getItem("subjects")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let selectedDay = new Date().getDay(); // Today (0=Sun, 1=Mon, ..., 6=Sat)
let editingSubjectId = null;
let editingTaskId = null;

// ────────────────────────────────────────────────
// Init & Welcome
// ────────────────────────────────────────────────
if (userProfile.name) {
  showMainApp(userProfile.name);
}

// Set min date = today
document.getElementById("taskDate").min = new Date().toISOString().split("T")[0];

enterBtn.addEventListener("click", () => {
  const name = userNameInput.value.trim();
  if (!name) {
    alert("Please enter your name!");
    return;
  }

  userProfile = {
    name,
    bio: userBioInput.value.trim() || "Student on a mission 🚀"
  };

  localStorage.setItem("studyflowUser", JSON.stringify(userProfile));
  showMainApp(name);
});

function showMainApp(name) {
  welcomeScreen.classList.add("hidden");
  setTimeout(() => {
    welcomeScreen.style.display = "none";
    mainApp.classList.remove("hidden");
  }, 500);

  userGreeting.innerHTML = `Hi ${name}! Let's crush this week 📈`;

  renderSubjects();
  switchDay({ target: document.querySelector(`#dayTabs button[data-day="${selectedDay}"]`) });
  updateDashboard();
}

// ────────────────────────────────────────────────
// Subjects
// ────────────────────────────────────────────────
document.getElementById("addSubjectBtn").addEventListener("click", () => {
  const name = document.getElementById("subjectName").value.trim();
  const target = parseFloat(document.getElementById("targetHours").value);

  if (!name || isNaN(target) || target < 0) {
    alert("Please enter subject name and valid target hours ≥ 0");
    return;
  }

  if (editingSubjectId) {
    const sub = subjects.find(s => s.id === editingSubjectId);
    if (sub) {
      sub.name = name;
      sub.target = target;
    }
    editingSubjectId = null;
  } else {
    subjects.push({ id: Date.now(), name, target });
  }

  document.getElementById("subjectName").value = "";
  document.getElementById("targetHours").value = "";

  saveData();
  renderSubjects();
  updateDashboard();
});

function renderSubjects() {
  subjectList.innerHTML = "";
  subjectSelect.innerHTML = '<option value="">Select subject</option>';

  subjects.forEach(sub => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${sub.name} (${sub.target}h/week)
      <div>
        <button onclick="editSubject(${sub.id})">✏️</button>
        <button onclick="deleteSubject(${sub.id})">❌</button>
      </div>
    `;
    subjectList.appendChild(li);

    const opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = sub.name;
    subjectSelect.appendChild(opt);
  });
}

window.editSubject = function(id) {
  const sub = subjects.find(s => s.id === id);
  if (!sub) return;
  document.getElementById("subjectName").value = sub.name;
  document.getElementById("targetHours").value = sub.target;
  editingSubjectId = id;
};

window.deleteSubject = function(id) {
  if (!confirm("Delete subject? Tasks will also be removed.")) return;
  subjects = subjects.filter(s => s.id !== id);
  tasks = tasks.filter(t => t.subjectId !== id);
  saveData();
  renderSubjects();
  renderTasks();
  updateDashboard();
};

// ────────────────────────────────────────────────
// Tasks + Days
// ────────────────────────────────────────────────
document.getElementById("addTaskBtn").addEventListener("click", handleTask);
document.getElementById("dayTabs").addEventListener("click", switchDay);

function handleTask() {
  const subjectId = parseInt(subjectSelect.value);
  const title = document.getElementById("taskTitle").value.trim();
  const date = document.getElementById("taskDate").value;
  const time = document.getElementById("taskTime").value;
  const duration = parseFloat(document.getElementById("taskDuration").value);

  if (!subjectId || !title || !date || !time || isNaN(duration) || duration <= 0) {
    alert("Please fill all fields correctly!");
    return;
  }

  const taskDay = new Date(date).getDay();

  if (editingTaskId) {
    const t = tasks.find(x => x.id === editingTaskId);
    if (t) Object.assign(t, { subjectId, title, date, time, duration, day: taskDay });
    editingTaskId = null;
  } else {
    tasks.push({ id: Date.now(), subjectId, title, date, time, duration, day: taskDay });
  }

  // Clear form
  subjectSelect.value = "";
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDate").value = "";
  document.getElementById("taskTime").value = "";
  document.getElementById("taskDuration").value = "";

  saveData();
  renderTasks();
  updateDashboard();
  scheduleNotification(date, time, title);
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks
    .filter(t => t.day === selectedDay)
    .forEach(t => {
      const sub = subjects.find(s => s.id === t.subjectId);
      const subjName = sub ? sub.name : "Unknown";

      const li = document.createElement("li");
      li.innerHTML = `
        ${subjName} – ${t.title} (${t.duration}h @ ${t.time})
        <div>
          <button onclick="editTask(${t.id})">✏️</button>
          <button onclick="deleteTask(${t.id})">❌</button>
        </div>
      `;
      taskList.appendChild(li);
    });
}

window.editTask = function(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  document.getElementById("taskTitle").value = t.title;
  document.getElementById("taskDate").value = t.date;
  document.getElementById("taskTime").value = t.time;
  document.getElementById("taskDuration").value = t.duration;
  subjectSelect.value = t.subjectId;

  editingTaskId = id;
};

window.deleteTask = function(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveData();
  renderTasks();
  updateDashboard();
};

function switchDay(e) {
  const btn = e.target.closest("button");
  if (!btn || !btn.dataset.day) return;

  selectedDay = parseInt(btn.dataset.day);

  document.querySelectorAll("#dayTabs button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  document.getElementById("selectedDayTitle").textContent = days[selectedDay] + " Tasks";

  renderTasks();
}

// ────────────────────────────────────────────────
// Dashboard
// ────────────────────────────────────────────────
function getCurrentWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // to Monday

  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function updateDashboard() {
  const { start, end } = getCurrentWeekRange();

  const weeklyTasks = tasks.filter(t => {
    const d = new Date(t.date);
    d.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  });

  document.getElementById("totalSubjects").textContent = subjects.length;

  const totalHours = weeklyTasks.reduce((sum, t) => sum + t.duration, 0);
  document.getElementById("totalHours").textContent = totalHours.toFixed(1);

  const avg = weeklyTasks.length ? (totalHours / weeklyTasks.length).toFixed(2) : "0.00";
  document.getElementById("averageTime").textContent = avg;

  // Most studied
  const count = {};
  weeklyTasks.forEach(t => {
    count[t.subjectId] = (count[t.subjectId] || 0) + t.duration;
  });
  let maxHours = -1;
  let mostId = null;
  for (let id in count) {
    if (count[id] > maxHours) {
      maxHours = count[id];
      mostId = id;
    }
  }
  document.getElementById("mostStudied").textContent =
    subjects.find(s => s.id == mostId)?.name || "N/A";

  // Progress
  const weeklyTarget = subjects.reduce((sum, s) => sum + (s.target || 0), 0);
  const percent = weeklyTarget > 0 ? Math.min((totalHours / weeklyTarget) * 100, 100) : 0;
  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressText").textContent = percent.toFixed(1) + "%";
}

function scheduleNotification(date, time, title) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "denied") return;

  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  const scheduled = new Date(`${date}T${time}:00`);
  const diffMs = scheduled - Date.now();

  if (diffMs > 0) {
    setTimeout(() => {
      new Notification("📚 Study Time!", {
        body: `"${title}" starts now!`,
        icon: "/favicon.ico"
      });
    }, diffMs);
  }
}

function saveData() {
  localStorage.setItem("subjects", JSON.stringify(subjects));
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Initial load if already logged in
if (userProfile.name) {
  renderSubjects();
  updateDashboard();
}

    
  

  
