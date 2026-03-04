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
const soundTip = document.getElementById("soundTip");

// Data
let userProfile = JSON.parse(localStorage.getItem("studyflowUser")) || {};
let subjects = JSON.parse(localStorage.getItem("subjects")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let selectedDay = new Date().getDay();
let editingSubjectId = null;
let editingTaskId = null;

// ────────────────────────────────────────────────
// Init & Welcome
// ────────────────────────────────────────────────
if (userProfile.name) {
  showMainApp(userProfile.name);
}

document.getElementById("taskDate").min = new Date().toISOString().split("T")[0];

enterBtn.addEventListener("click", () => {
  const name = userNameInput.value.trim();
  if (!name) return alert("Please enter your name!");
  
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
  switchDay({ target: document.querySelector(`#dayTabs button[data-day="${selectedDay}"]`) || document.querySelector('#dayTabs button') });
  updateDashboard();
  checkAndNotifyPending();

  // Periodic checks
  setInterval(checkAndNotifyPending, 90000); // 1.5 min

  // Unlock audio context (for chime/sound)
  const unlockAudio = () => {
    const audio = new Audio("notification.mp3"); // siguraduhin may file ka nito
    audio.volume = 0.01;
    audio.play().catch(() => {}).then(() => audio.pause());
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
}

// ────────────────────────────────────────────────
// Subjects
// ────────────────────────────────────────────────
document.getElementById("addSubjectBtn").addEventListener("click", () => {
  const name = document.getElementById("subjectName").value.trim();
  const target = parseFloat(document.getElementById("targetHours").value);
  
  if (!name || isNaN(target) || target < 0) {
    alert("Please enter subject name and valid weekly hours");
    return;
  }

  if (editingSubjectId !== null) {
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
      <div class="actions">
        <button class="edit-btn" data-id="${sub.id}">✏️ Edit</button>
        <button class="delete-btn" data-id="${sub.id}">❌ Delete</button>
      </div>
    `;
    subjectList.appendChild(li);

    const opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = sub.name;
    subjectSelect.appendChild(opt);
  });
}

// ────────────────────────────────────────────────
// Tasks + Day Switching
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
    alert("Please complete all task fields correctly!");
    return;
  }

  const taskDay = new Date(date).getDay();
  let thisTaskId;

  if (editingTaskId !== null) {
    const t = tasks.find(x => x.id === editingTaskId);
    if (t) {
      Object.assign(t, { subjectId, title, date, time, duration, day: taskDay });
    }
    thisTaskId = editingTaskId;
    editingTaskId = null;
  } else {
    thisTaskId = Date.now();
    tasks.push({ id: thisTaskId, subjectId, title, date, time, duration, day: taskDay });
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

  // Schedule notification
  const [hours, minutes] = time.split(":");
  const dueDate = new Date(date);
  dueDate.setHours(hours, minutes, 0, 0);
  const dueTimestamp = dueDate.getTime();

  scheduleReminder(thisTaskId, title, dueTimestamp);
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks.filter(t => t.day === selectedDay).forEach(t => {
    const sub = subjects.find(s => s.id === t.subjectId);
    const subjName = sub ? sub.name : "Unknown";

    const li = document.createElement("li");
    li.innerHTML = `
      ${subjName} – ${t.title} (${t.duration}h @ ${t.time})
      <div class="actions">
        <button class="edit-btn" data-id="${t.id}">✏️ Edit</button>
        <button class="delete-btn" data-id="${t.id}">❌ Delete</button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

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
// Event Delegation for Edit & Delete (para gumana ang delete!)
// ────────────────────────────────────────────────
subjectList.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (!id) return;

  if (btn.classList.contains('edit-btn')) {
    const sub = subjects.find(s => s.id === id);
    if (sub) {
      document.getElementById("subjectName").value = sub.name;
      document.getElementById("targetHours").value = sub.target;
      editingSubjectId = id;
    }
  } else if (btn.classList.contains('delete-btn')) {
    if (confirm("Delete this subject and all its tasks?")) {
      subjects = subjects.filter(s => s.id !== id);
      tasks = tasks.filter(t => t.subjectId !== id);
      saveData();
      renderSubjects();
      renderTasks();
      updateDashboard();
    }
  }
});

taskList.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (!id) return;

  if (btn.classList.contains('edit-btn')) {
    const t = tasks.find(x => x.id === id);
    if (t) {
      document.getElementById("taskTitle").value = t.title;
      document.getElementById("taskDate").value = t.date;
      document.getElementById("taskTime").value = t.time;
      document.getElementById("taskDuration").value = t.duration;
      subjectSelect.value = t.subjectId;
      editingTaskId = id;
    }
  } else if (btn.classList.contains('delete-btn')) {
    if (confirm("Delete this task?")) {
      tasks = tasks.filter(t => t.id !== id);
      saveData();
      renderTasks();
      updateDashboard();
    }
  }
});

// ────────────────────────────────────────────────
// Dashboard
// ────────────────────────────────────────────────
function getCurrentWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23,59,59,999);
  return { start, end };
}

function updateDashboard() {
  const { start, end } = getCurrentWeekRange();
  const weeklyTasks = tasks.filter(t => {
    const d = new Date(t.date);
    d.setHours(0,0,0,0);
    return d >= start && d <= end;
  });

  document.getElementById("totalSubjects").textContent = subjects.length;
  const totalHours = weeklyTasks.reduce((sum, t) => sum + t.duration, 0);
  document.getElementById("totalHours").textContent = totalHours.toFixed(1);

  const avg = weeklyTasks.length ? (totalHours / weeklyTasks.length).toFixed(2) : "0.00";
  document.getElementById("averageTime").textContent = avg;

  const count = {};
  weeklyTasks.forEach(t => count[t.subjectId] = (count[t.subjectId] || 0) + t.duration);
  let maxHours = -1, mostId = null;
  for (let id in count) {
    if (count[id] > maxHours) { maxHours = count[id]; mostId = id; }
  }
  document.getElementById("mostStudied").textContent = subjects.find(s => s.id == mostId)?.name || "N/A";

  const weeklyTarget = subjects.reduce((sum, s) => sum + (s.target || 0), 0);
  const percent = weeklyTarget > 0 ? Math.min((totalHours / weeklyTarget) * 100, 100) : 0;
  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressText").textContent = percent.toFixed(1) + "%";
}

// ────────────────────────────────────────────────
// Notifications
// ────────────────────────────────────────────────
function safeNotify(title, options = {}) {
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      icon: "/favicon.ico",
      ...options
    });
    if (typeof playChime === 'function') playChime();
  } catch (err) {
    console.warn("Notification failed", err);
  }
}

function scheduleReminder(taskId, title, dueTimestamp) {
  const now = Date.now();
  const diffMs = dueTimestamp - now;

  if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      safeNotify("📚 StudyFlow Reminder", {
        body: `Time for: "${title}" (${new Date(dueTimestamp).toLocaleTimeString()})`
      });
    }, diffMs);
  }

  let pending = JSON.parse(localStorage.getItem("studyflowPendingReminders") || "[]");
  pending = pending.filter(p => p.taskId !== taskId);
  pending.push({
    taskId,
    title,
    scheduledTime: dueTimestamp,
    createdAt: now
  });
  pending = pending.filter(p => p.scheduledTime > now - 2 * 86400000);
  localStorage.setItem("studyflowPendingReminders", JSON.stringify(pending));
}

function checkAndNotifyPending() {
  if (Notification.permission !== "granted") return;

  const now = Date.now();
  let pending = JSON.parse(localStorage.getItem("studyflowPendingReminders") || "[]");
  const toNotify = [];
  const keep = [];

  for (const p of pending) {
    const diff = p.scheduledTime - now;
    if (diff <= 900000 && diff >= -900000) {
      toNotify.push(p);
    } else if (diff > -86400000 * 2) {
      keep.push(p);
    }
  }

  toNotify.forEach(p => {
    safeNotify("📚 Study Reminder", {
      body: `"${p.title}" ${p.scheduledTime < now ? "was" : "is"} due at ${new Date(p.scheduledTime).toLocaleTimeString()}`
    });
  });

  localStorage.setItem("studyflowPendingReminders", JSON.stringify(keep));
}

// Visibility change + periodic
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    checkAndNotifyPending();
  }
});

// ────────────────────────────────────────────────
// Save & Helpers
// ────────────────────────────────────────────────
function saveData() {
  localStorage.setItem("subjects", JSON.stringify(subjects));
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Optional: Permission button (kung idinagdag mo na sa HTML)
const enableNotifBtn = document.getElementById('enableNotifications');
if (enableNotifBtn) {
  enableNotifBtn.addEventListener('click', () => {
    if (Notification.permission === "default") {
      Notification.requestPermission().then(perm => {
        if (perm === "granted") {
          checkAndNotifyPending();
          enableNotifBtn.textContent = "Reminders Enabled ✓";
          enableNotifBtn.disabled = true;
        }
      });
    }
  });
}
