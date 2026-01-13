'use strict';

// -------------------- 1. Constants & Config --------------------
const STORAGE_KEY = "kids_quiz_profile_v2";
const DATA_URL = "data.json";

const DIFF_LABEL = { easy: "쉬움", normal: "보통", hard: "어려움" };
const CAT_LABEL  = { all: "전체", math: "수학", science: "과학", english: "영어" };

const CHARACTERS = [
  { id: "dino",  name: "초록 공룡", base: "🦖", desc: "용감하고 씩씩!" },
  { id: "bunny", name: "토끼 친구", base: "🐰", desc: "빠르고 똑똑!" },
  { id: "robot", name: "로봇 박사", base: "🤖", desc: "논리력 만렙!" },
];

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

const SHOP_CHESTS = [
  { id:"buy_basic", type:"chest", chest:"basic", emoji:"📦", name:"기본 상자", priceCoin:120, priceGem:0, desc:"코스튬/코인/EXP" },
  { id:"buy_rare",  type:"chest", chest:"rare",  emoji:"🎁", name:"레어 상자", priceCoin:280, priceGem:0, desc:"좋은 확률!" },
  { id:"buy_super", type:"chest", chest:"super", emoji:"💎", name:"슈퍼 상자", priceCoin:0,   priceGem:2, desc:"최고 확률!" },
];

const SHOP_BOOSTS = [
  { id:"boost_coin", type:"boost", boost:"coin", emoji:"🪙", name:"코인 부스터", priceCoin:150, priceGem:0, desc:"다음 3판 코인 +20%" },
  { id:"boost_exp",  type:"boost", boost:"exp",  emoji:"🧬", name:"EXP 부스터",  priceCoin:150, priceGem:0, desc:"다음 3판 EXP +20%" },
];

const CHEST_META = {
  basic: { label:"기본 📦", odds:{ coin:45, exp:25, cosmeticC:22, cosmeticB:8, cosmeticA:0, cosmeticS:0 }, dupRefund: 18 },
  rare:  { label:"레어 🎁", odds:{ coin:30, exp:20, cosmeticC:25, cosmeticB:18, cosmeticA:6, cosmeticS:1 }, dupRefund: 35 },
  super: { label:"슈퍼 💎", odds:{ coin:20, exp:15, cosmeticC:20, cosmeticB:25, cosmeticA:15, cosmeticS:5 }, dupRefund: 70 },
};

// -------------------- 2. Global State --------------------
// 원본 문제 데이터
let DATA = []; 

// 현재 퀴즈 실행 상태
const RUN = {
  mode: "normal", // "normal" | "review"
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
  wrongItems: [],

  locked: false,
  timerId: null,
  timeLeft: 0,
  qStartTs: 0,
  lastRewardChest: null,
};

// 사용자 프로필 (저장됨)
const DEFAULT_PROFILE = () => ({
  coins: 0,
  gems: 0,
  exp: 0,
  level: 1,
  charId: "dino",
  owned: { hat:[], face:[], hand:[], effect:[] },
  equippedByChar: {
    dino:  { hat:null, face:null, hand:null, effect:null },
    bunny: { hat:null, face:null, hand:null, effect:null },
    robot: { hat:null, face:null, hand:null, effect:null },
  },
  chests: { basic:0, rare:0, super:0 },
  boosts: { coin: {left:0}, exp:{left:0} },
  checkin: { lastDate:null, streak:0 },
  missions: { date:null, list:[], claimed:{} },
  wrongs: [],
  gachaHistory: [],
  settings: { sound:true, tts:false, reduceMotion:false },
});

let profile = DEFAULT_PROFILE();

// -------------------- 3. Utilities --------------------
const $  = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const uniq = (arr) => Array.from(new Set(arr));
const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

function shuffle(arr){
  for (let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

function pickWeighted(map){
  const keys = Object.keys(map);
  const total = keys.reduce((s,k)=>s+Number(map[k]||0),0);
  let r = Math.random() * total;
  for (const k of keys){
    r -= Number(map[k]||0);
    if (r <= 0) return k;
  }
  return keys[keys.length-1];
}

function todayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

// -------------------- 4. Profile Logic --------------------
function saveProfile(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch {}
}

function loadProfile(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { profile = DEFAULT_PROFILE(); return; }
  try {
    const obj = JSON.parse(raw);
    const def = DEFAULT_PROFILE();
    // Merge
    for (const k of Object.keys(def)){
      if (obj[k] !== undefined) def[k] = obj[k];
    }
    // Deep merge essential arrays/objects
    def.owned = obj.owned || def.owned;
    def.equippedByChar = obj.equippedByChar || def.equippedByChar;
    def.chests = obj.chests || def.chests;
    def.checkin = obj.checkin || def.checkin;
    def.missions = obj.missions || def.missions;
    def.wrongs = Array.isArray(obj.wrongs) ? obj.wrongs : [];
    def.gachaHistory = Array.isArray(obj.gachaHistory) ? obj.gachaHistory : [];
    
    // Ensure nested integrity
    ["hat","face","hand","effect"].forEach(s => def.owned[s] = uniq(def.owned[s]||[]));
    CHARACTERS.forEach(c => {
       if(!def.equippedByChar[c.id]) def.equippedByChar[c.id] = {hat:null,face:null,hand:null,effect:null};
    });

    profile = def;
  } catch {
    profile = DEFAULT_PROFILE();
  }
}

// XP & Level
function expNeedFor(level){ return 100 + (level-1)*40; }
function stageByLevel(level){
  if (level < 5) return { key:"egg",   label:"알 🥚",   skin:"🥚" };
  if (level < 10) return { key:"baby", label:"아기 🐣", skin:"🐣" };
  return { key:"super", label:"슈퍼 🦸", skin:"🦸" };
}

function applyExp(delta){
  profile.exp = Math.max(0, profile.exp + delta);
  while (true){
    const need = expNeedFor(profile.level);
    if (profile.exp >= need){
      profile.exp -= need;
      profile.level += 1;
      // 레벨업 보상 (보석 1개)
      profile.gems += 1; 
      if(typeof _notify === "function") _notify(`레벨 업! Lv ${profile.level} (💎+1)`);
    } else break;
  }
  saveProfile();
}

// Item helpers
function findChar(cid){ return CHARACTERS.find(c=>c.id===cid) || CHARACTERS[0]; }
function itemById(id){ return COSMETICS.find(x=>x.id===id) || null; }
function emojiOf(id){ const it=itemById(id); return it?it.emoji:""; }
function getEquipped(){ return profile.equippedByChar[profile.charId]; }
