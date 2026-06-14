const STORAGE_KEY = "fairyclick-save";
const PRESTIGE_THRESHOLD = 100000;
const STARDUST_PER_GLOW = 100000;
const WAND_BASE_COST = 25;
const WAND_GROWTH = 1.75;
const HELPER_BASE_COST = 1000;
const HELPER_GROWTH = 1.28;

const buildings = [
  {
    key: "sunflowers",
    name: "Sunflower",
    baseCost: 100,
    income: 5,
    growth: 1.18,
    description: "A sunny bloom that produces Glow.",
  },
  {
    key: "moonflowers",
    name: "Moonflower",
    baseCost: 500,
    income: 20,
    growth: 1.22,
    description: "A nocturnal bloom that gently boosts the garden.",
  },
  {
    key: "crystalTrees",
    name: "Crystal Tree",
    baseCost: 5000,
    income: 100,
    growth: 1.26,
    description: "An ancient tree filled with magic.",
  },
];

const achievements = [
  {
    id: "firstGlow",
    name: "First Glow",
    condition: (state) => state.glow >= 100,
    bonus: 0.05,
    description: "Earn 100 Glow",
  },
  {
    id: "collector",
    name: "Collector",
    condition: (state) => state.glow >= 1000,
    bonus: 0.05,
    description: "Earn 1000 Glow",
  },
  {
    id: "gardener",
    name: "Gardener",
    condition: (state) => state.sunflowers + state.moonflowers >= 1,
    bonus: 0.05,
    description: "Buy your first flower",
  },
  {
    id: "fairyFriend",
    name: "Fairy Friend",
    condition: (state) => state.fairyHelpers >= 1,
    bonus: 0.05,
    description: "Hire your first fairy helper",
  },
  {
    id: "richFairy",
    name: "Rich Fairy",
    condition: (state) => state.glow >= 10000,
    bonus: 0.1,
    description: "Stockpile 10000 Glow",
  },
];

const buildingMap = Object.fromEntries(buildings.map((building) => [building.key, building]));
const achievementMap = Object.fromEntries(achievements.map((achievement) => [achievement.id, achievement]));

const defaultState = () => ({
  glow: 0,
  totalGlowEarned: 0,
  clickPower: 1,
  sunflowers: 0,
  moonflowers: 0,
  crystalTrees: 0,
  fairyHelpers: 0,
  achievements: [],
  stardust: 0,
  playTime: 0,
  eventLog: [],
});

const dom = {
  statGlow: document.querySelector("#statGlow"),
  statGlowPerSec: document.querySelector("#statGlowPerSec"),
  statClickPower: document.querySelector("#statClickPower"),
  statFairyHelpers: document.querySelector("#statFairyHelpers"),
  statStardust: document.querySelector("#statStardust"),
  fairyButton: document.querySelector("#fairyButton"),
  gardenScene: document.querySelector("#gardenScene"),
  gardenStageName: document.querySelector("#gardenStageName"),
  gardenStageRange: document.querySelector("#gardenStageRange"),
  status: document.querySelector("#status"),
  buildingList: document.querySelector("#buildingList"),
  helperButton: document.querySelector("#helperButton"),
  helperCost: document.querySelector("#helperCost"),
  helperCount: document.querySelector("#helperCount"),
  wandButton: document.querySelector("#wandButton"),
  wandCost: document.querySelector("#wandCost"),
  achievementList: document.querySelector("#achievementList"),
  prestigeButton: document.querySelector("#prestigeButton"),
  prestigeInfo: document.querySelector("#prestigeInfo"),
  playTimeInfo: document.querySelector("#playTimeInfo"),
  eventLog: document.querySelector("#eventLog"),
};

let state = loadState();
let lastTick = performance.now();
let saveAvailable = true;
const buildingNodes = {};
const achievementNodes = {};

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function integer(value, fallback = 0) {
  return Math.max(0, Math.floor(number(value, fallback)));
}

function formatAmount(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function loadState() {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return base;
    }

    const saved = JSON.parse(raw);
    const achievementIds = Array.isArray(saved.achievements)
      ? saved.achievements.filter((id) => achievementMap[id])
      : [];

    return {
      glow: number(saved.glow ?? base.glow),
      totalGlowEarned: number(saved.totalGlowEarned ?? saved.totalGlow ?? base.totalGlowEarned),
      clickPower: number(saved.clickPower ?? saved.power ?? base.clickPower),
      sunflowers: integer(saved.sunflowers ?? saved.buildings?.sunflowers ?? base.sunflowers),
      moonflowers: integer(saved.moonflowers ?? saved.garden ?? base.moonflowers),
      crystalTrees: integer(saved.crystalTrees ?? base.crystalTrees),
      fairyHelpers: integer(saved.fairyHelpers ?? base.fairyHelpers),
      achievements: achievementIds,
      stardust: integer(saved.stardust ?? base.stardust),
      playTime: number(saved.playTime ?? base.playTime),
      eventLog: Array.isArray(saved.eventLog)
        ? saved.eventLog.map((entry) => String(entry?.text ?? entry)).filter(Boolean).slice(-20)
        : base.eventLog,
    };
  } catch {
    return base;
  }
}

function saveState() {
  if (!saveAvailable) {
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        glow: state.glow,
        totalGlowEarned: state.totalGlowEarned,
        clickPower: state.clickPower,
        sunflowers: state.sunflowers,
        moonflowers: state.moonflowers,
        crystalTrees: state.crystalTrees,
        fairyHelpers: state.fairyHelpers,
        achievements: state.achievements,
        stardust: state.stardust,
        playTime: state.playTime,
        eventLog: state.eventLog.slice(-20),
      })
    );
  } catch {
    saveAvailable = false;
  }
}

function addEvent(message) {
  state.eventLog = [...state.eventLog, message].slice(-20);
}

function getAchievementBonus() {
  return state.achievements.reduce((sum, id) => sum + (achievementMap[id]?.bonus ?? 0), 0);
}

function getIncomeMultiplier() {
  return 1 + getAchievementBonus() + state.stardust * 0.1;
}

function getBuildingCount(key) {
  return state[key] ?? 0;
}

function getBuildingCost(building) {
  return Math.ceil(building.baseCost * building.growth ** getBuildingCount(building.key));
}

function getWandCost() {
  return Math.ceil(WAND_BASE_COST * WAND_GROWTH ** Math.max(0, state.clickPower - 1));
}

function getHelperCost() {
  return Math.ceil(HELPER_BASE_COST * HELPER_GROWTH ** state.fairyHelpers);
}

function getBasePassivePerSec() {
  return buildings.reduce((sum, building) => sum + getBuildingCount(building.key) * building.income, 0);
}

function getAutoClicksPerSec() {
  return state.fairyHelpers;
}

function getGlowPerSec() {
  const rawPassive = getBasePassivePerSec();
  const rawAuto = getAutoClicksPerSec() * state.clickPower;
  return (rawPassive + rawAuto) * getIncomeMultiplier();
}

function getEffectiveClickPower() {
  return state.clickPower * getIncomeMultiplier();
}

function addGlow(amount, countTowardTotal = true) {
  if (amount <= 0) {
    return 0;
  }

  state.glow += amount;
  if (countTowardTotal) {
    state.totalGlowEarned += amount;
  }
  return amount;
}

function getGardenStage() {
  if (state.glow < 100) {
    return { id: 1, name: "Empty Meadow", range: "0 - 100 Glow" };
  }
  if (state.glow < 1000) {
    return { id: 2, name: "Blooming Field", range: "100 - 1000 Glow" };
  }
  if (state.glow < 10000) {
    return { id: 3, name: "Forest Edge", range: "1000 - 10000 Glow" };
  }
  return { id: 4, name: "Magical Forest", range: "10000+ Glow" };
}

function addAchievement(id) {
  if (!state.achievements.includes(id)) {
    state.achievements = [...state.achievements, id];
    addEvent(`Achievement unlocked: ${achievementMap[id].name}`);
  }
}

function unlockAchievements() {
  for (const achievement of achievements) {
    if (!state.achievements.includes(achievement.id) && achievement.condition(state)) {
      addAchievement(achievement.id);
    }
  }
}

function renderGardenStage() {
  const stage = getGardenStage();
  dom.gardenStageName.textContent = stage.name;
  dom.gardenStageRange.textContent = stage.range;
  dom.gardenScene.className = `garden-stage stage-${stage.id}`;
  document.body.classList.remove("stage-1", "stage-2", "stage-3", "stage-4");
  document.body.classList.add(`stage-${stage.id}`);
}

function renderStats() {
  dom.statGlow.textContent = formatAmount(state.glow);
  dom.statGlowPerSec.textContent = formatAmount(getGlowPerSec());
  dom.statClickPower.textContent = formatAmount(getEffectiveClickPower());
  dom.statFairyHelpers.textContent = formatAmount(state.fairyHelpers);
  dom.statStardust.textContent = formatAmount(state.stardust);
}

function renderWand() {
  dom.wandCost.textContent = `${formatAmount(getWandCost())} Glow`;
  dom.wandButton.disabled = state.glow < getWandCost();
}

function renderHelpers() {
  dom.helperCost.textContent = `${formatAmount(getHelperCost())} Glow`;
  dom.helperCount.textContent = formatAmount(state.fairyHelpers);
  dom.helperButton.disabled = state.glow < getHelperCost();
}

function renderBuildings() {
  for (const building of buildings) {
    const nodes = buildingNodes[building.key];
    const count = getBuildingCount(building.key);
    const cost = getBuildingCost(building);
    nodes.count.textContent = `${formatAmount(count)} owned`;
    nodes.income.textContent = `+${formatAmount(building.income)} Glow/sec`;
    nodes.cost.textContent = `${formatAmount(cost)} Glow`;
    nodes.button.disabled = state.glow < cost;
    nodes.button.dataset.owned = String(count);
  }
}

function renderAchievements() {
  for (const achievement of achievements) {
    const nodes = achievementNodes[achievement.id];
    const unlocked = state.achievements.includes(achievement.id);
    nodes.card.classList.toggle("is-unlocked", unlocked);
    nodes.status.textContent = unlocked ? "Unlocked" : "Locked";
    nodes.status.dataset.state = unlocked ? "unlocked" : "locked";
  }
}

function renderLog() {
  const entries = [...state.eventLog].slice(-20).reverse();
  dom.eventLog.innerHTML = entries.length ? entries.map((entry) => `<li>${entry}</li>`).join("") : "<li>No events yet.</li>";
}

function renderPrestige() {
  const totalPotentialStardust = Math.floor(state.totalGlowEarned / STARDUST_PER_GLOW);
  const stardustGain = Math.max(0, totalPotentialStardust - state.stardust);
  const nextTarget = (state.stardust + 1) * STARDUST_PER_GLOW;
  const remaining = Math.max(0, nextTarget - state.totalGlowEarned);

  dom.prestigeButton.hidden = state.totalGlowEarned < PRESTIGE_THRESHOLD && state.stardust === 0;
  dom.prestigeButton.disabled = stardustGain <= 0;
  dom.prestigeButton.textContent = stardustGain > 0 ? `Prestige for ${formatAmount(stardustGain)} Stardust` : "Prestige";

  if (state.totalGlowEarned < PRESTIGE_THRESHOLD && state.stardust === 0) {
    dom.prestigeInfo.textContent = `Reach ${formatAmount(PRESTIGE_THRESHOLD)} total Glow earned to unlock Stardust.`;
  } else if (stardustGain > 0) {
    dom.prestigeInfo.textContent = `Claim ${formatAmount(stardustGain)} Stardust now. Current bonus: +${formatAmount(state.stardust * 10)}%.`;
  } else {
    dom.prestigeInfo.textContent = `Next Stardust at ${formatAmount(nextTarget)} total Glow. ${formatAmount(remaining)} more to go.`;
  }

  dom.playTimeInfo.textContent = `Play time: ${formatDuration(state.playTime)}. Total earned: ${formatAmount(state.totalGlowEarned)} Glow.`;
}

function render() {
  renderGardenStage();
  renderStats();
  renderWand();
  renderBuildings();
  renderHelpers();
  renderAchievements();
  renderLog();
  renderPrestige();
  saveState();
}

function purchaseBuilding(buildingKey) {
  const building = buildingMap[buildingKey];
  const cost = getBuildingCost(building);
  if (state.glow < cost) {
    return;
  }

  state.glow -= cost;
  state[building.key] += 1;
  addEvent(`Bought ${building.name}`);
  dom.status.textContent = `${building.name} was added to the garden.`;
  unlockAchievements();
  render();
}

function upgradeWand() {
  const cost = getWandCost();
  if (state.glow < cost) {
    return;
  }

  state.glow -= cost;
  state.clickPower += 1;
  addEvent(`Wand upgraded to ${formatAmount(state.clickPower)}`);
  dom.status.textContent = "Your wand catches a sharper glimmer.";
  unlockAchievements();
  render();
}

function hireHelper() {
  const cost = getHelperCost();
  if (state.glow < cost) {
    return;
  }

  state.glow -= cost;
  state.fairyHelpers += 1;
  addEvent("Hired a Fairy Helper");
  dom.status.textContent = "A fairy helper starts gathering glow.";
  unlockAchievements();
  render();
}

function prestige() {
  const totalPotentialStardust = Math.floor(state.totalGlowEarned / STARDUST_PER_GLOW);
  const stardustGain = totalPotentialStardust - state.stardust;
  if (stardustGain <= 0) {
    return;
  }

  state.stardust = totalPotentialStardust;
  state.glow = 0;
  state.clickPower = 1;
  state.sunflowers = 0;
  state.moonflowers = 0;
  state.crystalTrees = 0;
  state.fairyHelpers = 0;
  state.achievements = [];
  addEvent(`Gained ${formatAmount(stardustGain)} Stardust`);
  addEvent("Prestige complete. Progress reset.");
  dom.status.textContent = "The garden has been reborn with Stardust.";
  render();
}

function tick(now) {
  const deltaSeconds = Math.max(0, (now - lastTick) / 1000);
  lastTick = now;

  state.playTime += deltaSeconds;

  const passive = getBasePassivePerSec();
  const helpers = getAutoClicksPerSec() * state.clickPower;
  const gained = (passive + helpers) * getIncomeMultiplier() * deltaSeconds;
  if (gained > 0) {
    addGlow(gained);
  }

  unlockAchievements();
  render();
}

function wireBuildingButtons() {
  dom.buildingList.innerHTML = buildings
    .map(
      (building) => `
        <button class="shop-card" type="button" data-building="${building.key}">
          <div class="shop-card-copy">
            <p class="shop-title">${building.name}</p>
            <p class="shop-desc">${building.description}</p>
          </div>
          <div class="shop-card-meta">
            <span class="shop-count" data-count="${building.key}">0 owned</span>
            <span class="shop-income" data-income="${building.key}">+0 Glow/sec</span>
            <span class="shop-cost" data-cost="${building.key}">0 Glow</span>
          </div>
        </button>
      `
    )
    .join("");

  for (const building of buildings) {
    const card = dom.buildingList.querySelector(`[data-building="${building.key}"]`);
    buildingNodes[building.key] = {
      button: card,
      count: card.querySelector(`[data-count="${building.key}"]`),
      income: card.querySelector(`[data-income="${building.key}"]`),
      cost: card.querySelector(`[data-cost="${building.key}"]`),
    };
    card.addEventListener("click", () => purchaseBuilding(building.key));
  }
}

function wireAchievementCards() {
  dom.achievementList.innerHTML = achievements
    .map(
      (achievement) => `
        <article class="achievement-card" data-achievement="${achievement.id}">
          <div class="achievement-head">
            <p class="achievement-name">${achievement.name}</p>
            <span class="achievement-status" data-status="${achievement.id}">Locked</span>
          </div>
          <p class="achievement-desc">${achievement.description}</p>
          <p class="achievement-bonus">+${formatAmount(achievement.bonus * 100)}% to all income</p>
        </article>
      `
    )
    .join("");

  for (const achievement of achievements) {
    const card = dom.achievementList.querySelector(`[data-achievement="${achievement.id}"]`);
    achievementNodes[achievement.id] = {
      card,
      status: card.querySelector(`[data-status="${achievement.id}"]`),
    };
  }
}

function wireButtons() {
  dom.fairyButton.addEventListener("click", () => {
    const gained = addGlow(getEffectiveClickPower());
    if (gained <= 0) {
      return;
    }

    dom.fairyButton.classList.remove("pulse");
    void dom.fairyButton.offsetWidth;
    dom.fairyButton.classList.add("pulse");
    addEvent(`+${formatAmount(gained)} Glow`);
    dom.status.textContent = "The fairy ring hums brighter.";
    unlockAchievements();
    render();
  });

  dom.wandButton.addEventListener("click", upgradeWand);
  dom.helperButton.addEventListener("click", hireHelper);
  dom.prestigeButton.addEventListener("click", prestige);
}

wireBuildingButtons();
wireAchievementCards();
wireButtons();
unlockAchievements();
render();
window.setInterval(() => tick(performance.now()), 1000);
window.addEventListener("beforeunload", saveState);
