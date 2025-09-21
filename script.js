let jormas = 0;
let totalClicks = 0;
let jormasPerClick = 1;
let items = {
    mouse: { count: 0, cost: 100, costIncrease: 50, jormasPerSecond: 1, interval: 1000 },
    paskaPasi: { count: 0, cost: 250, costIncrease: 100, jormasPer: 5, interval: 3500 },
    pirjo: { count: 0, cost: 500, costIncrease: 150, jormasPer: 50, interval: 10000 }
};
let upgrades = [
    { id: 'click1', clicksRequired: 100, cost: 1000, effect: () => jormasPerClick = 2, description: 'Double Click: 2 Jormas/click' },
    { id: 'click2', clicksRequired: 500, cost: 2000, effect: () => jormasPerClick = 4, description: 'Quad Click: 4 Jormas/click' },
    { id: 'click3', clicksRequired: 1500, cost: 3500, effect: () => jormasPerClick = 16, description: 'Super Click: 16 Jormas/click' },
    { id: 'click4', clicksRequired: 5000, cost: 10000, effect: () => jormasPerClick = 124, description: 'Mega Click: 124 Jormas/click' },
    { id: 'mouse1', clicksRequired: 500, cost: 1000, effect: () => { items.mouse.jormasPerSecond = 2; items.mouse.interval = 500; startItemInterval('mouse'); }, description: 'Mouse Upgrade: 2 Jormas/0.5s', item: 'mouse' },
    { id: 'paskaPasi1', jormasRequired: 2000, cost: 5000, effect: () => { items.paskaPasi.jormasPer = 10; items.paskaPasi.interval = 3000; startItemInterval('paskaPasi'); }, description: 'Paska Pasi Upgrade: 10 Jormas/3s', item: 'paskaPasi' },
    { id: 'pirjo1', jormasRequired: 1000, cost: 3500, effect: () => { items.pirjo.jormasPer = 500; startItemInterval('pirjo'); }, description: 'Pirjo Upgrade 1: 500 Jormas/10s', item: 'pirjo' },
    { id: 'pirjo2', jormasRequired: 1000, cost: 10000, effect: () => { items.pirjo.jormasPer = 1000; items.pirjo.interval = 5000; startItemInterval('pirjo'); }, description: 'Pirjo Upgrade 2: 1000 Jormas/5s', item: 'pirjo', requires: 'pirjo1' }
];
let purchasedUpgrades = new Set();
let itemJormasEarned = { mouse: 0, paskaPasi: 0, pirjo: 0 };

// DOM elements
const jormaCount = document.getElementById('jorma-count');
const clickCount = document.getElementById('click-count');
const storeItems = document.getElementById('store-items');
const upgradesDiv = document.getElementById('upgrades');

// Load saved progress
function loadProgress() {
    const saved = localStorage.getItem('jormaClicker');
    if (saved) {
        const data = JSON.parse(saved);
        jormas = data.jormas || 0;
        totalClicks = data.totalClicks || 0;
        jormasPerClick = data.jormasPerClick || 1;
        items.mouse.count = data.mouseCount || 0;
        items.paskaPasi.count = data.paskaPasiCount || 0;
        items.pirjo.count = data.pirjoCount || 0;
        items.mouse.cost = data.mouseCost || 100;
        items.paskaPasi.cost = data.paskaPasiCost || 250;
        items.pirjo.cost = data.pirjoCost || 500;
        purchasedUpgrades = new Set(data.purchasedUpgrades || []);
        itemJormasEarned = data.itemJormasEarned || { mouse: 0, paskaPasi: 0, pirjo: 0 };
    }
    updateUI();
    startItemIntervals();
}

// Save progress
function saveProgress() {
    localStorage.setItem('jormaClicker', JSON.stringify({
        jormas,
        totalClicks,
        jormasPerClick,
        mouseCount: items.mouse.count,
        paskaPasiCount: items.paskaPasi.count,
        pirjoCount: items.pirjo.count,
        mouseCost: items.mouse.cost,
        paskaPasiCost: items.paskaPasi.cost,
        pirjoCost: items.pirjo.cost,
        purchasedUpgrades: Array.from(purchasedUpgrades),
        itemJormasEarned
    }));
}

// Click Jorma
function clickJorma() {
    jormas += jormasPerClick;
    totalClicks++;
    updateUI();
    saveProgress();
}

// Buy store item
function buyItem(item) {
    if (jormas >= items[item].cost) {
        jormas -= items[item].cost;
        items[item].count++;
        items[item].cost += items[item].costIncrease;
        startItemInterval(item);
        updateUI();
        saveProgress();
    }
}

// Start item intervals
function startItemInterval(item) {
    if (items[item].count > 0) {
        clearInterval(window[item + 'Interval']);
        window[item + 'Interval'] = setInterval(() => {
            const earned = items[item].jormasPerSecond ? items[item].jormasPerSecond * items[item].count : items[item].jormasPer * items[item].count;
            jormas += earned;
            itemJormasEarned[item] += earned;
            updateUI();
            saveProgress();
        }, items[item].interval);
    }
}

function startItemIntervals() {
    Object.keys(items).forEach(startItemInterval);
}

// Buy upgrade
function buyUpgrade(id) {
    const upgrade = upgrades.find(u => u.id === id);
    if (jormas >= upgrade.cost && !purchasedUpgrades.has(id)) {
        jormas -= upgrade.cost;
        upgrade.effect();
        purchasedUpgrades.add(id);
        updateUI();
        saveProgress();
    }
}

// Update UI
function updateUI() {
    jormaCount.textContent = Math.floor(jormas);
    clickCount.textContent = totalClicks;
    document.getElementById('mouse-cost').textContent = items.mouse.cost;
    document.getElementById('paska-pasi-cost').textContent = items.paskaPasi.cost;
    document.getElementById('pirjo-cost').textContent = items.pirjo.cost;
    document.getElementById('buy-mouse').disabled = jormas < items.mouse.cost;
    document.getElementById('buy-paska-pasi').disabled = jormas < items.paskaPasi.cost;
    document.getElementById('buy-pirjo').disabled = jormas < items.pirjo.cost;

    // Update upgrades
    upgradesDiv.innerHTML = '';
    upgrades.forEach(upgrade => {
        if (!purchasedUpgrades.has(upgrade.id) &&
            (upgrade.clicksRequired ? totalClicks >= upgrade.clicksRequired : itemJormasEarned[upgrade.item] >= upgrade.jormasRequired) &&
            (!upgrade.requires || purchasedUpgrades.has(upgrade.requires))) {
            const button = document.createElement('button');
            button.textContent = `${upgrade.description} (Cost: ${upgrade.cost})`;
            button.disabled = jormas < upgrade.cost;
            button.onclick = () => buyUpgrade(upgrade.id);
            upgradesDiv.appendChild(button);
        }
    });
}

// Initialize
loadProgress();