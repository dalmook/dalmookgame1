'use strict';

/**
 * Kids Quiz Land — Full Client App (GitHub Pages)
 * Features:
 * - Quiz: category/difficulty/count + timer mode
 * - Rewards: coins + exp + chests
 * - Growth skin stage: Egg -> Baby -> Super (based on level)
 * - Gacha/chests: loot tables, duplicate refund, history, modal
 * - Daily: check-in + daily missions (reset by date)
 * - Wrong notebook: save wrongs, filter, review mode
 * - Cosmetics: buy/equip, also obtain via gacha
 * - Persistence: localStorage + export/import JSON
 */

// -------------------- DOM helpers --------------------
const $  = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const qs = (sel, root = document) => root.querySelector(sel);
const qsa= (sel, root = document) => Array.from(root.querySelectorAll(sel));

function safeOn(el, evt, fn) { if (el) el.addEventListener(evt, fn); }
function safeText(el, t) { if (el) el.textContent = t; }
function safeHTML(el, h) { if (el) el.innerHTML = h; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function uniq(arr) { return Array.from(new Set(arr)); }

// -------------------- Storage keys --------------------
const STORAGE_KEY = "kids_quiz_profile_v2";
const DATA_URL = "data.json";

// -------------------- Constants --------------------
const DIFF_LABEL = { easy: "쉬움", normal: "보통", hard: "어려움" };
const CAT_LABEL  = { all: "전체", math: "수학", science: "과학", english: "영어" };

const CHARACTERS = [
  { id: "dino",  name: "초록 공룡", base: "🦖", desc: "용감하고 씩씩!" },
  { id: "bunny", name: "토끼 친구", base: "🐰", desc: "빠르고 똑똑!" },
  { id: "robot", name: "로봇 박사", base: "🤖", desc: "논리력 만렙!" },
];

// Cosmetics items (shop + gacha rewards)
const COSMETICS = [
  // hat
  { id:"hat_cap",   slot:"hat",   emoji:"🧢", name:"캡모자",   price:25,  rarity:"C", desc:"깔끔한 스타일" },
  { id:"hat_bow",   slot:"hat",   emoji:"🎀", name:"리본",     price:35,  rarity:"C", desc:"귀여움 +10" },
  { id:"hat_party", slot:"hat",   emoji:"🥳", name:"파티모자", price:60,  rarity:"B", desc:"축제 분위기" },
  { id:"hat_crown", slot:"hat",   emoji:"👑", name:"왕관",     price:120, rarity:"A", desc:"최고의 증표" },

  // face
  { id:"face_mask",    slot:"face", emoji:"😷", name:"마스크",   price:40,  rarity:"C", desc:"위생왕" },
  { id:"face_glasses", slot:"face", emoji:"🕶️", name:"선글라스", price:55,  rarity:"B", desc:"쿨하게!" },
  { id:"face_nerd",    slot:"face", emoji:"🤓", name:"똑똑안경", price:75,  rarity:"B", desc:"지식 +1" },
  { id:"face_star",    slot:"face", emoji:"🤩", name:"반짝눈",   price:90,  rarity:"A", desc:"감탄 모드" },

  // hand
  { id:"hand_pencil",  slot:"hand", emoji:"✏️", name:"연필",   price:30,  rarity:"C", desc:"공부왕" },
  { id:"hand_balloon", slot:"hand", emoji:"🎈", name:"풍선",   price:35,  rarity:"C", desc:"둥실둥실" },
  { id:"hand_wand",    slot:"hand", emoji:"🪄", name:"마법봉", price:95,  rarity:"A", desc:"마법 뿜뿜" },
  { id:"hand_sword",   slot:"hand", emoji:"⚔️", name:"검",     price:110, rarity:"A", desc:"용사 세트" },

  // effect
  { id:"fx_cloud",   slot:"effect", emoji:"☁️", name:"구름",   price:60,  rarity:"B", desc:"몽글몽글" },
  { id:"fx_sparkle", slot:"effect", emoji:"✨", name:"반짝이", price:80,  rarity:"B", desc:"항상 빛나!" },
  { id:"fx_fire",    slot:"effect", emoji:"🔥", name:"불꽃",   price:130, rarity:"A", desc:"열정 MAX" },
  { id:"fx_rainbow", slot:"effect", emoji:"🌈", name:"무지개", price:150, rarity:"S", desc:"행복 한가득" },
];

// Shop products (chests + boosts)
const SHOP_CHESTS = [
  { id:"buy_basic", type:"chest", chest:"basic", emoji:"📦", name:"기본 상자", priceCoin:120, priceGem:0, desc:"코스튬/코인/EXP" },
  { id:"buy_rare",  type:"chest", chest:"rare",  emoji:"🎁", name:"레어 상자", priceCoin:280, priceGem:0, desc:"좋은 확률!" },
  { id:"buy_super", type:"chest", chest:"super", emoji:"💎", name:"슈퍼 상자", priceCoin:0,   priceGem:2, desc:"최고 확률!" },
];

const SHOP_BOOSTS = [
  { id:"boost_coin", type:"boost", boost:"coin", emoji:"🪙", name:"코인 부스터", priceCoin:150, priceGem:0, desc:"다음 3판 코인 +20%" },
  { id:"boost_exp",  type:"boost", boost:"exp",  emoji:"🧬", name:"EXP 부스터",  priceCoin:150, priceGem:0, desc:"다음 3판 EXP +20%" },
];

// Gacha odds & loot
const CHEST_META = {
  basic: { label:"기본 📦", odds:{ coin:45, exp:25, cosmeticC:22, cosmeticB:8, cosmeticA:0, cosmeticS:0 }, dupRefund: 18 },
  rare:  { label:"레어 🎁", odds:{ coin:30, exp:20, cosmeticC:25, cosmeticB:18, cosmeticA:6, cosmeticS:1 }, dupRefund: 35 },
  super: { label:"슈퍼 💎", odds:{ coin:20, exp:15, cosmeticC:20, cosmeticB:25, cosmeticA:15, cosmeticS:5 }, dupRefund: 70 },
};

// Quiz rewards baseline
function pointsByDiff(diff){ return diff==="easy" ? 10 : (diff==="normal" ? 15 : 20); }
function baseCoinByDiff(diff){ return diff==="easy" ? 3 : (diff==="normal" ? 4 : 5); }
function baseExpByDiff(diff){ return diff==="easy" ? 8 : (diff==="normal" ? 10 : 12); }

// Level curve
function expNeedFor(level){
  // gentle curve: 100, 140, 180, 220...
  return 100 + (level-1)*40;
}

function stageByLevel(level){
  if (level < 5) return { key:"egg",   label:"알 🥚",   skin:"🥚" };
  if (level < 10) return { key:"baby", label:"아기 🐣", skin:"🐣" };
  return { key:"super", label:"슈퍼 🦸", skin:"🦸" };
}

// -------------------- Global runtime --------------------
let DATA = null;

// in-run state
const RUN = {
  mode: "normal",         // "normal" | "review"
  diff: "easy",
  cat: "all",
  count: 10,
  timerEnabled: false,
  timePerQ: 20,

  deck: [],
  idx: 0,
  score: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  runCoins: 0,
  runExp: 0,
  wrongItems: [],         // per-run wrongs

  locked: false,
  timerId: null,
  timeLeft: 0,
  qStartTs: 0,
  lastRewardChest: null,  // e.g. {type, count, opened:false}
};

// profile (persistent)
const DEFAULT_PROFILE = () => ({
  coins: 0,
  gems: 0,

  exp: 0,
  level: 1,

  charId: "dino",

  // cosmetics
  owned: { hat:[], face:[], hand:[], effect:[] },
  equippedByChar: {
    dino:  { hat:null, face:null, hand:null, effect:null },
    bunny: { hat:null, face:null, hand:null, effect:null },
    robot: { hat:null, face:null, hand:null, effect:null },
  },

  // chests
  chests: { basic:0, rare:0, super:0 },

  // boosts
  boosts: { coin: {left:0}, exp:{left:0} },

  // check-in
  checkin: { lastDate:null, streak:0 },

  // daily missions
  missions: { date:null, list:[], claimed:{} },

  // wrong notebook
  wrongs: [], // {id,q,choices,answer,chosen,explain,diff,cat,ts}

  // gacha history
  gachaHistory: [], // {ts,chest,emoji,name,rarity,kind,amount}

  // best score
  best: null, // {score,diff,cat,ts}

  // settings
  settings: { sound:true, tts:false, reduceMotion:false },
});

let profile = DEFAULT_PROFILE();

// -------------------- Utils --------------------
function todayKey(){
  // local date (KST if user is in Korea; still fine for GitHub Pages)
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function randInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }

function shuffle(arr){
  for (let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

function pickWeighted(map){
  // map: {key: weight,...} weights sum 100-ish
  const keys = Object.keys(map);
  const total = keys.reduce((s,k)=>s+Number(map[k]||0),0);
  let r = Math.random() * total;
  for (const k of keys){
    r -= Number(map[k]||0);
    if (r <= 0) return k;
  }
  return keys[keys.length-1];
}

function findChar(cid){ return CHARACTERS.find(c=>c.id===cid) || CHARACTERS[0]; }
function ensureCharSlots(){
  for (const c of CHARACTERS){
    if (!profile.equippedByChar[c.id]) profile.equippedByChar[c.id] = {hat:null,face:null,hand:null,effect:null};
  }
}

function getEquipped(){
  ensureCharSlots();
  return profile.equippedByChar[profile.charId];
}

function itemById(id){ return COSMETICS.find(x=>x.id===id) || null; }
function emojiOf(id){ const it=itemById(id); return it?it.emoji:""; }
function isOwned(item){ return profile.owned[item.slot]?.includes(item.id); }
function isEquipped(item){ const eq=getEquipped(); return eq[item.slot]===item.id; }

// XP/Level recompute
function applyExp(delta){
  profile.exp = Math.max(0, profile.exp + delta);
  // level up loop
  while (true){
    const need = expNeedFor(profile.level);
    if (profile.exp >= need){
      profile.exp -= need;
      profile.level += 1;
      // tiny gem bonus on level up (optional)
      if (profile.level % 5 === 0) profile.gems += 1;
    } else break;
  }
}

function saveProfile(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch {}
}
function loadProfile(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { profile = DEFAULT_PROFILE(); return; }
  try{
    const obj = JSON.parse(raw);
    profile = DEFAULT_PROFILE();
    // shallow merge safe fields
    for (const k of Object.keys(profile)){
      if (obj && obj[k] !== undefined) profile[k] = obj[k];
    }
    // fix nested
    profile.owned = profile.owned || {hat:[],face:[],hand:[],effect:[]};
    for (const s of ["hat","face","hand","effect"]){
      profile.owned[s] = uniq((profile.owned[s]||[]).filter(x=>typeof x==="string"));
    }
    profile.chests = profile.chests || {basic:0,rare:0,super:0};
    profile.boosts = profile.boosts || {coin:{left:0}, exp:{left:0}};
    profile.checkin = profile.checkin || {lastDate:null, streak:0};
    profile.missions = profile.missions || {date:null, list:[], claimed:{}};
    profile.wrongs = Array.isArray(profile.wrongs) ? profile.wrongs : [];
    profile.gachaHistory = Array.isArray(profile.gachaHistory) ? profile.gachaHistory : [];
    profile.settings = profile.settings || {sound:true, tts:false, reduceMotion:false};
    ensureCharSlots();
  } catch {
    profile = DEFAULT_PROFILE();
  }
}

// -------------------- FX --------------------
function popFx(emoji, count=5, anchorEl=null){
  const layer = $("fxLayer");
  if (!layer) return;

  const rect = (anchorEl || $("homeAvatar") || document.body).getBoundingClientRect();
  const baseX = rect.left + rect.width/2;
  const baseY = rect.top + rect.height/2 + 80;

  for (let i=0;i<count;i++){
    const d = document.createElement("div");
    d.className = "fx";
    d.textContent = emoji;
    d.style.left = `${baseX + randInt(-80,80)}px`;
    d.style.top  = `${baseY + randInt(-20,20)}px`;
    layer.appendChild(d);
    setTimeout(()=>d.remove(), 1000);
  }
}

function setMood(el, emoji, ms=450){
  if (!el) return;
  el.textContent = emoji;
  el.style.opacity = "1";
  setTimeout(()=>{
    el.style.opacity = "0";
    el.textContent = "";
  }, ms);
}

// -------------------- Screen routing --------------------
const SCREENS = [
  "Home","Setup","Quiz","Result","Shop","Inventory","Gacha","Missions","Notebook","Settings"
];

function showScreen(name){
  for (const s of SCREENS){
    const el = $("screen"+s);
    if (el) el.classList.toggle("hidden", s !== name);
  }
}

function pill(text){ safeText($("pillStatus"), text); }

// -------------------- Render: header / home / avatar --------------------
function renderHeader(){
  safeText($("coinText"), String(profile.coins|0));
  safeText($("gemText"),  String(profile.gems|0));
  safeText($("levelGlobalText"), String(profile.level|0));
}

function renderGrowth(){
  const stage = stageByLevel(profile.level);
  safeText($("skinStageBadge"), stage.label);

  safeText($("expText"), String(profile.exp|0));
  safeText($("expNeedText"), String(expNeedFor(profile.level)));

  const bar = $("expBar");
  if (bar){
    const w = Math.round((profile.exp / expNeedFor(profile.level)) * 100);
    bar.style.width = `${clamp(w,0,100)}%`;
  }
}

function renderCharCards(){
  const list = $("charList");
  if (!list) return;
  list.innerHTML = "";
  const cur = profile.charId;

  for (const c of CHARACTERS){
    const b = document.createElement("button");
    b.type = "button";
    b.className = "charCard" + (c.id===cur ? " active" : "");
    b.dataset.char = c.id;
    b.innerHTML = `
      <div class="charEmoji">${c.base}</div>
      <div class="charMeta">
        <div class="name">${c.name}</div>
        <div class="desc">${c.desc}</div>
      </div>
    `;
    b.addEventListener("click", ()=>{
      profile.charId = c.id;
      saveProfile();
      renderAll();
      popFx("✨", 4, $("homeAvatar"));
    });
    list.appendChild(b);
  }
}

function renderAvatarSet(prefix){
  // prefix: home / avatar / shopAvatar
  const baseEl = $(prefix+"Base");
  const skinEl = $(prefix+"Skin");
  const hatEl  = $(prefix+"Hat");
  const faceEl = $(prefix+"Face");
  const handEl = $(prefix+"Hand");
  const fxEl   = $(prefix+"Effect");
  const moodEl = $(prefix+"Mood");
  const nameEl = $(prefix+"Name");

  const c = findChar(profile.charId);
  const eq = getEquipped();
  const stage = stageByLevel(profile.level);

  if (baseEl) baseEl.textContent = c.base;
  if (skinEl) skinEl.textContent = stage.skin;

  if (hatEl)  hatEl.textContent  = emojiOf(eq.hat);
  if (faceEl) faceEl.textContent = emojiOf(eq.face);
  if (handEl) handEl.textContent = emojiOf(eq.hand);
  if (fxEl)   fxEl.textContent   = emojiOf(eq.effect);

  if (nameEl) nameEl.textContent = c.name;

  // keep moodEl for runtime
  return moodEl;
}

function renderChestsSummary(){
  safeText($("chestBasicCount"), String(profile.chests.basic|0));
  safeText($("chestRareCount"),  String(profile.chests.rare|0));
  safeText($("chestSuperCount"), String(profile.chests.super|0));
}

function renderAll(){
  renderHeader();
  renderGrowth();
  renderCharCards();
  renderAvatarSet("homeAvatar");
  renderAvatarSet("avatar");      // quiz
  renderAvatarSet("shopAvatar");  // shop
  renderChestsSummary();

  // these are implemented in Part2, but safe to call (function hoisting)
  renderDailyMissionsPreview();
  renderCheckinUI();
  renderMissionsUI();
  renderNotebookList();
  renderShop();
  renderInventory();
  renderGachaUI();
}

// -------------------- Data normalization --------------------
function normCat(q){
  const c = (q.category || q.cat || q.type || "").toString().toLowerCase();
  if (c.includes("math") || c.includes("수학")) return "math";
  if (c.includes("science") || c.includes("과학")) return "science";
  if (c.includes("english") || c.includes("영어")) return "english";
  return q.category || q.cat || q.type ? "all" : "all";
}

function normQuestion(q, diff){
  const out = {
    id: q.id || `${diff}::${(q.q||"").slice(0,50)}::${Math.random().toString(16).slice(2)}`,
    q: String(q.q || q.question || ""),
    choices: Array.isArray(q.choices) ? q.choices.map(String) : [],
    answer: Number.isInteger(q.answer) ? q.answer : parseInt(q.answer,10),
    explain: q.explain ? String(q.explain) : (q.explanation ? String(q.explanation) : ""),
    cat: normCat(q),
    diff,
  };
  if (!Array.isArray(out.choices) || out.choices.length < 2) out.choices = ["O","X"];
  if (!Number.isFinite(out.answer)) out.answer = 0;
  out.answer = clamp(out.answer, 0, out.choices.length-1);
  return out;
}

// -------------------- Placeholders (implemented in Part2) --------------------
async function loadData(){ /* Part2 */ }
function bindUI(){ /* Part2 */ }

// home quick actions
function goHome(){ /* Part2 */ }
function goSetup(){ /* Part2 */ }
function goShop(){ /* Part2 */ }
function goInventory(){ /* Part2 */ }
function goGacha(){ /* Part2 */ }
function goMissions(){ /* Part2 */ }
function goNotebook(){ /* Part2 */ }
function goSettings(){ /* Part2 */ }

// quiz
function startQuiz(mode){ /* Part2 */ }
function renderQuestion(){ /* Part2 */ }
function chooseAnswer(i, btn){ /* Part2 */ }
function nextQuestion(){ /* Part2 */ }
function finishQuiz(){ /* Part2 */ }

// missions/check-in
function ensureDailyMissions(){ /* Part2 */ }
function renderDailyMissionsPreview(){ /* Part2 */ }
function renderCheckinUI(){ /* Part2 */ }
function renderMissionsUI(){ /* Part2 */ }
function claimCheckin(){ /* Part2 */ }
function claimMission(id){ /* Part2 */ }

// notebook
function renderNotebookList(){ /* Part2 */ }
function applyNotebookFilter(){ /* Part2 */ }
function startReviewFromNotebook(){ /* Part2 */ }

// shop/inventory/gacha
function renderShop(){ /* Part2 */ }
function buyShopItem(item){ /* Part2 */ }
function renderInventory(){ /* Part2 */ }
function toggleEquipItem(itemId){ /* Part2 */ }

function renderGachaUI(){ /* Part2 */ }
function openChest(chestType, times){ /* Part2 */ }
function openRewardModal(reward){ /* Part2 */ }
function closeRewardModal(){ /* Part2 */ }

// settings
function exportProfile(){ /* Part2 */ }
function importProfileFile(file){ /* Part2 */ }
function resetAll(){ /* Part2 */ }

// --------------------
// settings (Part2)
// --------------------

// 공통: 메시지 출력(있으면 toast류 사용, 없으면 alert)
function _notify(msg){
  try{
    if (typeof toast === "function") return toast(msg);
    if (typeof shopToast === "function") return shopToast(msg);
    if (typeof pill === "function") return pill(msg);
  }catch(_){}
  alert(msg);
}

function exportProfile(){
  try{
    // export 포맷: { app, version, exportedAt, profile }
    const payload = {
      app: "kids-quiz-land",
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: (typeof profile !== "undefined" ? profile : null),
    };

    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `kids_quiz_profile_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    _notify("내보내기 완료! JSON 파일로 저장했어요.");
  }catch(err){
    console.warn(err);
    _notify("내보내기 실패… 콘솔 로그를 확인해주세요.");
  }
}

async function importProfileFile(file){
  if (!file) return;

  try{
    const raw = await file.text();
    let obj = JSON.parse(raw);

    // 1) exportProfile()로 내보낸 형태면 obj.profile가 실제 프로필
    if (obj && typeof obj === "object" && obj.profile && typeof obj.profile === "object") {
      obj = obj.profile;
    }

    if (!obj || typeof obj !== "object") throw new Error("Invalid JSON structure");

    // 병합/검증 로직이 Part1에 있으면 최대한 활용
    // - mergeProfile(obj) 형태
    // - 또는 mergeProfile(obj, base) 형태
    let nextProfile = obj;

    if (typeof mergeProfile === "function") {
      try {
        // 2-args 지원하는 경우도 있으니 안전하게 시도
        nextProfile = (mergeProfile.length >= 2)
          ? mergeProfile(obj, (typeof profile !== "undefined" ? profile : undefined))
          : mergeProfile(obj);
      } catch (e) {
        console.warn("mergeProfile failed; fallback to raw profile", e);
        nextProfile = obj;
      }
    }

    // 저장
    if (typeof profile !== "undefined") profile = nextProfile;

    if (typeof saveProfile === "function") {
      saveProfile();
    } else if (typeof PROFILE_KEY !== "undefined") {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    } else {
      // PROFILE_KEY가 없으면, 그래도 최대한 저장 시도(접두사)
      localStorage.setItem("kids_quiz_profile_v1", JSON.stringify(nextProfile));
    }

    // file input reset
    const inp = document.getElementById("importFile");
    if (inp) inp.value = "";

    _notify("가져오기 완료! 데이터를 반영할게요.");

    // 화면 갱신(Part1에 함수가 있으면 호출, 없으면 리로드)
    const rerenderCandidates = ["refreshAll", "renderAll", "renderHome", "updateUI", "updateCoinUI"];
    let did = false;
    for (const fn of rerenderCandidates) {
      if (typeof window[fn] === "function") {
        try { window[fn](); did = true; } catch(e){ console.warn(fn, e); }
      }
    }
    if (!did) location.reload();

  }catch(err){
    console.warn(err);
    _notify("가져오기 실패… 올바른 JSON 파일인지 확인해주세요.");
    const inp = document.getElementById("importFile");
    if (inp) inp.value = "";
  }
}

function resetAll(){
  if (!confirm("전체 초기화할까요?\n(코인/아이템/상자/오답/출석/기록이 모두 삭제됩니다)")) return;

  try{
    // 1) 알려진 키들 제거
    const knownKeys = [];
    if (typeof PROFILE_KEY !== "undefined") knownKeys.push(PROFILE_KEY);
    if (typeof WRONG_KEY !== "undefined") knownKeys.push(WRONG_KEY);
    if (typeof SETTINGS_KEY !== "undefined") knownKeys.push(SETTINGS_KEY);
    if (typeof NOTEBOOK_KEY !== "undefined") knownKeys.push(NOTEBOOK_KEY);

    knownKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch(_){}
    });

    // 2) 앱 접두사로 저장했을 가능성까지 광범위 제거
    const prefixList = [
      "kids_quiz_",
      "kids-quiz-",
      "kql_",
    ];
    Object.keys(localStorage).forEach((k) => {
      if (prefixList.some(p => k.startsWith(p))) {
        try { localStorage.removeItem(k); } catch(_){}
      }
    });

  }catch(err){
    console.warn(err);
  }

  _notify("초기화 완료! 새로 시작합니다.");
  location.reload();
}

