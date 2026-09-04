const KEY = "gymChatPersonalV01";

const baseState = {
  profile: null,
  messages: [],
  history: []
};

let state = load();

function q(id){ return document.getElementById(id); }

function load(){
  try{
    return { ...structuredClone(baseState), ...(JSON.parse(localStorage.getItem(KEY) || "{}")) };
  }catch{
    return structuredClone(baseState);
  }
}

function save(){
  localStorage.setItem(KEY, JSON.stringify(state));
}

function escapeHTML(text){
  return String(text)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function formatCoachText(text){
  return escapeHTML(text)
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
    .replace(/^\s*[-•]\s+(.*)$/gm,"• $1")
    .replace(/\n/g,"<br>");
}

function selectedGoals(){
  return [...document.querySelectorAll('#goalChips input:checked')].map(x => x.value);
}

function showOnboarding(){
  q("onboarding").classList.remove("hidden");
  q("app").classList.add("hidden");
}

function showApp(){
  q("onboarding").classList.add("hidden");
  q("app").classList.remove("hidden");
  render();
}

function render(){
  if(!state.profile){
    showOnboarding();
    return;
  }

  q("profileBadge").textContent = state.profile.name.toUpperCase().slice(0,10);
  q("welcomeTitle").textContent = `${state.profile.name}, what are we training today?`;
  q("goalSummary").textContent = state.profile.goals.length
    ? `Main goals: ${state.profile.goals.join(" · ")}`
    : "Your coach will adapt around your profile.";

  renderChat();
  renderProfile();
  renderHistory();
}

function renderChat(){
  q("chatLog").innerHTML = "";
  const messages = state.messages.length ? state.messages : [
    {role:"coach", text:`Hey ${state.profile.name}! Your profile is ready. Tell me when you're at the gym, or ask me to build today's workout.`}
  ];

  messages.slice(-40).forEach(m => {
    const d = document.createElement("div");
    d.className = `bubble ${m.role === "user" ? "user" : "coach"}`;
    if(m.role === "coach") d.innerHTML = formatCoachText(m.text);
    else d.textContent = m.text;
    q("chatLog").appendChild(d);
  });
  q("chatLog").scrollTop = q("chatLog").scrollHeight;
}

function renderProfile(){
  const p = state.profile;
  q("profileCard").innerHTML = `
    <p class="eyebrow">YOUR PROFILE</p>
    <h2>${escapeHTML(p.name)}</h2>
    <div class="profile-list">
      <div class="profile-row"><span>Age</span><strong>${p.age || "—"}</strong></div>
      <div class="profile-row"><span>Height</span><strong>${p.height ? p.height + " cm" : "—"}</strong></div>
      <div class="profile-row"><span>Weight</span><strong>${p.weight ? p.weight + " kg" : "—"}</strong></div>
      <div class="profile-row"><span>Experience</span><strong>${escapeHTML(p.experience)}</strong></div>
      <div class="profile-row"><span>Training days</span><strong>${p.days} / week</strong></div>
      <div class="profile-row"><span>Equipment</span><strong>${escapeHTML(p.equipment)}</strong></div>
      <div class="profile-row"><span>Goals</span><strong>${escapeHTML(p.goals.join(", ") || "Not set")}</strong></div>
    </div>`;
}

function renderHistory(){
  const rows = state.history.slice(-20).reverse();
  q("historyList").innerHTML = rows.length ? "" : '<p class="muted">No activity yet.</p>';
  rows.forEach(h => {
    const d = document.createElement("div");
    d.className = "history-row";
    d.innerHTML = `<strong>${escapeHTML(h.text)}</strong><br><small class="muted">${new Date(h.time).toLocaleString()}</small>`;
    q("historyList").appendChild(d);
  });
}

async function sendCoach(text){
  state.messages.push({ role:"user", text });
  state.history.push({ text, time:new Date().toISOString() });
  save();
  renderChat();

  let reply;
  try{
    const r = await fetch("/api/coach", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        message:text,
        profile:state.profile,
        state:{
          recentHistory:state.history.slice(-20)
        }
      })
    });
    if(!r.ok) throw new Error("AI request failed");
    const data = await r.json();
    reply = data.text || "Tell me how that felt.";
  }catch(err){
    console.error(err);
    reply = `I’ve got your profile saved. For now, tell me what you want to train and I’ll guide you one step at a time once the AI key is connected.`;
  }

  state.messages.push({ role:"coach", text:reply });
  save();
  render();
}

q("profileForm").addEventListener("submit", e => {
  e.preventDefault();
  const goals = selectedGoals();
  const profile = {
    name:q("name").value.trim(),
    age:Number(q("age").value) || null,
    height:Number(q("height").value) || null,
    weight:Number(q("weight").value) || null,
    days:Number(q("days").value),
    experience:q("experience").value,
    goals,
    equipment:q("equipment").value,
    notes:q("notes").value.trim()
  };
  if(!profile.name) return;
  state.profile = profile;
  state.messages = [{role:"coach", text:`Welcome ${profile.name}. Your personal Gym Chat is ready. Tell me what you want to work on today.`}];
  save();
  showApp();
});

q("chatForm").addEventListener("submit", e => {
  e.preventDefault();
  const text = q("chatInput").value.trim();
  if(!text) return;
  q("chatInput").value = "";
  sendCoach(text);
});

q("startWorkoutBtn").addEventListener("click", () => {
  sendCoach("I'm ready to train. Build today's workout for me and coach me one exercise at a time.");
});

q("editProfileBtn").addEventListener("click", () => {
  const p = state.profile;
  q("name").value = p.name || "";
  q("age").value = p.age || "";
  q("height").value = p.height || "";
  q("weight").value = p.weight || "";
  q("days").value = String(p.days || 4);
  q("experience").value = p.experience || "beginner";
  q("equipment").value = p.equipment || "Full gym";
  q("notes").value = p.notes || "";
  document.querySelectorAll('#goalChips input').forEach(el => el.checked = p.goals.includes(el.value));
  showOnboarding();
});

q("resetBtn").addEventListener("click", () => {
  if(!confirm("Reset this device and erase this Gym Chat profile?")) return;
  localStorage.removeItem(KEY);
  state = structuredClone(baseState);
  location.reload();
});

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    q(btn.dataset.tab).classList.add("active");
  });
});

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if(SR){
  const recog = new SR();
  recog.lang = "en-GB";
  recog.interimResults = false;
  q("voiceBtn").addEventListener("click", () => {
    q("voiceStatus").textContent = "Listening…";
    recog.start();
  });
  recog.onresult = e => {
    const text = e.results[0][0].transcript;
    q("voiceStatus").textContent = `Heard: ${text}`;
    sendCoach(text);
  };
  recog.onerror = () => q("voiceStatus").textContent = "Voice input unavailable. You can still type.";
}else{
  q("voiceBtn").disabled = true;
  q("voiceStatus").textContent = "Voice recognition is not available in this browser.";
}

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

if(state.profile) showApp();
else showOnboarding();
