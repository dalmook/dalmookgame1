'use strict';

// -------------------- Data Loading --------------------
async function loadData() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("Fetch fail");
    const json = await res.json();
    // 데이터 정규화
    DATA = Array.isArray(json) ? json.map(item => ({
      ...item,
      id: item.id || Math.random().toString(36).slice(2),
      choices: item.choices || ["O", "X"],
      category: item.category || "common"
    })) : [];
  } catch (err) {
    console.warn("Load data failed, using mock data.", err);
    // 폴백용 더미 데이터
    DATA = [
      { q:"1+1=?", choices:["1","2","3","4"], answer:1, category:"math", explain:"1더하기 1은 2입니다." },
      { q:"사과는 영어로?", choices:["Banana","Apple","Grape"], answer:1, category:"english", explain:"Apple입니다." },
      { q:"물이 어는 온도는?", choices:["0도","100도","50도"], answer:0, category:"science", explain:"0도에서 엽니다." },
      { q:"한국의 수도는?", choices:["부산","서울","제주"], answer:1, category:"common", explain:"서울입니다." },
      { q:"5 x 3 = ?", choices:["10","15","20"], answer:1, category:"math", explain:"구구단 5단!" }
    ];
  }
}

// -------------------- Quiz Logic --------------------
function normCat(c) {
  if (!c) return "all";
  c = c.toString().toLowerCase();
  if (c.includes("math") || c.includes("수학")) return "math";
  if (c.includes("sci") || c.includes("과학")) return "science";
  if (c.includes("eng") || c.includes("영어")) return "english";
  return "all";
}

function startQuizLogic(options) {
  const { mode, diff, cat, count, timerEnabled, timePerQ } = options;
  
  RUN.mode = mode;
  RUN.diff = diff;
  RUN.cat = cat;
  RUN.count = count;
  RUN.timerEnabled = timerEnabled;
  RUN.timePerQ = timePerQ;
  
  RUN.score = 0;
  RUN.correct = 0;
  RUN.wrong = 0;
  RUN.streak = 0;
  RUN.runCoins = 0;
  RUN.runExp = 0;
  RUN.idx = 0;
  RUN.wrongItems = [];
  RUN.locked = false;
  RUN.lastRewardChest = null;

  // 덱 생성
  let source = [];
  if (mode === "review") {
    // 오답노트에서 가져오기
    source = profile.wrongs.map(w => ({
      ...w,
      answer: Number(w.answer) // 정수 변환 안전장치
    }));
    // 필터링 (필요시)
    if (cat !== "all") source = source.filter(q => normCat(q.cat) === cat);
  } else {
    // 일반 데이터에서 가져오기
    source = DATA.filter(q => {
      // 난이도/카테고리 필터링이 있다면 여기서 구현 (현재 DATA 구조상 임의 처리)
      const qCat = normCat(q.category);
      if (cat !== "all" && qCat !== cat) return false;
      return true; 
    });
  }

  if (source.length === 0) {
    alert("해당 조건의 문제가 없습니다.");
    return false;
  }

  shuffle(source);
  RUN.deck = source.slice(0, count);
  RUN.count = RUN.deck.length; // 실제 개수로 조정

  return true;
}

function checkAnswerLogic(choiceIdx) {
  const q = RUN.deck[RUN.idx];
  const isCorrect = (choiceIdx === Number(q.answer));
  
  // 점수 계산
  const baseScore = (RUN.diff === "hard" ? 20 : (RUN.diff === "normal" ? 15 : 10));
  
  if (isCorrect) {
    RUN.streak++;
    RUN.correct++;
    
    // 콤보 보너스
    const comboBonus = Math.min(RUN.streak * 2, 10);
    // 타이머 보너스
    let timeBonus = 0;
    if (RUN.timerEnabled && RUN.timeLeft > 0) {
      timeBonus = Math.floor(RUN.timeLeft * 0.5); 
    }

    const totalPts = baseScore + comboBonus + timeBonus;
    RUN.score += totalPts;
    
    // 코인/EXP 획득 (부스터 적용 가능)
    let c = (RUN.diff==="easy"?3:(RUN.diff==="normal"?4:5));
    let e = (RUN.diff==="easy"?8:(RUN.diff==="normal"?10:12));
    
    // 부스터 체크
    if (profile.boosts.coin.left > 0) c = Math.ceil(c * 1.2);
    if (profile.boosts.exp.left > 0) e = Math.ceil(e * 1.2);

    RUN.runCoins += c;
    RUN.runExp += e;

    // 미션 체크
    updateMissionProgress("correct", 1);
    if (RUN.streak >= 3) updateMissionProgress("streak_3", 1);

    return { correct: true, score: totalPts, msg: "정답입니다! 🎉" };
  } else {
    RUN.streak = 0;
    RUN.wrong++;
    
    // 오답노트 추가
    const wrongEntry = {
      id: q.id || Math.random().toString(36),
      q: q.q,
      choices: q.choices,
      answer: q.answer,
      category: q.category,
      explain: q.explain,
      ts: Date.now()
    };
    
    RUN.wrongItems.push(wrongEntry);
    
    // 영구 저장소에 중복 없이 추가
    const exists = profile.wrongs.find(w => w.q === q.q);
    if (!exists) {
      profile.wrongs.push(wrongEntry);
      saveProfile();
    }
    
    return { correct: false, score: 0, msg: "틀렸습니다. 😅" };
  }
}

function finishQuizLogic() {
  // 결과 정산
  profile.coins += RUN.runCoins;
  applyExp(RUN.runExp);

  // 부스터 횟수 차감
  if (profile.boosts.coin.left > 0) profile.boosts.coin.left--;
  if (profile.boosts.exp.left > 0) profile.boosts.exp.left--;

  // 상자 보상 로직 (100점 이상이거나 5문제 이상 맞췄을 때 확률적 지급)
  if (RUN.correct >= 5 || RUN.score >= 100) {
    const roll = Math.random();
    let chestType = null;
    if (roll < 0.3) chestType = "basic";       // 30%
    else if (roll < 0.35) chestType = "rare";  // 5%
    
    if (chestType) {
      profile.chests[chestType]++;
      RUN.lastRewardChest = { type: chestType, count: 1 };
    }
  }

  // 베스트 스코어 갱신
  if (!profile.best || RUN.score > profile.best.score) {
    profile.best = { score: RUN.score, diff: RUN.diff, cat: RUN.cat, ts: Date.now() };
  }

  // 미션: 퀴즈 완료
  updateMissionProgress("play_1", 1);
  if (RUN.timerEnabled) updateMissionProgress("play_timer", 1);

  saveProfile();
}

// -------------------- Mission & Check-in Logic --------------------
const DAILY_MISSIONS_TEMPLATE = [
  { id: "play_1", title: "퀴즈 1회 완료", target: 1, reward: { coin: 50 } },
  { id: "correct", title: "정답 맞추기", target: 5, reward: { coin: 30, exp: 20 } },
  { id: "streak_3", title: "3연속 정답", target: 1, reward: { chest:"basic", count:1 } },
];

function ensureDailyMissions() {
  const tk = todayKey();
  if (profile.missions.date !== tk) {
    // 날짜가 바뀌었으면 초기화
    profile.missions = {
      date: tk,
      list: JSON.parse(JSON.stringify(DAILY_MISSIONS_TEMPLATE)).map(m => ({
        ...m, current: 0, claimed: false
      })),
      claimed: {}
    };
    saveProfile();
  }
}

function updateMissionProgress(type, amount) {
  ensureDailyMissions();
  let changed = false;
  profile.missions.list.forEach(m => {
    // id가 type을 포함하거나 같으면 진행 (단순화된 로직)
    if (m.id === type && !m.claimed && m.current < m.target) {
      m.current += amount;
      if (m.current > m.target) m.current = m.target;
      changed = true;
    }
  });
  if (changed) saveProfile();
}

function claimMissionReward(missionIdx) {
  const m = profile.missions.list[missionIdx];
  if (!m || m.claimed || m.current < m.target) return false;

  m.claimed = true;
  
  // 보상 지급
  if (m.reward.coin) profile.coins += m.reward.coin;
  if (m.reward.exp) applyExp(m.reward.exp);
  if (m.reward.chest) profile.chests[m.reward.chest] += (m.reward.count || 1);

  saveProfile();
  return true;
}

// -------------------- Gacha Logic --------------------
function rollGacha(chestType) {
  const meta = CHEST_META[chestType];
  if (!meta) return null;

  // 확률 테이블에 따라 종류 결정
  const kind = pickWeighted(meta.odds); // "coin", "exp", "cosmeticC", ...

  let result = { kind, val: 0, meta: null, isDup: false };

  if (kind === "coin") {
    const amt = randInt(50, 150) * (chestType==="super"?3 : (chestType==="rare"?1.5 : 1));
    profile.coins += Math.floor(amt);
    result.val = Math.floor(amt);
  } 
  else if (kind === "exp") {
    const amt = randInt(20, 50) * (chestType==="super"?3 : (chestType==="rare"?1.5 : 1));
    applyExp(Math.floor(amt));
    result.val = Math.floor(amt);
  } 
  else if (kind.startsWith("cosmetic")) {
    const rarity = kind.replace("cosmetic", ""); // "C", "B", "A", "S"
    // 해당 등급 아이템 풀
    const pool = COSMETICS.filter(c => c.rarity === rarity);
    const item = pool[randInt(0, pool.length-1)];
    
    if (item) {
      result.meta = item;
      // 중복 체크
      if (profile.owned[item.slot].includes(item.id)) {
        result.isDup = true;
        profile.coins += meta.dupRefund;
      } else {
        profile.owned[item.slot].push(item.id);
      }
    } else {
      // 아이템이 없으면 코인으로 대체
      profile.coins += 50;
      result.kind = "coin";
      result.val = 50;
    }
  }

  // 히스토리 추가
  profile.gachaHistory.unshift({
    ts: Date.now(),
    chest: chestType,
    result: result
  });
  if (profile.gachaHistory.length > 20) profile.gachaHistory.pop();
  
  saveProfile();
  return result;
}
