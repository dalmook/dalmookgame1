// Kids Quiz Land (GitHub Pages)
// ✅ 코인 적립 + 상점 구매 + 아이템 장착 + localStorage 영구 저장 + 내보내기/가져오기(JSON)

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const screens = {
  setup: $("#screenSetup"),
  quiz: $("#screenQuiz"),
  shop: $("#screenShop"),
  result: $("#screenResult"),
};

const pillStatus = $("#pillStatus");
const coinText = $("#coinText");
const bestText = $("#bestText");

// setup controls
const diffButtons = $$(".segBtn").filter(b => b.dataset.diff);
const diffHint = $("#diffHint");
const countInput = $("#countInput");
const charList = $("#charList");
const btnStart = $("#btnStart");
const btnOpenShop = $("#btnOpenShop");
const btnOpenShop2 = $("#btnOpenShop2");
const btnResetAll = $("#btnResetAll");

// quiz controls
const avatar = $("#avatar");
const avatarBase = $("#avatarBase");
const avatarHat = $("#avatarHat");
const avatarFace = $("#avatarFace");
const avatarHand = $("#avatarHand");
const avatarEffect = $("#avatarEffect");
const avatarMood = $("#avatarMood");
const avatarName = $("#avatarName");
const levelText = $("#levelText");
const streakText = $("#streakText");
const runCoinsText = $("#runCoinsText");

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
const btnOpenShop3 = $("#btnOpenShop3");

// result
const finalScoreEl = $("#finalScore");
const finalSubEl = $("#finalSub");
const correctCountEl = $("#correctCount");
const wrongCountEl = $("#wrongCount");
const finalDiffEl = $("#finalDiff");
const finalCharEl = $("#finalChar");
const finalCoinsEl = $("#finalCoins");
const btnRestart = $("#btnRestart");
const btnHome = $("#btnHome");
const btnOpenShop4 = $("#btnOpenShop4");

// shop
const shopCoinText = $("#shopCoinText");
const shopMsg = $("#shopMsg");
const shopGrid = $("#shopGrid");
const shopTabs = $("#shopTabs");
const btnBackFromShop = $("#btnBackFromShop");
const btnExport = $("#btnExport");
const importFile = $("#importFile");
const btnUnequipAll = $("#btnUnequipAll");

const shopAvatar = $("#shopAvatar");
const shopAvatarBase = $("#shopAvatarBase");
const shopAvatarHat = $("#shopAvatarHat");
const shopAvatarFace = $("#shopAvatarFace");
const shopAvatarHand = $("#shopAvatarHand");
const shopAvatarEffect = $("#shopAvatarEffect");
const shopAvatarMood = $("#shopAvatarMood");
const shopAvatarName = $("#shopAvatarName");

// fx
const fxLayer = $("#fxLayer");

// --- Constants ---
const DIFF_LABEL = { easy: "쉬움", normal: "보통", hard: "어려움" };
const DIFF_HINT = {
  easy: "쉬움: 가볍게! (코인 +3 ~ +6)",
  normal: "보통: 워밍업! (코인 +4 ~ +8)",
  hard: "어려움: 도전! (코인 +5 ~ +10)",
};

// 캐릭터
const CHARACTERS = [
  { id: "dino",  name: "초록 공룡", base: "🦖", desc: "용감하고 씩씩!" },
  { id: "bunny", name: "토끼 친구", base: "🐰", desc: "빠르고 똑똑!" },
  { id: "robot", name: "로봇 박사", base: "🤖", desc: "논리력 만렙!" },
];

// 상점 아이템(원하는 만큼 추가 가능)
const SHOP_ITEMS = [
  // hat
  { id:"hat_cap", slot:"hat", emoji:"🧢", name:"캡모자", price:25, desc:"깔끔한 스타일" },
  { id:"hat_crown", slot:"hat", emoji:"👑", name:"왕관", price:120, desc:"최고의 증표" },
  { id:"hat_bow", slot:"hat", emoji:"🎀", name:"리본", price:35, desc:"귀여움 +10" },
  { id:"hat_party", slot:"hat", emoji:"🥳", name:"파티모자", price:60, desc:"축제 분위기" },

  // face
  { id:"face_glasses", slot:"face", emoji:"🕶️", name:"선글라스", price:55, desc:"쿨하게!" },
  { id:"face_nerd", slot:"face", emoji:"🤓", name:"똑똑안경", price:75, desc:"지식 +1" },
  { id:"face_mask", slot:"face", emoji:"😷", name:"마스크", price:40, desc:"위생왕" },
  { id:"face_star", slot:"face", emoji:"🤩", name:"반짝눈", price:90, desc:"감탄 모드" },

  // hand (소품)
  { id:"hand_wand", slot:"hand", emoji:"🪄", name:"마법봉", price:95, desc:"마법 뿜뿜" },
  { id:"hand_balloon", slot:"hand", emoji:"🎈", name:"풍선", price:35, desc:"둥실둥실" },
  { id:"hand_sword", slot:"hand", emoji:"⚔️", name:"검", price:110, desc:"용사 세트" },
  { id:"hand_pencil", slot:"hand", emoji:"✏️", name:"연필", price:30, desc:"공부왕" },

  // effect (효과)
  { id:"fx_sparkle", slot:"effect", emoji:"✨", name:"반짝이", price:80, desc:"항상 빛나!" },
  { id:"fx_fire", slot:"effect", emoji:"🔥", name:"불꽃", price:130, desc:"열정 MAX" },
  { id:"fx_cloud", slot:"effect", emoji:"☁️", name:"구름", price:60, desc:"몽글몽글" },
  { id:"fx_rainbow", slot:"effect", emoji:"🌈", name:"무지개", price:150, desc:"행복 한가득" },
];

// localStorage keys
const PROFILE_KEY = "kids_quiz_profile_v1";
const LEGACY_BEST_KEY = "kids_quiz_best_v1";

// --- Data ---
let DATA = null;

// --- Profile (영구 저장) ---
let profile = {
  coins: 0,
  charId: "dino",
  owned: { hat: [], face: [], hand: [], effect: [] },
  equippedByChar: {
    dino:  { hat: null, face: null, hand: null, effect: null },
    bunny: { hat: null, face: null, hand: null, effect: null },
    robot: { hat: null, face: null, hand: null, effect: null },
  },
  best: null, // {score, diff, diffLabel, charId, charName, ts}
};

// --- Quiz State (세션) ---
let state = {
  diff: "easy",
  count: 10,
  deck: [],
  idx: 0,
  score: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  level: 1,
  locked: false,
  runCoins: 0, // 이번 판에서 번 코인
  shopSlot: "all",
};

// -------------------- INIT --------------------
init();

async function init() {
  loadProfile();
  bindUI();
  renderCharacters();
  setDiff("easy");
  setChar(profile.charId, { silentSave: true });

  DATA = await loadDataJson();
  updateCoinUI();
  renderBestUI();
  renderAvatarAll();
  pill("준비완료");
}

// -------------------- UI Binding --------------------
function bindUI() {
  diffButtons.forEach((btn) => {
    btn.addEventListener("click", () => setDiff(btn.dataset.diff));
  });

  countInput.addEventListener("change", () => {
    const n = clamp(parseInt(countInput.value || "10", 10), 5, 30);
    countInput.value = String(n);
    state.count = n;
  });

  btnStart.addEventListener("click", () => startQuiz());
  btnQuit.addEventListener("click", () => goHome());
  btnNext.addEventListener("click", () => nextQuestion());

  btnOpenShop.addEventListener("click", () => goShop());
  btnOpenShop2.addEventListener("click", () => goShop());
  btnOpenShop3.addEventListener("click", () => goShop(true));
  btnOpenShop4.addEventListener("click", () => goShop());

  btnBackFromShop.addEventListener("click", () => {
    // 상점은 “이전 화면”이 단순하지 않아서: 퀴즈 화면이면 퀴즈로, 아니면 setup으로
    if (!screens.quiz.classList.contains("hidden")) showScreen("quiz");
    else if (!screens.result.classList.contains("hidden")) showScreen("result");
    else showScreen("setup");
    pill("준비중");
    shopMsg.textContent = "";
  });

  btnRestart.addEventListener("click", () => startQuiz(true));
  btnHome.addEventListener("click", () => goHome());

  btnResetAll.addEventListener("click", () => {
    if (!confirm("정말 전체 초기화할까요? (코인/아이템/기록 모두 초기화)")) return;
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(LEGACY_BEST_KEY);
    profile = {
      coins: 0,
      charId: "dino",
      owned: { hat: [], face: [], hand: [], effect: [] },
      equippedByChar: {
        dino:  { hat: null, face: null, hand: null, effect: null },
        bunny: { hat: null, face: null, hand: null, effect: null },
        robot: { hat: null, face: null, hand: null, effect: null },
      },
      best: null,
    };
    saveProfile();
    updateCoinUI();
    renderBestUI();
    setChar("dino");
    popFx("🧽", 4);
  });

  // shop tabs
  shopTabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-slot]");
    if (!btn) return;
    state.shopSlot = btn.dataset.slot;
    $$("#shopTabs .segBtn").forEach(b => b.classList.toggle("active", b.dataset.slot === state.shopSlot));
    renderShopGrid();
  });

  // export/import
  btnExport.addEventListener("click", exportProfile);
  importFile.addEventListener("change", (e) => importProfileFile(e.target.files?.[0]));

  btnUnequipAll.addEventListener("click", () => {
    const eq = getEquipped();
    eq.hat = null; eq.face = null; eq.hand = null; eq.effect = null;
    saveProfile();
    renderAvatarAll();
    renderShopGrid();
    shopToast("장착을 모두 해제했어요.");
    popFx("🧼", 4);
  });
}

// -------------------- Setup UI --------------------
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

function setChar(charId, opts = {}) {
  profile.charId = charId;
  $$(".charCard").forEach((c) => c.classList.toggle("active", c.dataset.char === charId));
  if (!opts.silentSave) saveProfile();
  renderAvatarAll();
  renderShopGrid(); // 상점에서 장착 표시 업데이트
}

// -------------------- Profile Persistence --------------------
function loadProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (raw) {
    try {
      const obj = JSON.parse(raw);
      profile = mergeProfile(obj);
    } catch {}
  }

  // 레거시 최고기록 키가 있으면 흡수
  const legacy = localStorage.getItem(LEGACY_BEST_KEY);
  if (legacy && !profile.best) {
    try { profile.best = JSON.parse(legacy); } catch {}
  }

  // 안전장치: 캐릭터 장착 구조 보장
  for (const c of CHARACTERS) {
    if (!profile.equippedByChar[c.id]) profile.equippedByChar[c.id] = { hat:null, face:null, hand:null, effect:null };
  }
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function mergeProfile(obj) {
  const base = JSON.parse(JSON.stringify(profile));
  if (typeof obj?.coins === "number") base.coins = obj.coins;
  if (typeof obj?.charId === "string") base.charId = obj.charId;

  if (obj?.owned) {
    for (const slot of ["hat","face","hand","effect"]) {
      if (Array.isArray(obj.owned[slot])) base.owned[slot] = uniqueStrings(obj.owned[slot]);
    }
  }

  if (obj?.equippedByChar) {
    for (const cid of Object.keys(obj.equippedByChar)) {
      const eq = obj.equippedByChar[cid];
      base.equippedByChar[cid] = {
        hat:   eq?.hat   ?? null,
        face:  eq?.face  ?? null,
        hand:  eq?.hand  ?? null,
        effect:eq?.effect?? null,
      };
    }
  }

  if (obj?.best) base.best = obj.best;
  return base;
}

function uniqueStrings(arr) {
  return Array.from(new Set(arr.filter(x => typeof x === "string")));
}

// -------------------- Data Loading --------------------
async function loadDataJson() {
  try {
    const url = new URL("data.json", window.location.href);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error("data.json fetch failed");
    const json = await res.json();
    ["easy", "normal", "hard"].forEach((k) => {
      if (!Array.isArray(json[k])) json[k] = [];
    });
    return json;
  } catch (e) {
    alert("data.json을 불러오지 못했어요. 같은 폴더에 data.json이 있는지 확인해주세요!");
    console.warn(e);
    return { easy: [], normal: [], hard: [] };
  }
}

// -------------------- Quiz Flow --------------------
function startQuiz(isRestart = false) {
  if (!DATA) return;

  state.count = clamp(parseInt(countInput.value || "10", 10), 5, 30);
  const pool = (DATA[state.diff] || []).slice();
  if (pool.length < 1) {
    alert("선택한 난이도에 문제가 없어요. data.json에 문제를 추가해 주세요!");
    return;
  }

  shuffle(pool);
  const deck = pool.slice(0, Math.min(state.count, pool.length));

  state.deck = deck;
  state.idx = 0;
  state.score = 0;
  state.correct = 0;
  state.wrong = 0;
  state.streak = 0;
  state.level = 1;
  state.locked = false;
  state.runCoins = 0;

  showScreen("quiz");
  pill("퀴즈중");
  qTotalEl.textContent = String(deck.length);
  scoreText.textContent = "0";
  levelText.textContent = "1";
  streakText.textContent = "0";
  runCoinsText.textContent = "0";
  feedback("정답을 골라보자! 🙂", "neutral");
  btnNext.classList.add("hidden");

  renderAvatarAll();
  renderQuestion();

  if (!isRestart) popFx("🚀", 1);
}

function renderQuestion() {
  const q = state.deck[state.idx];
  if (!q) return finishQuiz();

  qBadge.textContent = DIFF_LABEL[state.diff] || "난이도";
  qText.textContent = q.q;

  qIndexEl.textContent = String(state.idx + 1);
  meterBar.style.width = `${Math.round(((state.idx) / state.deck.length) * 100)}%`;

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

function onChoose(i) {
  if (state.locked) return;
  state.locked = true;

  const q = state.deck[state.idx];
  const isCorrect = (i === q.answer);

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

    // 코인 지급
    const gained = calcCoinGain(state.diff, state.streak);
    profile.coins += gained;
    state.runCoins += gained;
    saveProfile();
    updateCoinUI();
    runCoinsText.textContent = String(state.runCoins);

    // 레벨업(3연속마다)
    if (state.streak % 3 === 0) {
      state.level++;
      levelText.textContent = String(state.level);
      setMood("✨", 450, avatarMood);
      setMood("✨", 450, shopAvatarMood);
      popFx("✨", 6);
      bounce(avatar);
    } else {
      setMood("⭐", 300, avatarMood);
      popFx("🪙", 4);
      bounce(avatar);
    }

    feedback(`정답! ✅ (+${gained}🪙) ${q.explain ? " " + q.explain : ""}`, "good");
  } else {
    state.wrong++;
    state.streak = 0;
    setMood("💧", 450, avatarMood);
    popFx("😵‍💫", 2);
    shake(avatar);

    feedback(`아쉽다! ❌ 정답은 "${q.choices[q.answer]}" ${q.explain ? "— " + q.explain : ""}`, "bad");
  }

  streakText.textContent = String(state.streak);
  scoreText.textContent = String(state.score);
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
  finalCoinsEl.textContent = String(state.runCoins);

  saveBestIfNeeded();
  renderBestUI();

  popFx("🎉", 10);
}

// -------------------- Shop --------------------
function goShop(fromQuiz = false) {
  // fromQuiz=true면 pill 유지, 아니면 준비중
  showScreen("shop");
  if (!fromQuiz) pill("준비중");

  state.shopSlot = state.shopSlot || "all";
  $$("#shopTabs .segBtn").forEach(b => b.classList.toggle("active", b.dataset.slot === state.shopSlot));

  updateCoinUI();
  renderAvatarAll();
  renderShopGrid();
  shopMsg.textContent = "";
}

function renderShopGrid() {
  if (!shopGrid) return;

  const slot = state.shopSlot || "all";
  const items = SHOP_ITEMS.filter(it => slot === "all" ? true : it.slot === slot);

  shopGrid.innerHTML = "";
  items.forEach((it) => {
    const owned = isOwned(it);
    const equipped = isEquipped(it);

    const card = document.createElement("div");
    card.className = "itemCard";
    card.innerHTML = `
      <div class="itemTop">
        <div class="itemEmoji">${it.emoji}</div>
        ${equipped ? `<span class="badge equipped">장착중</span>` : (owned ? `<span class="badge owned">보유</span>` : `<span class="badge">🪙${it.price}</span>`)}
      </div>
      <div class="itemName">${it.name}</div>
      <div class="itemMeta">${it.desc}</div>
    `;

    card.addEventListener("click", () => {
      if (!owned) {
        buyItem(it);
      } else {
        toggleEquip(it);
      }
    });

    shopGrid.appendChild(card);
  });
}

function buyItem(item) {
  if (profile.coins < item.price) {
    shopToast("코인이 부족해요 🥲");
    setMood("😵‍💫", 450, shopAvatarMood);
    popFx("💔", 3);
    return;
  }

  profile.coins -= item.price;
  profile.owned[item.slot].push(item.id);
  profile.owned[item.slot] = uniqueStrings(profile.owned[item.slot]);

  // 구매하면 자동 장착
  setEquipped(item.slot, item.id);

  saveProfile();
  updateCoinUI();
  renderAvatarAll();
  renderShopGrid();

  shopToast(`구매 완료! ${item.emoji} ${item.name} 장착했어요.`);
  setMood("🪙", 350, shopAvatarMood);
  popFx("🪙", 6);
}

function toggleEquip(item) {
  const eq = getEquipped();
  if (eq[item.slot] === item.id) {
    eq[item.slot] = null;
    saveProfile();
    renderAvatarAll();
    renderShopGrid();
    shopToast("장착 해제했어요.");
    return;
  }
  setEquipped(item.slot, item.id);
  saveProfile();
  renderAvatarAll();
  renderShopGrid();
  shopToast(`장착했어요! ${item.emoji} ${item.name}`);
  setMood("✨", 300, shopAvatarMood);
}

function shopToast(msg) {
  shopMsg.textContent = msg;
  setTimeout(() => {
    if (shopMsg.textContent === msg) shopMsg.textContent = "";
  }, 2500);
}

// -------------------- Avatar Render (equipped) --------------------
function renderAvatarAll() {
  const c = getChar();
  const eq = getEquipped();

  // quiz avatar
  avatarBase.textContent = c.base;
  avatarName.textContent = c.name;
  avatarHat.textContent = emojiOf(eq.hat);
  avatarFace.textContent = emojiOf(eq.face);
  avatarHand.textContent = emojiOf(eq.hand);
  avatarEffect.textContent = emojiOf(eq.effect);

  // shop preview avatar
  shopAvatarBase.textContent = c.base;
  shopAvatarName.textContent = c.name;
  shopAvatarHat.textContent = emojiOf(eq.hat);
  shopAvatarFace.textContent = emojiOf(eq.face);
  shopAvatarHand.textContent = emojiOf(eq.hand);
  shopAvatarEffect.textContent = emojiOf(eq.effect);
}

function emojiOf(itemId) {
  if (!itemId) return "";
  const it = SHOP_ITEMS.find(x => x.id === itemId);
  return it ? it.emoji : "";
}

function getEquipped() {
  const cid = profile.charId;
  if (!profile.equippedByChar[cid]) profile.equippedByChar[cid] = { hat:null, face:null, hand:null, effect:null };
  return profile.equippedByChar[cid];
}

function setEquipped(slot, itemId) {
  const eq = getEquipped();
  eq[slot] = itemId;
}

function isOwned(item) {
  return profile.owned[item.slot]?.includes(item.id);
}

function isEquipped(item) {
  const eq = getEquipped();
  return eq[item.slot] === item.id;
}

function setMood(emoji, ms, el) {
  el.textContent = emoji;
  el.style.opacity = "1";
  setTimeout(() => {
    el.style.opacity = "0";
    el.textContent = "";
  }, ms);
}

// -------------------- Coins / Best --------------------
function updateCoinUI() {
  coinText.textContent = String(profile.coins);
  if (shopCoinText) shopCoinText.textContent = String(profile.coins);
}

function saveBestIfNeeded() {
  const prev = profile.best;
  const cur = {
    score: state.score,
    diff: state.diff,
    diffLabel: DIFF_LABEL[state.diff],
    charId: profile.charId,
    charName: getChar().name,
    ts: Date.now(),
  };

  if (!prev || cur.score > prev.score) {
    profile.best = cur;
    saveProfile();
    popFx("🏆", 2);
  }
}

function renderBestUI() {
  if (!profile.best) {
    bestText.textContent = "-";
    return;
  }
  const b = profile.best;
  bestText.textContent = `${b.score}점 (${b.diffLabel} / ${b.charName})`;
}

// -------------------- Navigation --------------------
function showScreen(name) {
  screens.setup.classList.toggle("hidden", name !== "setup");
  screens.quiz.classList.toggle("hidden", name !== "quiz");
  screens.shop.classList.toggle("hidden", name !== "shop");
  screens.result.classList.toggle("hidden", name !== "result");
}

function goHome() {
  pill("준비중");
  showScreen("setup");
}

// -------------------- Helpers --------------------
function pill(text) { pillStatus.textContent = text; }

function getChar() {
  return CHARACTERS.find((x) => x.id === profile.charId) || CHARACTERS[0];
}

function scoreByDiff(diff) {
  if (diff === "easy") return 10;
  if (diff === "normal") return 15;
  return 20;
}

// 코인 계산: 난이도 기본 + 연속 보너스
function calcCoinGain(diff, streak) {
  let base = diff === "easy" ? 3 : (diff === "normal" ? 4 : 5);
  let bonus = 0;
  if (streak >= 3) bonus += 1;
  if (streak >= 5) bonus += 1;
  if (streak >= 8) bonus += 2;
  // 약간 랜덤(아이들 재미)
  const rand = Math.random() < 0.35 ? 1 : 0;
  return base + bonus + rand;
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
  void el.offsetWidth;
  el.classList.add("bounce");
}

function shake(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

function popFx(emoji, count = 5) {
  const rect = (avatar || document.body).getBoundingClientRect();
  const baseX = rect.left + rect.width / 2;
  const baseY = rect.top + 120;

  for (let i = 0; i < count; i++) {
    const fx = document.createElement("div");
    fx.className = "fx";
    fx.textContent = emoji;
    fx.style.left = `${baseX + rand(-80, 80)}px`;
    fx.style.top = `${baseY + rand(-20, 20)}px`;
    fxLayer.appendChild(fx);
    setTimeout(() => fx.remove(), 1000);
  }
}

function rand(a, b) { return a + Math.random() * (b - a); }

// -------------------- Export / Import --------------------
function exportProfile() {
  const payload = JSON.stringify(profile, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `kids_quiz_profile_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  shopToast("내보내기 완료! 파일을 저장했어요.");
  popFx("📦", 3);
}

async function importProfileFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const obj = JSON.parse(text);
    profile = mergeProfile(obj);
    saveProfile();
    updateCoinUI();
    renderBestUI();
    setChar(profile.charId, { silentSave: true });
    renderAvatarAll();
    renderShopGrid();
    shopToast("가져오기 완료! 이어서 키울 수 있어요.");
    popFx("✅", 4);
  } catch (e) {
    console.warn(e);
    shopToast("가져오기 실패… 파일이 올바른 JSON인지 확인해주세요.");
    popFx("❌", 2);
  } finally {
    importFile.value = "";
  }
}
