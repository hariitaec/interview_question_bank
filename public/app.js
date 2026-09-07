const state = { questions: [], view: "all", search: "", difficulty: "", sort: "new" };
const grid = document.querySelector("#questionGrid");
const template = document.querySelector("#questionTemplate");
const categoryIcons = { JavaScript: "◒", React: "◌", Databases: "⌘", Backend: "↗", "System Design": "◇", General: "✦" };

async function loadQuestions() {
  state.questions = await fetch("/api/questions").then(r => r.json());
  render();
}

function filteredQuestions() {
  const query = state.search.toLowerCase();
  let questions = state.questions.filter(q => (state.view !== "starred" || q.starred) && (!state.difficulty || q.difficulty === state.difficulty) && (!query || [q.title, q.answer, q.category, ...q.tags].join(" ").toLowerCase().includes(query)));
  return questions.sort((a,b) => state.sort === "old" ? new Date(a.createdAt)-new Date(b.createdAt) : state.sort === "difficulty" ? a.difficulty.localeCompare(b.difficulty) : new Date(b.createdAt)-new Date(a.createdAt));
}

function renderCollections() {
  const groups = [...new Set(state.questions.map(q => q.category))];
  document.querySelector("#collectionNav").innerHTML = groups.map(g => `<button class="nav-link ${state.view === g ? "active" : ""}" data-view="${g}"><span>${categoryIcons[g] || "◇"}</span> ${g} <b>${state.questions.filter(q => q.category === g).length}</b></button>`).join("");
  document.querySelectorAll("[data-view]").forEach(btn => btn.onclick = () => { state.view = btn.dataset.view; render(); });
}

function render() {
  const questions = filteredQuestions();
  const title = state.view === "all" ? "All questions" : state.view === "starred" ? "Starred questions" : state.view;
  document.querySelector("#sectionTitle").textContent = title;
  document.querySelector("#questionCount").textContent = `${questions.length} ${questions.length === 1 ? "question" : "questions"}`;
  document.querySelector("#allCount").textContent = state.questions.length;
  document.querySelector("#starredCount").textContent = state.questions.filter(q => q.starred).length;
  document.querySelector("#heroCount").textContent = `${state.questions.length} questions`;
  grid.innerHTML = "";
  questions.forEach(question => {
    const card = template.content.cloneNode(true);
    card.querySelector(".collection").textContent = question.category.toUpperCase();
    card.querySelector("h3").textContent = question.title;
    card.querySelector(".answer").textContent = question.answer;
    card.querySelector(".tags").innerHTML = question.tags.map(tag => `<span class="tag">#${tag}</span>`).join("");
    const level = card.querySelector(".difficulty"); level.textContent = question.difficulty; level.classList.add(question.difficulty.toLowerCase());
    const star = card.querySelector(".star"); star.textContent = question.starred ? "★" : "☆"; star.classList.toggle("on", question.starred);
    star.onclick = async () => { await fetch(`/api/questions/${question.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({starred:!question.starred}) }); question.starred = !question.starred; render(); };
    grid.append(card);
  });
  document.querySelector("#emptyState").hidden = questions.length !== 0;
  renderCollections();
}

document.querySelector("#search").oninput = e => { state.search = e.target.value; render(); };
document.querySelector("#difficulty").onchange = e => { state.difficulty = e.target.value; render(); };
document.querySelector("#sort").onchange = e => { state.sort = e.target.value; render(); };
document.querySelector("#clearFilters").onclick = () => { state.search = state.difficulty = ""; state.view = "all"; document.querySelector("#search").value = ""; document.querySelector("#difficulty").value = ""; render(); };
document.querySelector("#openModal").onclick = () => document.querySelector("#questionModal").showModal();
document.querySelector("#newCollection").onclick = () => document.querySelector("#questionModal").showModal();
document.querySelector("#practiceBtn").onclick = () => { const first = filteredQuestions()[0]; if (first) alert(`Quick review:\n\n${first.title}\n\nThink through your answer, then compare it with the card below.`); };
document.querySelector("#questionForm").addEventListener("submit", async e => { e.preventDefault(); const form = new FormData(e.currentTarget); const body = Object.fromEntries(form); body.tags = body.tags.split(",").map(t => t.trim()).filter(Boolean); const question = await fetch("/api/questions", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(r=>r.json()); state.questions.unshift(question); e.currentTarget.reset(); document.querySelector("#questionModal").close(); render(); });
loadQuestions();
