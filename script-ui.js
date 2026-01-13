'use strict';

// -------------------- UI Helpers --------------------
function showScreen(name) {
  const screens = ["Home","Setup","Quiz","Result","Shop","Inventory","Gacha","Missions","Notebook","Settings"];
  screens.forEach(s => {
    const el = $(`screen${s}`);
    if (el) el.classList.toggle("hidden", s !== name);
  });
  window.scrollTo(0,0);
}

function _notify(msg) {
  const pill = $("pillStatus");
  if (pill) {
    pill.textContent = msg;
    pill.classList.remove("bounce");
    void pill.offsetWidth; // reflow
    pill.classList.add("bounce");
  } else {
    alert(msg);
  }
}

// -------------------- Rendering --------------------
function renderHeader() {
  safeText($("coinText"), profile.coins);
  safeText($("gemText"), profile.gems);
  safeText($("levelGlobalText"), profile.level);
  
  // 아바타 미리보기 업데이트
  renderAvatar("homeAvatar");
  renderAvatar("avatar");
  renderAvatar("shopAvatar");
}

function safeText(el, t) { if(el) el.textContent = t; }

function renderAvatar(idPrefix) {
  const c = findChar(profile.charId);
  const stage = stageByLevel(profile.level);
  const eq = getEquipped();

  safeText($(idPrefix+"Base"), c.base);
  safeText($(idPrefix+"Skin"), stage.skin);
  safeText($(idPrefix+"Hat"), emojiOf(eq.hat));
  safeText($(idPrefix+"Face"), emojiOf(eq.face));
  safeText($(idPrefix+"Hand"), emojiOf(eq.hand));
  safeText($(idPrefix+"Effect"), emojiOf(eq.effect));
  
  if($(idPrefix+"Name")) safeText($(idPrefix+"Name"), c.name);
}

function renderGrowth() {
  const stage = stageByLevel(profile.level);
  safeText($("skinStageBadge"), stage.label);
  safeText($("expText"), profile.exp);
  safeText($("expNeedText"), expNeedFor(profile.level));
  
  const bar = $("expBar");
  if (bar) {
    const pct = Math.min(100, (profile.exp / expNeedFor(profile.level)) * 100);
    bar.style.width = `${pct}%`;
  }
}

function renderChests() {
  safeText($("chestBasicCount"), profile.chests.basic);
  safeText($("chestRareCount"), profile.chests.rare);
  safeText($("chestSuperCount"), profile.chests.super);
  safeText($("gachaChestCount"), profile.chests.basic); // Default tab
}

// -------------------- Quiz UI --------------------
function renderQuestion() {
  if (RUN.idx >= RUN.deck.length) {
    finishQuiz();
    return;
  }
  const q = RUN.deck[RUN.idx];
  
  safeText($("qIndex"), RUN.idx + 1);
  safeText($("qTotal"), RUN.count);
  safeText($("scoreText"), RUN.score);
  safeText($("catText"), CAT_LABEL[q.cat] || q.cat);
  safeText($("qText"), q.q);
  safeText($("qBadge"), DIFF_LABEL[RUN.diff]);
  
  // Timer bar reset
  if (RUN.timerEnabled) {
    $("timerWrap").classList.remove("hidden");
    updateTimerUI();
  } else {
    $("timerWrap").classList.add("hidden");
  }

  // Choices
  const choicesDiv = $("choices");
  choicesDiv.innerHTML = "";
  
  q.choices.forEach((txt, i) => {
    const btn = document.createElement("button");
    btn.className = "choiceBtn";
    btn.textContent = txt;
    btn.onclick = () => onChoice(i, btn);
    choicesDiv.appendChild(btn);
  });
  
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  $("btnNext").classList.add("hidden");
  
  RUN.locked = false;
  startTimer();
}

function onChoice(i, btn) {
  if (RUN.locked) return;
  RUN.locked = true;
  stopTimer();

  const res = checkAnswerLogic(i);
  
  // UI Feedback
  const fb = $("feedback");
  fb.textContent = res.msg;
  fb.className = "feedback " + (res.correct ? "good" : "bad");

  if (res.correct) {
    btn.classList.add("correct");
    setTimeout(nextQuestion, 1200);
  } else {
    btn.classList.add("wrong");
    // 정답 표시
    const btns = $$(".choiceBtn");
    const q = RUN.deck[RUN.idx];
    if(btns[q.answer]) btns[q.answer].classList.add("correct");
    
    // 오답일 경우 다음 버튼 보이기 (해설 확인 등)
    $("btnNext").classList.remove("hidden");
  }
  
  // Header stats update
  safeText($("streakText"), RUN.streak);
  safeText($("runCoinsText"), RUN.runCoins);
  safeText($("runExpText"), RUN.runExp);
}

function nextQuestion() {
  RUN.idx++;
  renderQuestion();
}

function finishQuiz() {
  finishQuizLogic();
  showScreen("Result");
  
  safeText($("finalScore"), RUN.score);
  safeText($("correctCount"), RUN.correct);
  safeText($("wrongCount"), RUN.wrong);
  safeText($("finalCoins"), RUN.runCoins);
  safeText($("finalExp"), RUN.runExp);
  
  const chestEl = $("finalChest");
  if (RUN.lastRewardChest) {
    chestEl.textContent = `${RUN.lastRewardChest.type.toUpperCase()} 상자 +${RUN.lastRewardChest.count}`;
    chestEl.style.color = "var(--good)";
  } else {
    chestEl.textContent = "없음";
    chestEl.style.color = "var(--muted)";
  }
  
  // 오답 리스트 렌더링
  const list = $("wrongList");
  list.innerHTML = "";
  RUN.wrongItems.forEach(w => {
    const div = document.createElement("div");
    div.className = "wrongItem";
    div.innerHTML = `
      <div class="wrongQ">Q. ${w.q}</div>
      <div class="wrongMeta">정답: ${w.choices[w.answer]} | 해설: ${w.explain || '-'}</div>
    `;
    list.appendChild(div);
  });
}

// -------------------- Timer --------------------
function startTimer() {
  if (!RUN.timerEnabled) return;
  RUN.timeLeft = RUN.timePerQ;
  RUN.qStartTs = Date.now();
  updateTimerUI();
  
  if (RUN.timerId) clearInterval(RUN.timerId);
  RUN.timerId = setInterval(() => {
    RUN.timeLeft--;
    updateTimerUI();
    if (RUN.timeLeft <= 0) {
      stopTimer();
      onTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (RUN.timerId) {
    clearInterval(RUN.timerId);
    RUN.timerId = null;
  }
}

function updateTimerUI() {
  safeText($("timeLeftText"), RUN.timeLeft);
  const bar = $("timeBar");
  if (bar) {
    const pct = (RUN.timeLeft / RUN.timePerQ) * 100;
    bar.style.width = `${pct}%`;
  }
}

function onTimeout() {
  if (RUN.locked) return;
  RUN.locked = true;
  $("feedback").textContent = "시간 초과! ⏰";
  $("feedback").className = "feedback bad";
  
  // 정답 표시
  const q = RUN.deck[RUN.idx];
  const btns = $$(".choiceBtn");
  if(btns[q.answer]) btns[q.answer].classList.add("correct");
  
  // 오답 처리
  checkAnswerLogic(-1); // -1 is always wrong
  
  $("btnNext").classList.remove("hidden");
}

// -------------------- Shop & Inventory --------------------
function renderShop() {
  const grid = $("shopGrid");
  grid.innerHTML = "";
  
  // 예시: Chests
  SHOP_CHESTS.forEach(p => {
    const el = document.createElement("div");
    el.className = "itemCard";
    el.innerHTML = `
      <div class="itemTop"><span class="itemEmoji">${p.emoji}</span></div>
      <div class="itemName">${p.name}</div>
      <div class="itemMeta">${p.priceCoin > 0 ? p.priceCoin + " 🪙" : p.priceGem + " 💎"}</div>
    `;
    el.onclick = () => buyItem(p);
    grid.appendChild(el);
  });

  // Cosmetics
  COSMETICS.forEach(c => {
    const owned = profile.owned[c.slot].includes(c.id);
    const el = document.createElement("div");
    el.className = "itemCard";
    if(owned) el.style.opacity = "0.5";
    
    el.innerHTML = `
      <div class="itemTop"><span class="itemEmoji">${c.emoji}</span></div>
      <div class="itemName">${c.name}</div>
      <div class="itemMeta">${owned ? "보유중" : c.price + " 🪙"}</div>
    `;
    el.onclick = () => {
      // 미리보기
      const prevEq = profile.equippedByChar[profile.charId][c.slot];
      profile.equippedByChar[profile.charId][c.slot] = c.id;
      renderAvatar("shopAvatar");
      
      // 구매 확인 (간단 구현)
      if(!owned) {
        if(confirm(`${c.name}을(를) ${c.price}코인에 구매할까요?`)){
           if(profile.coins >= c.price){
             profile.coins -= c.price;
             profile.owned[c.slot].push(c.id);
             _notify("구매 완료!");
             renderAll();
           } else {
             _notify("코인이 부족해요!");
             // 원복
             profile.equippedByChar[profile.charId][c.slot] = prevEq;
             renderAvatar("shopAvatar");
           }
        } else {
          // 취소 시 원복
          profile.equippedByChar[profile.charId][c.slot] = prevEq;
          renderAvatar("shopAvatar");
        }
      }
    };
    grid.appendChild(el);
  });
  
  safeText($("shopCoinText"), profile.coins);
}

function buyItem(product) {
  if (product.type === "chest") {
    if (product.priceCoin > 0) {
      if (profile.coins >= product.priceCoin) {
        if(confirm(`${product.name} 구매?`)){
          profile.coins -= product.priceCoin;
          profile.chests[product.chest]++;
          _notify("상자 구매 완료!");
          saveProfile();
          renderAll();
        }
      } else {
        _notify("코인이 부족해요.");
      }
    }
  }
}

function renderInventory() {
  const grid = $("invItemGrid");
  grid.innerHTML = "";
  
  const categories = ["hat","face","hand","effect"];
  categories.forEach(cat => {
    profile.owned[cat].forEach(id => {
      const item = itemById(id);
      if(!item) return;
      const el = document.createElement("div");
      const isEq = (getEquipped()[cat] === id);
      el.className = "itemCard" + (isEq ? " active" : "");
      if(isEq) el.style.borderColor = "var(--good)";
      
      el.innerHTML = `
        <div class="itemTop"><span class="itemEmoji">${item.emoji}</span></div>
        <div class="itemName">${item.name}</div>
        <div class="itemMeta">${isEq ? "장착중" : "장착하기"}</div>
      `;
      el.onclick = () => {
        // Toggle Equip
        if(isEq) profile.equippedByChar[profile.charId][cat] = null;
        else profile.equippedByChar[profile.charId][cat] = id;
        saveProfile();
        renderAll();
      };
      grid.appendChild(el);
    });
  });
}

// -------------------- Gacha UI --------------------
let selectedChest = "basic";

function renderGachaUI() {
  // 탭 활성화 처리
  $$("#gachaChestTabs .segBtn").forEach(b => {
    b.classList.toggle("active", b.dataset.chest === selectedChest);
    b.onclick = () => { selectedChest = b.dataset.chest; renderGachaUI(); };
  });

  safeText($("gachaChestCount"), profile.chests[selectedChest]);
  
  // 히스토리
  const list = $("gachaHistory");
  list.innerHTML = "";
  profile.gachaHistory.forEach(h => {
    const div = document.createElement("div");
    div.className = "historyItem";
    let txt = "";
    if (h.result.kind === "coin") txt = `코인 +${h.result.val}`;
    else if (h.result.kind === "exp") txt = `EXP +${h.result.val}`;
    else if (h.result.meta) txt = `${h.result.meta.name} ${h.result.isDup?"(중복 환급)":"획득"}`;
    
    div.innerHTML = `
      <div class="historyLeft"><span class="historyEmoji">${h.chest==="basic"?"📦":"🎁"}</span></div>
      <div class="historyText">${txt}</div>
    `;
    list.appendChild(div);
  });
}

function doGacha() {
  if (profile.chests[selectedChest] <= 0) {
    _notify("상자가 부족해요!");
    return;
  }
  
  // Animation
  const box = $("gachaBox");
  box.classList.add("shake");
  
  setTimeout(() => {
    box.classList.remove("shake");
    profile.chests[selectedChest]--;
    
    const res = rollGacha(selectedChest);
    
    // 모달 표시
    const modal = $("modalReward");
    modal.classList.remove("hidden");
    
    let emoji = "❓";
    let msg = "";
    
    if (res.kind === "coin") { emoji = "🪙"; msg = `${res.val} 코인 획득!`; }
    else if (res.kind === "exp") { emoji = "🧬"; msg = `${res.val} EXP 획득!`; }
    else if (res.meta) { emoji = res.meta.emoji; msg = `${res.meta.name} ${res.isDup?"(중복 +코인)":"획득!"}`; }
    
    safeText($("rewardBig"), emoji);
    safeText($("rewardText"), msg);
    
    renderAll();
  }, 600);
}

// -------------------- Notebook UI --------------------
function renderNotebook() {
  const list = $("notebookList");
  list.innerHTML = "";
  
  if (profile.wrongs.length === 0) {
    list.innerHTML = "<div class='panel muted'>오답 노트가 비어있어요.</div>";
    return;
  }
  
  profile.wrongs.forEach(w => {
    const div = document.createElement("div");
    div.className = "wrongItem";
    div.innerHTML = `
      <div class="wrongQ">Q. ${w.q}</div>
      <div class="wrongMeta">답: ${w.choices[w.answer]} (${w.explain})</div>
    `;
    list.appendChild(div);
  });
}

// -------------------- Missions UI --------------------
function renderMissions() {
  ensureDailyMissions();
  const list = $("missionList");
  list.innerHTML = "";
  
  profile.missions.list.forEach((m, idx) => {
    const div = document.createElement("div");
    div.className = "missionItem";
    const done = m.current >= m.target;
    
    div.innerHTML = `
      <div class="missionLeft">
        <div class="missionTitle">${m.title}</div>
        <div class="missionSub">${m.current} / ${m.target}</div>
        <div class="meter"><div class="meterBar" style="width:${(m.current/m.target)*100}%"></div></div>
      </div>
      <div class="missionRight">
        ${m.claimed 
          ? `<span class="badge">완료</span>` 
          : `<button class="btn sm ${done?'primary':'ghost'}" ${done?'':'disabled'} onclick="claimMissionUI(${idx})">받기</button>`}
      </div>
    `;
    list.appendChild(div);
  });
  
  // Check-in
  const grid = $("checkinGrid");
  grid.innerHTML = "";
  for(let i=0; i<7; i++){
    const d = document.createElement("div");
    d.className = "checkinCell" + (i < profile.checkin.streak ? " done" : "");
    d.textContent = `Day ${i+1}`;
    grid.appendChild(d);
  }
}

function claimMissionUI(idx) {
  if (claimMissionReward(idx)) {
    _notify("보상을 받았습니다!");
    renderAll();
  }
}

function doCheckin() {
  const tk = todayKey();
  if (profile.checkin.lastDate === tk) {
    _notify("오늘 이미 출석했어요.");
    return;
  }
  profile.checkin.lastDate = tk;
  profile.checkin.streak = (profile.checkin.streak + 1) % 8; 
  // 7일 넘으면 리셋 or 유지 정책 (여기선 0~6 사이클)
  if(profile.checkin.streak === 0) profile.checkin.streak = 1;

  profile.coins += 50;
  _notify("출석 완료! +50 코인");
  saveProfile();
  renderAll();
}

// -------------------- Initialization --------------------
function bindEvents() {
  // Navigation
  $("btnNavHome").onclick = () => showScreen("Home");
  $("btnNavShop").onclick = () => showScreen("Shop");
  $("btnNavInventory").onclick = () => showScreen("Inventory");
  $("btnNavMissions").onclick = () => showScreen("Missions");
  $("btnNavNotebook").onclick = () => showScreen("Notebook");
  $("brandHomeBtn").onclick = () => showScreen("Home");

  // Home Actions
  $("btnStartQuick").onclick = () => showScreen("Setup");
  $("btnStart").onclick = () => {
    const opt = {
      mode: "normal",
      diff: qs(".segBtn.active[data-diff]").dataset.diff,
      cat: qs(".segBtn.active[data-cat]").dataset.cat,
      count: parseInt($("countInput").value),
      timerEnabled: $("timerEnabled").checked,
      timePerQ: parseInt($("timePerQ").value)
    };
    if (startQuizLogic(opt)) {
      showScreen("Quiz");
      renderQuestion();
    }
  };

  // Setup Segmented Controls
  $$("#catSeg .segBtn").forEach(b => b.onclick = (e) => {
    $$("#catSeg .segBtn").forEach(x => x.classList.remove("active"));
    e.target.classList.add("active");
  });
  $$("[data-diff]").forEach(b => b.onclick = (e) => {
    $$("[data-diff]").forEach(x => x.classList.remove("active"));
    e.target.classList.add("active");
  });

  // Quiz Actions
  $("btnNext").onclick = nextQuestion;
  $("btnQuit").onclick = () => showScreen("Home");
  $("btnRestart").onclick = () => $("btnStart").click();
  $("btnHome").onclick = () => showScreen("Home");

  // Gacha
  $("btnGoGacha").onclick = () => showScreen("Gacha");
  $("btnOpenChest").onclick = doGacha;
  $("btnCloseReward").onclick = () => $("modalReward").classList.add("hidden");
  $("btnOkReward").onclick = () => $("modalReward").classList.add("hidden");

  // Missions
  $("btnClaimCheckin").onclick = doCheckin;
  
  // Settings
  $("btnResetAll").onclick = () => {
    if(confirm("정말 초기화하시겠습니까?")){
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  };
}

function renderAll() {
  renderHeader();
  renderGrowth();
  renderChests();
  renderShop();
  renderInventory();
  renderGachaUI();
  renderMissions();
  renderNotebook();
  
  // Char list
  const list = $("charList");
  list.innerHTML = "";
  CHARACTERS.forEach(c => {
    const b = document.createElement("div");
    b.className = "charCard" + (profile.charId===c.id ? " active" : "");
    b.innerHTML = `<div class="charEmoji">${c.base}</div><div>${c.name}</div>`;
    b.onclick = () => { profile.charId=c.id; saveProfile(); renderAll(); };
    list.appendChild(b);
  });
}

// Start App
window.addEventListener("DOMContentLoaded", async () => {
  loadProfile();
  await loadData();
  bindEvents();
  renderAll();
  showScreen("Home");
  _notify("키즈 퀴즈랜드에 오신 것을 환영해요! 👋");
});
