// Game state
let score = 0;
let clickValue = 1;
let cps = 0;
let items = {
    clicker: { count: 0, baseCost: 100, cps: 1 },
    paskapasi: { count: 0, baseCost: 250, cps: 5 },
    pirjo: { count: 0, baseCost: 500, cps: 50 },
    gangjorma: { count: 0, baseCost: 10000, cps: 0 } // No CPS, one-time boost
};
let upgrades = [];
let autoSaveInterval;
let autoProdInterval;

// Available upgrades (added more)
const availableUpgrades = [
    { name: 'Double Clicks', cost: 1000, condition: () => clickValue === 1, effect: () => { clickValue = 2; } },
    { name: 'Triple Clicks', cost: 5000, condition: () => clickValue === 2, effect: () => { clickValue = 3; } },
    { name: 'Quad Clicks', cost: 10000, condition: () => clickValue === 3, effect: () => { clickValue = 4; } }, // New
    { name: 'Clicker Boost', cost: 2000, condition: () => items.clicker.count >= 5, effect: () => { items.clicker.cps *= 2; updateCPS(); } },
    { name: 'Super Clicker Boost', cost: 15000, condition: () => items.clicker.count >= 10, effect: () => { items.clicker.cps *= 3; updateCPS(); } }, // New
    { name: 'Paska Efficiency', cost: 10000, condition: () => items.paskapasi.count >= 3, effect: () => { items.paskapasi.cps *= 1.5; updateCPS(); } },
    { name: 'Paska Mega Efficiency', cost: 30000, condition: () => items.paskapasi.count >= 5, effect: () => { items.paskapasi.cps *= 2; updateCPS(); } }, // New
    { name: 'Pirjo Mastery', cost: 50000, condition: () => items.pirjo.count >= 1, effect: () => { items.pirjo.cps *= 2; updateCPS(); } },
    { name: 'Pirjo Ultimate', cost: 100000, condition: () => items.pirjo.count >= 3, effect: () => { items.pirjo.cps *= 3; updateCPS(); } }, // New
    { name: 'Global Production Doubler', cost: 200000, condition: () => score >= 100000, effect: () => { Object.values(items).forEach(item => item.cps *= 2); updateCPS(); } } // New, global
];

// Initialize game
function init() {
    try {
        loadGame();
        updateDisplay();
        bindClickEvent();
        startAutoProduction();
        startAutoSave();
    } catch (e) {
        showError('Failed to initialize game: ' + e.message);
        console.error('Init error:', e);
    }
}

// Bind click event
function bindClickEvent() {
    const jormaFace = document.getElementById('jorma-face');
    jormaFace.addEventListener('click', clickJorma);
}

// Load game
function loadGame() {
    try {
        const saved = localStorage.getItem('jormaClickerSave');
        if (saved) {
            const data = JSON.parse(saved);
            score = data.score || 0;
            clickValue = data.clickValue || 1;
            items = {
                clicker: { ...items.clicker, ...data.items?.clicker },
                paskapasi: { ...items.paskapasi, ...data.items?.paskapasi },
                pirjo: { ...items.pirjo, ...data.items?.pirjo },
                gangjorma: { ...items.gangjorma, ...data.items?.gangjorma }
            };
            upgrades = data.upgrades || [];
            applyUpgrades();
            if (items.gangjorma.count > 0) applyGangJorma();
        }
    } catch (e) {
        showError('Failed to load game: ' + e.message);
        console.error('Load error:', e);
    }
}

// Save game
function saveGame() {
    try {
        const data = {
            score,
            clickValue,
            items,
            upgrades
        };
        localStorage.setItem('jormaClickerSave', JSON.stringify(data));
    } catch (e) {
        showError('Failed to save game: ' + e.message);
        console.error('Save error:', e);
    }
}

// Start auto-save
function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(saveGame, 10000);
}

// Apply upgrades
function applyUpgrades() {
    try {
        upgrades.forEach(upgradeName => {
            const upgrade = availableUpgrades.find(u => u.name === upgradeName);
            if (upgrade) upgrade.effect();
        });
        updateCPS();
    } catch (e) {
        console.error('Upgrade apply error:', e);
    }
}

// Apply Gang Jorma effect
function applyGangJorma() {
    Object.keys(items).forEach(type => {
        if (type !== 'gangjorma') items[type].cps *= 4;
    });
    updateCPS();
    const jormaFace = document.getElementById('jorma-face');
    jormaFace.style.width = '300px';
    jormaFace.style.height = '300px';
    document.getElementById('badass-text').style.display = 'block';
    document.getElementById('buy-gangjorma').style.display = 'none'; // Hide button after buy
    const jormaContainer = document.getElementById('jorma-container');
    jormaContainer.style.width = '300px';
    jormaContainer.style.height = '300px';
}

// Update display
function updateDisplay() {
    try {
        document.getElementById('score').innerText = Math.floor(score);
        document.getElementById('clickValue').innerText = clickValue;
        updateCPS();
        updateStore();
        renderUpgrades();
        renderAssets();
    } catch (e) {
        showError('Failed to update display: ' + e.message);
        console.error('Display error:', e);
    }
}

// Update CPS
function updateCPS() {
    cps = Object.values(items).reduce((total, item) => total + (item.cps * item.count), 0);
    document.getElementById('cps').innerText = cps.toFixed(1);
}

// Update store
function updateStore() {
    Object.keys(items).forEach(type => {
        const item = items[type];
        const cost = Math.floor(item.baseCost * Math.pow(1.15, item.count));
        item.cost = cost;
        document.getElementById(`count-${type}`).innerText = item.count;
        document.getElementById(`cost-${type}`).innerText = cost;
        const button = document.getElementById(`buy-${type}`);
        if (score >= cost && (type !== 'gangjorma' || item.count === 0)) {
            button.disabled = false;
            button.style.background = '#4CAF50'; // Green when affordable
        } else {
            button.disabled = true;
            button.style.background = '#555555'; // Grey when not
        }
    });
}

// Render upgrades
function renderUpgrades() {
    const container = document.getElementById('upgrades');
    container.innerHTML = '';
    availableUpgrades.forEach(upgrade => {
        const isPurchased = upgrades.includes(upgrade.name);
        const isAvailable = upgrade.condition() && !isPurchased;
        const isClose = score >= upgrade.cost / 2; // "Close" for hiding expensive ones
        if ((isAvailable || isPurchased) && (upgrade.cost <= 10000 || isClose)) {
            const div = document.createElement('div');
            div.className = 'upgrade';
            const costColor = score >= upgrade.cost ? 'green' : 'red';
            div.innerHTML = `
                <span><strong>${upgrade.name}</strong> - Cost: <span class="cost-span" style="color: ${costColor};">${upgrade.cost}</span> Jormas</span>
                ${isPurchased ? '<span style="color: green;"> (Purchased)</span>' : ''}
                ${isAvailable ? `<button onclick="buyUpgrade('${upgrade.name}')">Buy</button>` : ''}
            `;
            container.appendChild(div);
        }
    });
}

// Buy upgrade
function buyUpgrade(name) {
    const upgrade = availableUpgrades.find(u => u.name === name);
    if (upgrade && score >= upgrade.cost && upgrade.condition() && !upgrades.includes(upgrade.name)) {
        score -= upgrade.cost;
        upgrades.push(name);
        upgrade.effect();
        saveGame();
        updateDisplay();
    } else {
        showError('Cannot buy upgrade.');
    }
}

// Click Jorma
function clickJorma() {
    score += clickValue;
    document.getElementById('score').innerText = Math.floor(score);
    saveGame();
    updateDisplay();
    console.log('Clicked Jorma! Score:', score);
}

// Buy item
function buyItem(type) {
    const item = items[type];
    const cost = item.cost;
    if (score >= cost && (type !== 'gangjorma' || item.count === 0)) {
        score -= cost;
        item.count++;
        if (type === 'gangjorma') applyGangJorma();
        updateDisplay();
        saveGame();
        startAutoProduction();
    } else {
        showError('Not enough Jormas!');
    }
}

// Start auto-production
function startAutoProduction() {
    if (autoProdInterval) clearInterval(autoProdInterval);
    autoProdInterval = setInterval(() => {
        let produced = 0;
        Object.values(items).forEach(item => {
            produced += item.cps * item.count / 10;
        });
        score += produced;
        document.getElementById('score').innerText = Math.floor(score);
        updateDisplay();
    }, 100);
}

// Render dynamic assets (images/animations)
function renderAssets() {
    const jormaFace = document.getElementById('jorma-face');
    const jormaSize = parseFloat(getComputedStyle(jormaFace).width);
    const jormaContainer = document.getElementById('jorma-container');
    jormaContainer.style.width = jormaSize + 'px';
    jormaContainer.style.height = jormaSize + 'px';
    const assetsContainer = document.getElementById('assets-container');
    assetsContainer.innerHTML = '';

    const radiusBase = jormaSize / 2 + 60; // Distance from Jorma edge
    const perCircle = 10;
    const circles = Math.ceil(items.clicker.count / perCircle);

    // Clickers: Create rotating circles
    for (let c = 0; c < circles; c++) {
        const circleDiv = document.createElement('div');
        circleDiv.className = 'circle-container';
        circleDiv.style.width = (radiusBase * 2 + c * 120) + 'px'; // Diameter for circle
        circleDiv.style.height = circleDiv.style.width;
        circleDiv.style.animationDelay = (c * 2) + 's'; // Stagger circle starts
        const radius = radiusBase + c * 60; // Radius for this circle
        const numInCircle = Math.min(perCircle, items.clicker.count - c * perCircle);
        for (let i = 0; i < numInCircle; i++) {
            const angle = (i / numInCircle) * 360;
            const x = (radius - 15) * Math.cos(angle * Math.PI / 180);
            const y = (radius - 15) * Math.sin(angle * Math.PI / 180);
            const img = document.createElement('img');
            img.src = 'MOUSE.PNG';
            img.className = 'clicker-img';
            img.style.left = (50 + x) + '%'; // Relative to circle div
            img.style.top = (50 + y) + '%';
            img.style.transform = 'translate(-50%, -50%)';
            img.style.animationDelay = (i * 0.1) + 's'; // Stagger click anim
            circleDiv.appendChild(img);
        }
        assetsContainer.appendChild(circleDiv);
    }

    // Pirjo (on left, animated hit)
    if (items.pirjo.count > 0) {
        const pirjoSize = jormaSize * 0.8;
        const img = document.createElement('img');
        img.src = 'PIRJO.JPG';
        img.className = 'pirjo-img';
        img.style.width = pirjoSize + 'px';
        img.style.height = pirjoSize + 'px';
        img.style.left = `-${jormaSize * 1.3}px`; // Further left for distance
        img.style.top = `${(jormaSize - pirjoSize) / 2}px`; // Centered vertically
        assetsContainer.appendChild(img);
    }

    // Paska Pasi (under text, in ground container)
    const groundContainer = document.getElementById('ground-container');
    groundContainer.innerHTML = '';
    for (let i = 0; i < items.paskapasi.count; i++) {
        const img = document.createElement('img');
        img.src = 'paska-pasi.png';
        img.className = 'paskapasi-img';
        groundContainer.appendChild(img);
    }
}

// Show error
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.innerText = message;
    errorDiv.style.display = 'block';
    setTimeout(() => { errorDiv.style.display = 'none'; }, 3000);
}

// Reset game
function resetGame() {
    if (confirm('Are you sure?')) {
        localStorage.removeItem('jormaClickerSave');
        location.reload();
    }
}

// Start game
window.onload = init;