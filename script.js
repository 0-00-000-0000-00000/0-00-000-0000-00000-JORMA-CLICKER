let score = 0;
let clickValue = 1;
let items = {
    clicker: {count: 0, baseCost: 100, cost: 100, cps: 1, interval: 1000},
    paskapasi: {count: 0, baseCost: 250, cost: 250, cps: 5, interval: 3500},
    pirjo: {count: 0, baseCost: 500, cost: 500, cps: 50, interval: 10000}
};
let upgrades = [];

function clickJorma() {
    score += clickValue;
    document.getElementById('score').innerText = score;
    saveGame();
    checkUpgrades();
}

function buyItem(type) {
    let item = items[type];
    if (score >= item.cost) {
        score -= item.cost;
        item.count++;
        if (type === 'clicker') item.cost += 50;
        if (type === 'paskapasi') item.cost += 100;
        if (type === 'pirjo') item.cost += 150;
        document.getElementById('score').innerText = score;
        startItemInterval(type);
        saveGame();
    } else {
        alert('Not enough Jormas!');
    }
}

function startItemInterval(type) {
    let item = items[type];
    if (item.intervalId) return;
    item.intervalId = setInterval(() => {
        score += item.cps * item.count;
        document.getElementById('score').innerText = score;
        saveGame();
    }, item.interval);
}

function checkUpgrades() {
    if (clickValue === 1 && score >= 1000) {
        addUpgrade('Double Clicks (2 per click)', 1000, () => clickValue = 2);
    }
    if (clickValue === 2 && score >= 2000) {
        addUpgrade('Quadruple Clicks (4 per click)', 2000, () => clickValue = 4);
    }
    if (clickValue === 4 && score >= 3500) {
        addUpgrade('16x Clicks (16 per click)', 3500, () => clickValue = 16);
    }
    if (clickValue === 16 && score >= 10000) {
        addUpgrade('124x Clicks (124 per click)', 10000, () => clickValue = 124);
    }
}

function addUpgrade(name, cost, effect) {
    if (upgrades.find(u => u.name === name)) return;
    let upgrade = {name, cost, effect, bought: false};
    upgrades.push(upgrade);
    renderUpgrades();
}

function renderUpgrades() {
    let container = document.getElementById('upgrades');
    container.innerHTML = '';
    upgrades.forEach((u, i) => {
        if (!u.bought) {
            let btn = document.createElement('button');
            btn.innerText = u.name + ' (Cost: ' + u.cost + ' Jormas)';
            btn.onclick = () => buyUpgrade(i);
            container.appendChild(btn);
        }
    });
}

function buyUpgrade(index) {
    let u = upgrades[index];
    if (score >= u.cost) {
        score -= u.cost;
        u.effect();
        u.bought = true;
        document.getElementById('score').innerText = score;
        renderUpgrades();
        saveGame();
    } else {
        alert('Not enough Jormas!');
    }
}

function saveGame() {
    localStorage.setItem('jormaGame', JSON.stringify({
        score, clickValue, items, upgrades
    }));
}

function loadGame() {
    let data = localStorage.getItem('jormaGame');
    if (data) {
        let save = JSON.parse(data);
        score = save.score || 0;
        clickValue = save.clickValue || 1;
        items = save.items || items;
        upgrades = save.upgrades || [];
        document.getElementById('score').innerText = score;
        renderUpgrades();
        for (let type in items) {
            if (items[type].count > 0) startItemInterval(type);
        }
    }
}

window.onload = loadGame;
