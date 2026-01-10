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
        dino:  { hat: null, face: null, hand: null, effec
