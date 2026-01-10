// Kids Quiz Land (GitHub Pages) - Vanilla JS
// data.json + 난이도/캐릭터 선택 + 정답 시 캐릭터 변화(장식/레벨업) + 이펙트

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const screens = {
  setup: $("#screenSetup"),
  quiz: $("#screenQuiz"),
  result: $("#screenResult"),
};

const pillStatus = $("#pillStatus");

// setup controls
const diffButtons = $$(".segBtn");
const diffHint = $("#diffHint");
const countInput = $("#countInput");
const charList = $("#charList");
const btnStart = $("#btnStart");
const btnResetBest = $("#btnResetBest");
const bestText = $("#bestText");

// quiz controls
const avatar = $("#avatar");
const avatarBase = $("#avatarBase");
const avatarAcc = $("#avatarAcc");
const avatarName = $("#avatarName");
const levelText = $("#levelText");
const streakText = $("#streakText");

const meterBar = $("#meterBar");
const qBadge = $("#qBadge");
const qText = $("#qText");
const choicesEl = $("#choices");
const feedbackEl = $("#feedback");
const qIndexEl = $("#qIndex");
const qTotalEl = $("#qTotal");
const scoreText = $("#scoreText");
const btnNext = $("#btnNext");
const btnQuit = $("#btnQuit");

// result
const finalScoreEl = $("#finalScore");
const finalSubEl = $("#finalSub");
const correctCountEl = $("#correctCount");
const wrongCountEl = $("#wrongCount");
const finalDiffEl = $("#finalDiff");
const finalCharEl = $("#finalChar");
const btnRestart = $("#btnRestart");
const btnHome = $("#btnHome");

// fx
const fxLayer = $("#fxLayer");

// --- Characters (base emoji + accessories cycle) ---
const ACCESSORIES = ["", "🎩", "🕶️", "🎀", "👑", "⭐", "🎯", "🏅"];
const BAD_ACC = ["💧", "😵‍💫", "💥"];

const CHARACTERS = [
  { id: "dino", name: "초록 공룡", base: "🦖", desc: "용감하고 씩씩!" },
  { id: "bunny", name: "토끼 친구", base: "🐰", desc: "빠르고 똑똑!" },
  { id: "robot", name: "로봇 박사", base: "🤖", desc: "논리력 만렙!" },
];

const DIFF_LABEL = { easy: "쉬움", normal: "보통", hard: "어려움" };
const DIFF_HINT = {
  easy: "쉬움: 1~2학년 느낌 (가볍게!)",
  normal: "보통: 초등 전학년 두뇌 워밍업",
  hard: "어려움: 생각이 필요한 문제들!",
};

// --- State ---
let DATA = null;
let state = {
  diff: "easy",
  count: 10,
  charId: "dino",

  deck: [],
  idx: 0,
  score: 0,
  correct: 0,
  wrong: 0,

  streak: 0,
  level: 1,
  accIndex: 0,
  locked: false,
};

const BEST_KEY = "kids_quiz_best_v1";

// --- Init ---
init();

async function init() {
  bindSetupUI();
  renderCharacters();
  loadBest();
  setDiff("easy");
  setChar(state.charId);

  // load data.json (GitHub Pages에서는 잘 동작)
  DATA = await loadDataJson();
  pill("준비완료");
}

function bindSetupUI() {
  diffButtons.forEach((btn) => {
    btn.addEventListener("click", () => setDiff(btn.dataset.diff));
  });

  countInput.addEventListener("change", () => {
    const n = clamp(parseInt(countInput.value || "10", 10), 5, 30);
    countInput.value = String(n);
    state.count = n;
  });

  btnStart.addEventListener("click", () => startQuiz());
  btnResetBest.addEventListener("click", () => {
    localStorage.removeItem(BEST_KEY);
    loadBest();
    popFx("🧽", 1);
  });

  btnNext.addEventListener("click", () => nextQuestion());
  btnQuit.addEventListener("click", () => goHome());

  btnRestart.addEventListener("click", () => startQuiz(true));
  btnHome.addEventListener("click", () => goHome());
}

function renderCharacters() {
  charList.innerHTML = "";
  CHARACTERS.forEach((c) => {
    const el = document.createElement("button");
    el.className = "charCard";
    el.type = "button";
    el.dataset.char = c.id;
    el.innerHTML = `
      <div class="charEmoji">${c.base}</div>
      <div class="charMeta">
        <div class="name">${c.name}</div>
        <div class="desc">${c.desc}</div>
      </div>
    `;
    el.addEventListener("click", () => setChar(c.id));
    charList.appendChild(el);
  });
}

function setDiff(diff) {
  state.diff = diff;
  diffButtons.forEach((b) => b.classList.toggle("active", b.dataset.diff === diff));
  diffHint.textContent = DIFF_HINT[diff] || "";
}

function setChar(charId) {
  state.charId = charId;
  $$(".charCard").forEach((c) => c.classList.toggle("active", c.dataset.char === charId));
  const c = CHARACTERS.find((x) => x.id === charId) || CHARACTERS[0];
  avatarBase.textContent = c.base;
  avatarName.textContent = c.name;
  avatarAcc.textContent = "";
}

function pill(text) {
  pillStatus.textContent = text;
}

async function loadDataJson() {
  try {
    const url = new URL("data.json", window.location.href);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error("data.json fetch failed");
    const json = await res.json();
    // 최소 검증
    ["easy", "normal", "hard"].forEach((k) => {
      if (!Array.isArray(json[k])) json[k] = [];
    });
    return json;
  } catch (e) {
    console.warn("data.json 로드 실패, 내장 샘플 사용:", e);
    // fallback (data.json이 없거나 경로 문제일 때)
    return {
      easy: [{ q: "1 + 1은?", choices: ["1", "2", "3", "4"], answer: 1, explain: "2!" }],
      normal: [{ q: "5 × 3은?", choices: ["10", "15", "20", "25"], answer: 1, explain: "15!" }],
      hard: [{ q: "12의 약수가 아닌 것은?", choices: ["1", "3", "5", "6"], answer: 2, explain: "5로는 안 나눠져요" }],
    };
  }
}

function loadBest() {
  const raw = localStorage.getItem(BEST_KEY);
  if (!raw) {
    bestText.textContent = "-";
    return;
  }
  try {
    const obj = JSON.parse(raw);
    bestText.textContent = `${obj.score}점 (${obj.diffLabel} / ${obj.charName})`;
  } catch {
    bestText.textContent = "-";
  }
}

function saveBestIfNeeded() {
  const prevRaw = localStorage.getItem(BEST_KEY);
  let prev = null;
  try { prev = prevRaw ? JSON.parse(prevRaw) : null; } catch { prev = null; }

  const c = getChar();
  const cur = {
    score: state.score,
    diff: state.diff,
    diffLabel: DIFF_LABEL[state.diff],
    charId: state.charId,
    charName: c.name,
    ts: Date.now()
  };

  if (!prev || cur.score > prev.score) {
    localStorage.setItem(BEST_KEY, JSON.stringify(cur));
    loadBest();
    popFx("🏆", 2);
  }
}

function startQuiz(isRestart = false) {
  if (!DATA) return;

  state.count = clamp(parseInt(countInput.value || "10", 10), 5, 30);

  // 덱 구성: 난이도별 문제 풀에서 섞어서 count만큼
  const pool = (DATA[state.diff] || []).slice();
  if (pool.length < 1) {
    alert("선택한 난이도에 문제가 없어요. data.json에 문제를 추가해 주세요!");
    return;
  }

  shuffle(pool);
  const deck = pool.slice(0, Math.min(state.count, pool.length));

  // state reset
  state.deck = deck;
  state.idx = 0;
  state.score = 0;
  state.correct = 0;
  state.wrong = 0;
  state.streak = 0;
  state.level = 1;
  state.accIndex = 0;
  state.locked = false;

  // UI
  showScreen("quiz");
  pill("퀴즈중");
  qTotalEl.textContent = String(deck.length);
  scoreText.textContent = "0";
  levelText.textContent = "1";
  streakText.textContent = "0";
  avatarAcc.textContent = "";
  feedback("", "neutral");
  btnNext.classList.add("hidden");

  renderQuestion();
  if (!isRestart) popFx("🚀", 1);
}

function renderQuestion() {
  const q = state.deck[state.idx];
  if (!q) return finishQuiz();

  const diffLabel = DIFF_LABEL[state.diff] || "난이도";
  qBadge.textContent = diffLabel;
  qBadge.style.borderColor = diffColor(state.diff);
  qText.textContent = q.q;

  // progress
  qIndexEl.textContent = String(state.idx + 1);
  meterBar.style.width = `${Math.round(((state.idx) / state.deck.length) * 100)}%`;

  // choices
  state.locked = false;
  btnNext.classList.add("hidden");
  choicesEl.innerHTML = "";

  q.choices.forEach((text, i) => {
    const b = document.createElement("button");
    b.className = "choiceBtn";
    b.type = "button";
    b.textContent = `${i + 1}. ${text}`;
    b.addEventListener("click", () => onChoose(i, b));
    choicesEl.appendChild(b);
  });

  feedback("정답을 골라보자! 🙂", "neutral");
}

function onChoose(i, btnEl) {
  if (state.locked) return;
  state.locked = true;

  const q = state.deck[state.idx];
  const isCorrect = (i === q.answer);

  // mark buttons
  const btns = $$(".choiceBtn");
  btns.forEach((b, idx) => {
    if (idx === q.answer) b.classList.add("correct");
    else if (idx === i && !isCorrect) b.classList.add("wrong");
    b.disabled = true;
  });

  if (isCorrect) {
    state.correct++;
    state.streak++;
    state.score += scoreByDiff(state.diff);

    // accessory evolve
    state.accIndex = (state.accIndex + 1) % ACCESSORIES.length;
    avatarAcc.textContent = ACCESSORIES[state.accIndex];

    // level up each 3 streak
    if (state.streak % 3 === 0) {
      state.level++;
      levelText.textContent = String(state.level);
      popFx("✨", 6);
      bounce(avatar);
    } else {
      popFx("⭐", 4);
      bounce(avatar);
    }

    feedback(`정답! ✅ ${q.explain ? " " + q.explain : ""}`, "good");
  } else {
    state.wrong++;
    state.streak = 0;

    // show "bad" accessory briefly
    avatarAcc.textContent = BAD_ACC[Math.floor(Math.random() * BAD_ACC.length)];
    shake(avatar);

    feedback(`아쉽다! ❌ 정답은 "${q.choices[q.answer]}" ${q.explain ? "— " + q.explain : ""}`, "bad");
  }

  // update numbers
  streakText.textContent = String(state.streak);
  scoreText.textContent = String(state.score);

  // progress bar includes current question now
  meterBar.style.width = `${Math.round(((state.idx + 1) / state.deck.length) * 100)}%`;

  btnNext.classList.remove("hidden");
}

function nextQuestion() {
  state.idx++;
  if (state.idx >= state.deck.length) return finishQuiz();
  renderQuestion();
}

function finishQuiz() {
  pill("완료");
  showScreen("result");

  finalScoreEl.textContent = String(state.score);
  finalSubEl.textContent = `총 ${state.deck.length}문제 중 ${state.correct}개 정답`;
  correctCountEl.textContent = String(state.correct);
  wrongCountEl.textContent = String(state.wrong);
  finalDiffEl.textContent = DIFF_LABEL[state.diff] || state.diff;
  finalCharEl.textContent = getChar().name;

  saveBestIfNeeded();
  popFx("🎉", 10);
}

function goHome() {
  pill("준비중");
  showScreen("setup");
}

function showScreen(name) {
  screens.setup.classList.toggle("hidden", name !== "setup");
  screens.quiz.classList.toggle("hidden", name !== "quiz");
  screens.result.classList.toggle("hidden", name !== "result");
}

// --- Helpers ---
function getChar() {
  return CHARACTERS.find((x) => x.id === state.charId) || CHARACTERS[0];
}

function diffColor(diff) {
  if (diff === "easy") return "rgba(74,222,128,.55)";
  if (diff === "normal") return "rgba(96,165,250,.55)";
  return "rgba(244,114,182,.55)";
}

function scoreByDiff(diff) {
  if (diff === "easy") return 10;
  if (diff === "normal") return 15;
  return 20;
}

function feedback(text, kind) {
  feedbackEl.textContent = text || "";
  feedbackEl.classList.remove("good", "bad", "neutral");
  feedbackEl.classList.add(kind || "neutral");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function clamp(n, a, b) {
  if (Number.isNaN(n)) return a;
  return Math.max(a, Math.min(b, n));
}

function bounce(el) {
  el.classList.remove("bounce");
  void el.offsetWidth; // reflow
  el.classList.add("bounce");
}

function shake(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

function popFx(emoji, count = 5) {
  const rect = avatar.getBoundingClientRect();
  const baseX = rect.left + rect.width / 2;
  const baseY = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const fx = document.createElement("div");
    fx.className = "fx";
    fx.textContent = emoji;
    fx.style.left = `${baseX + rand(-40, 40)}px`;
    fx.style.top = `${baseY + rand(-10, 20)}px`;
    fx.style.transform = `translateY(0) scale(${rand(0.9, 1.2)}) rotate(${rand(-15, 15)}deg)`;
    fxLayer.appendChild(fx);
    setTimeout(() => fx.remove(), 1000);
  }
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}
