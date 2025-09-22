// script.js
let points = 0;
let perSecond = 0;
let lastTime = Date.now();
let clickers = 0;
let paskaPasi = 0;
let pirjo = 0;
let gangJorma = 0;
let multipliers = 1; // for upgrades

// Upgrades: array of {name, cost, effect, owned: 0}
const upgrades = [
    {name: 'Click Power +1', cost: 10, effect: () => multipliers *= 1.1, owned: 0, maxVisible: 100},
    {name: 'Auto Click +1/sec', cost: 50, effect: () => perSecond += 1, owned: 0, maxVisible: 1000},
    {name: 'Double Points', cost: 100, effect: () => multipliers *= 2, owned: 0, maxVisible: 10000},
    {name: 'Click Power +2', cost: 500, effect: () => multipliers *= 1.2, owned: 0, maxVisible: 50000},
    {name: 'Auto Click +5/sec', cost: 1000, effect: () => perSecond += 5, owned: 0, maxVisible: 100000},
    // Add more
    {name: 'Triple Points', cost: 5000, effect: () => multipliers *= 3, owned: 0, maxVisible: 500000},
    {name: 'Click Power +5', cost: 10000, effect: () => multipliers *= 1.5, owned: 0, maxVisible: 1000000},
    {name: 'Auto Click +10/sec', cost: 25000, effect: () => perSecond += 10, owned: 0, maxVisible: 2500000},
];

// Store items
const storeItems = [
    {name: 'Cursor', cost: 15, effect: () => {clickers++; perSecond += 0.1;}, owned: 0, image: 'cursor.png'},
    {name: 'Paska Pasi', cost: 100, effect: () => {paskaPasi++; perSecond += 1;}, owned: 0, image: 'PASKA-PASI.PNG'},
    {name: 'Pirjo', cost: 500, effect: () => {pirjo++; perSecond += 10;}, owned: 0, image: 'PIRJO.PNG'},
    {name: 'Gang Jorma', cost: 10000, effect: () => {gangJorma = 1; multipliers *= 4; /* multiply store items */ clickers *= 4; paskaPasi *= 4; pirjo *= 4; perSecond *= 4; }, owned: 0, oneTime: true},
];

function saveGame() {
    localStorage.setItem('jormaClicker', JSON.stringify({
        points, perSecond, clickers, paskaPasi, pirjo, gangJorma, multipliers, upgrades: upgrades.map(u => ({...u, owned: u.owned})), storeItems: storeItems.map(s => ({...s, owned: s.owned})),
        lastTime
    }));
}

function loadGame() {
    const saved = localStorage.getItem('jormaClicker');
    if (saved) {
        const data = JSON.parse(saved);
        points = data.points || 0;
        perSecond = data.perSecond || 0;
        clickers = data.clickers || 0;
        paskaPasi = data.paskaPasi || 0;
        pirjo = data.pirjo || 0;
        gangJorma = data.gangJorma || 0;
        multipliers = data.multipliers || 1;
        data.upgrades.forEach((u, i) => { upgrades[i] = {...upgrades[i], owned: u.owned}; });
        data.storeItems.forEach((s, i) => { storeItems[i] = {...storeItems[i], owned: s.owned}; });
        lastTime = data.lastTime || Date.now();

        // Offline progress
        const now = Date.now();
        const delta = (now - lastTime) / 1000;
        points += perSecond * delta * multipliers;
    }
    updateDisplay();
    renderStore();
    renderUpgrades();
    renderClickers();
    renderPaskaPasi();
    renderPirjo();
    if (gangJorma) renderGangJorma();
}

function updateDisplay() {
    document.getElementById('points').textContent = Math.floor(points);
    document.getElementById('perSecond').textContent = Math.floor(perSecond * multipliers);
}

function renderStore() {
    const list = document.getElementById('store-list');
    list.innerHTML = '';
    storeItems.forEach(item => {
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = `${item.name} (${item.owned})`;
        const costSpan = document.createElement('span');
        costSpan.className = `cost ${points >= item.cost ? 'affordable' : 'not-affordable'}`;
        costSpan.textContent = `Cost: ${item.cost}`;
        li.appendChild(name);
        li.appendChild(costSpan);
        li.addEventListener('click', () => buyItem(item));
        list.appendChild(li);
    });
}

function buyItem(item) {
    if (points >= item.cost && (!item.oneTime || item.owned === 0)) {
        points -= item.cost;
        item.effect();
        item.owned++;
        if (item.oneTime) item.owned = 1; // for display
        item.cost = Math.floor(item.cost * 1.15); // increase cost
        updateDisplay();
        renderStore();
        renderUpgrades();
        renderClickers();
        renderPaskaPasi();
        renderPirjo();
        if (item.name === 'Gang Jorma') renderGangJorma();
        saveGame();
    }
}

function renderUpgrades() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = '';
    upgrades.filter(u => points > u.cost / 1000 || u.owned > 0).forEach(u => { // hide until close
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = `${u.name} (Owned: ${u.owned}) - Next cost: ${u.cost}`;
        const costSpan = document.createElement('span');
        costSpan.className = `cost ${points >= u.cost ? 'affordable' : 'not-affordable'}`;
        li.appendChild(name);
        li.appendChild(costSpan);
        li.addEventListener('click', () => buyUpgrade(u));
        list.appendChild(li);
    });
}

function buyUpgrade(u) {
    if (points >= u.cost) {
        points -= u.cost;
        u.effect();
        u.owned++;
        u.cost = Math.floor(u.cost * 1.15);
        updateDisplay();
        renderUpgrades();
        renderStore();
        saveGame();
    }
}

function renderClickers() {
    const container = document.getElementById('clickers');
    container.innerHTML = '';
    for (let i = 0; i < clickers; i++) {
        const img = document.createElement('img');
        img.src = 'cursor.png';
        img.className = 'clicker';
        const angle = (i / clickers) * Math.PI * 2;
        const radius = 100 + (Math.floor(i / 10) * 50); // circles every 10
        img.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
        img.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
        container.appendChild(img);
        // Animate click periodically
        setTimeout(() => img.classList.add('clicking'), Math.random() * 1000);
        setTimeout(() => img.classList.remove('clicking'), Math.random() * 1000 + 500);
    }
}

function renderPaskaPasi() {
    const container = document.getElementById('paska-pasis');
    container.innerHTML = '';
    for (let i = 0; i < paskaPasi; i++) {
        const img = document.createElement('img');
        img.src = 'PASKA-PASI.PNG';
        img.className = 'paska-pasi';
        img.style.left = `${(i % 5) * 25}px`;
        img.style.bottom = `${-(Math.floor(i / 5)) * 25}px`;
        container.appendChild(img);
    }
}

function renderPirjo() {
    const pirjoImg = document.getElementById('pirjo');
    if (pirjo > 0) {
        pirjoImg.style.display = 'block';
        // Animate hitting
        setInterval(() => {
            pirjoImg.classList.add('hitting');
            setTimeout(() => pirjoImg.classList.remove('hitting'), 500);
        }, 2000);
    } else {
        pirjoImg.style.display = 'none';
    }
}

function renderGangJorma() {
    const jorma = document.getElementById('jorma');
    const text = document.getElementById('badass-text');
    if (gangJorma > 0) {
        jorma.style.width = '300px';
        jorma.style.height = '300px';
        text.style.display = 'block';
    } else {
        jorma.style.width = '200px';
        jorma.style.height = '200px';
        text.style.display = 'none';
    }
}

document.getElementById('jorma').addEventListener('click', (e) => {
    points += 1 * multipliers;
    updateDisplay();
    renderStore();
    renderUpgrades();
    saveGame();
    // Click animation
    e.target.style.transform = 'scale(0.95)';
    setTimeout(() => e.target.style.transform = 'scale(1)', 100);
});

function gameLoop() {
    const now = Date.now();
    const delta = (now - lastTime) / 1000;
    points += perSecond * delta * multipliers;
    lastTime = now;
    updateDisplay();
    renderStore();
    renderUpgrades();
    saveGame();
    requestAnimationFrame(gameLoop);
}

loadGame();
gameLoop();

// Auto save every 30s
setInterval(saveGame, 30000);