const state = {
  glow: 0,
  power: 1,
  upgradeCost: 25,
  gardenCost: 120,
  garden: 0,
};

const score = document.querySelector("#score");
const power = document.querySelector("#power");
const fairyButton = document.querySelector("#fairyButton");
const upgradeButton = document.querySelector("#upgradeButton");
const gardenButton = document.querySelector("#gardenButton");
const upgradeCost = document.querySelector("#upgradeCost");
const gardenCost = document.querySelector("#gardenCost");
const status = document.querySelector("#status");

function format(value) {
  return Math.floor(value).toLocaleString("en-US");
}

function render() {
  score.textContent = format(state.glow);
  power.textContent = format(state.power);
  upgradeCost.textContent = `${format(state.upgradeCost)} glow`;
  gardenCost.textContent = `${format(state.gardenCost)} glow`;
  upgradeButton.disabled = state.glow < state.upgradeCost;
  gardenButton.disabled = state.glow < state.gardenCost;
}

function floatText(text) {
  const note = document.createElement("span");
  note.className = "float-text";
  note.textContent = text;
  fairyButton.append(note);
  window.setTimeout(() => note.remove(), 700);
}

fairyButton.addEventListener("click", () => {
  state.glow += state.power;
  fairyButton.classList.remove("pulse");
  void fairyButton.offsetWidth;
  fairyButton.classList.add("pulse");
  floatText(`+${format(state.power)}`);
  status.textContent = "The fairy ring hums brighter.";
  render();
});

upgradeButton.addEventListener("click", () => {
  if (state.glow < state.upgradeCost) return;
  state.glow -= state.upgradeCost;
  state.power += 1 + state.garden;
  state.upgradeCost = Math.ceil(state.upgradeCost * 1.75);
  status.textContent = "Your wand catches a sharper glimmer.";
  render();
});

gardenButton.addEventListener("click", () => {
  if (state.glow < state.gardenCost) return;
  state.glow -= state.gardenCost;
  state.garden += 1;
  state.power += 3;
  state.gardenCost = Math.ceil(state.gardenCost * 2.2);
  status.textContent = "A moonflower blooms and lends its light.";
  render();
});

window.setInterval(() => {
  if (state.garden === 0) return;
  state.glow += state.garden;
  render();
}, 1000);

render();

