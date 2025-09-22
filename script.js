// Game state
let score = 0;
let clickValue = 1;
let cps = 0;
let gangJormaMultiplier = 1;
let items = {
    clicker: { count: 0, baseCost: 100, cps: 1 },
    paskapasi: { count: 0, baseCost: 250, cps: 5 },
    pirjo: { count: 0, baseCost: 500, cps: 50 },
    gangjorma: { count: 0, baseCost: 10000, cps: 0, max: 1 }
};
let upgrades = [];
let autoSaveInterval;
let autoProdInterval;
let lastUpdate = Date.now();

// Available upgrades
const availableUpgrades = [
    { name: 'Double Clicks', cost: 1000, condition: () => clickValue === 1, effect: () => { clickValue = 2; } },
    { name: 'Triple Clicks', cost: 5000, condition: () => clickValue === 2, effect: () => { clickValue = 3; } },
    { name: 'Clicker Boost', cost: 2000, condition: () => items.clicker.count >= 5, effect: () => { items.clicker.cps *= 2; updateCPS(); } },
    { name: 'Paska Efficiency', cost: 10000, condition: () => items.paskapasi.count >= 3, effect: () => { items.paskapasi.cps *= 1.5; updateCPS(); } },
    { name: 'Pirjo Mastery', cost: 50000, condition: () => items.pirjo.count >= 1, effect: () => { items.pirjo.cps *= 2; updateCPS(); } },
    { name: 'Mega Clicks', cost: 25000, condition: () => clickValue === 3, effect: () => { clickValue = 5; } },
    { name: 'Auto Clicker', cost: 100000, condition: () => items.clicker.count >= 10, effect: () => { items.clicker.cps *= 3; updateCPS(); } },
    { name: 'Paska Power', cost: 250000, condition: () => items.paskapasi.count >= 5, effect: () => { items.paskapasi.cps *= 2; updateCPS(); } },
    { name: 'Pirjo Frenzy', cost: 500000, condition: () => items.pirjo.count >= 3, effect: () => { items.pirjo.cps *= 2.5; updateCPS(); } }
];

// Initialize game
function init() {
    try {
        loadGame();
        updateDisplay();
        bindClickEvent();
        updateVisuals();
        startAutoProduction();
        startAutoSave();
        window.addEventListener('focus', handleOfflineProgress);
    } catch (e) {
        showError('Failed to initialize game: ' + e.message);
        console.error('Init error:', e);
    }
}

// Handle offline progress
function handleOfflineProgress() {
    try {
        const now = Date.now();
        const secondsPassed = (now - lastUpdate) / 1000;
        const earned = cps * secondsPassed;
        score += earned;
        lastUpdate = now;
        updateDisplay();
        saveGame();
        showError(`Earned ${Math.floor(earned)} Jormas while offline!`);
    } catch (e) {
        showError('Failed to process offline progress: ' + e.message);
        console.error('Offline progress error:', e);
    }
}

// Bind click event
function bindClickEvent() {
    const jormaFace = document.getElementById('jorma-face');
    jormaFace.addEventListener('click', () => {
        try {
            clickJorma();
        } catch (e) {
            showError('Click failed: ' + e.message);
            console.error('Click error:', e);
        }
    });
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
            gangJormaMultiplier = items.gangjorma.count > 0 ? 4 : 1;
            upgrades = data.upgrades || [];
            applyUpgrades();
            lastUpdate = data.lastUpdate || Date.now();
            handleOfflineProgress();
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
            upgrades,
            lastUpdate: Date.now()
        };
        localStorage.setItem('jormaClickerSave', JSON.stringify(data));
    } catch (e) {
        showError('Failed to save game: ' + e.message);
        console.error('Save error:', e);
    }
}

// Auto-save
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
        showError('Failed to apply upgrades: ' + e.message);
        console.error('Upgrade apply error:', e);
    }
}

// Update display
function updateDisplay() {
    try {
        document.getElementById('score').innerText = Math.floor(score);
        document.getElementById('clickValue').innerText = clickValue;
        updateCPS();
        updateStore();
        updateVisuals();
        renderUpgrades();
    } catch (e) {
        showError('Failed to update display: ' + e.message);
        console.error('Display error:', e);
    }
}

// Update CPS
function updateCPS() {
    try {
        cps = Object.values(items).reduce((total, item) => {
            return total + (item.cps * item.count * (item.max ? 1 : gangJormaMultiplier));
        }, 0);
        document.getElementById('cps').innerText = cps.toFixed(1);
    } catch (e) {
        showError('Failed to update CPS: ' + e.message);
        console.error('CPS error:', e);
    }
}

// Update store
function updateStore() {
    try {
        Object.keys(items).forEach(type => {
            const item = items[type];
            const cost = item.max && item.count >= item.max ? 'MAX' : Math.floor(item.baseCost * Math.pow(1.15, item.count));
            item.cost = cost;
            document.getElementById(`count-${type}`).innerText = item.count;
            document.getElementById(`cost-${type}`).innerText = cost;
            const button = document.getElementById(`buy-${type}`);
            button.disabled = score < cost || (item.max && item.count >= item.max);
        });
    } catch (e) {
        showError('Failed to update store: ' + e.message);
        console.error('Store error:', e);
    }
}

// Render upgrades
function renderUpgrades() {
    try {
        const container = document.getElementById('upgrades');
        container.innerHTML = '';
        availableUpgrades.forEach(upgrade => {
            const isPurchased = upgrades.includes(upgrade.name);
            const isAvailable = upgrade.condition() && !isPurchased;
            const isVisible = isAvailable && (upgrade.cost <= 100000 || score >= upgrade.cost * 0.9);
            if (isVisible || isPurchased) {
                const div = document.createElement('div');
                div.className = 'upgrade';
                const costClass = isPurchased ? '' : score >= upgrade.cost ? 'green' : 'red';
                div.innerHTML = `
                    <span><strong>${upgrade.name}</strong> - Cost: <span class="upgrade-cost ${costClass}">${upgrade.cost}</span> Jormas</span>
                    ${isPurchased ? '<span style="color: green;"> (Purchased)</span>' : ''}
                    ${isAvailable && !isPurchased ? `<button onclick="buyUpgrade('${upgrade.name}')">Buy</button>` : ''}
                `;
                container.appendChild(div);
            }
        });
    } catch (e) {
        showError('Failed to render upgrades: ' + e.message);
        console.error('Upgrades render error:', e);
    }
}

// Buy upgrade
function buyUpgrade(name) {
    try {
        const upgrade = availableUpgrades.find(u => u.name === name);
        if (upgrade && score >= upgrade.cost && upgrade.condition() && !upgrades.includes(upgrade.name)) {
            score -= upgrade.cost;
            upgrades.push(name);
            upgrade.effect();
            saveGame();
            updateDisplay();
        } else {
            showError('Cannot buy upgrade: insufficient Jormas or conditions not met.');
        }
    } catch (e) {
        showError('Failed to buy upgrade: ' + e.message);
        console.error('Upgrade buy error:', e);
    }
}

// Click Jorma
function clickJorma() {
    try {
        score += clickValue;
        document.getElementById('score').innerText = Math.floor(score);
        saveGame();
        updateDisplay();
        console.log('Clicked Jorma! Score:', score);
    } catch (e) {
        showError('Click failed: ' + e.message);
        console.error('Click error:', e);
    }
}

// Buy item
function buyItem(type) {
    try {
        const item = items[type];
        const cost = item.cost;
        if (score >= cost && (!item.max || item.count < item.max)) {
            score -= cost;
            item.count++;
            if (type === 'gangjorma') gangJormaMultiplier = 4;
            updateDisplay();
            saveGame();
            startAutoProduction();
        } else {
            showError('Not enough Jormas or max purchased for ' + type + '!');
        }
    } catch (e) {
        showError('Failed to buy item: ' + e.message);
        console.error('Buy item error:', e);
    }
}

// Update visuals
function updateVisuals() {
    try {
        // Gang Jorma
        const jormaFace = document.getElementById('jorma-face');
        const badassText = document.getElementById('badass-text');
        if (items.gangjorma.count > 0) {
            jormaFace.classList.add('gang-jorma');
            badassText.style.display = 'block';
        } else {
            jormaFace.classList.remove('gang-jorma');
            badassText.style.display = 'none';
        }

        // Clicker cursors
        const cursorCircle = document.getElementById('cursor-circle');
        const cursorCircleOuter = document.getElementById('cursor-circle-outer');
        cursorCircle.innerHTML = '';
        cursorCircleOuter.innerHTML = '';
        if (items.clicker.count > 0) {
            const count = Math.min(items.clicker.count, 10); // Max 10 cursors per circle
            for (let i = 0; i < count; i++) {
                const cursor = document.createElement('img');
                cursor.src = 'cursor.png';
                cursor.className = 'cursor';
                cursor.style.transform = `rotate(${i * 360 / count}deg) translate(100px) rotate(-${i * 360 / count}deg)`;
                cursorCircle.appendChild(cursor);

                if (items.clicker.count > 10) {
                    const cursorOuter = document.createElement('img');
                    cursorOuter.src = 'cursor.png';
                    cursorOuter.className = 'cursor';
                    cursorOuter.style.transform = `rotate(${i * 360 / count}deg) translate(120px) rotate(-${i * 360 / count}deg)`;
                    cursorCircleOuter.appendChild(cursorOuter);
                }
            }
        }

        // Paska Pasi
        const paskaContainer = document.getElementById('paska-pasi-container');
        paskaContainer.innerHTML = '';
        for (let i = 0; i < items.paskapasi.count; i++) {
            const img = document.createElement('img');
            img.src = 'Paska-Pasi.png';
            img.className = 'paska-pasi';
            paskaContainer.appendChild(img);
        }

        // Pirjo
        const pirjoContainer = document.getElementById('pirjo-container');
        pirjoContainer.innerHTML = '';
        if (items.pirjo.count > 0) {
            const img = document.createElement('img');
            img.src = 'Pirjo.png';
            img.className = 'pirjo';
            pirjoContainer.appendChild(img);
        }
    } catch (e) {
        showError('Failed to update visuals: ' + e.message);
        console.error('Visuals error:', e);
    }
}

// Start auto-production
function startAutoProduction() {
    try {
        if (autoProdInterval) clearInterval(autoProdInterval);
        autoProdInterval = setInterval(() => {
            let produced = 0;
            Object.values(items).forEach(item => {
                produced += item.cps * item.count * (item.max ? 1 : gangJormaMultiplier) / 10;
            });
            score += produced;
            lastUpdate = Date.now();
            document.getElementById('score').innerText = Math.floor(score);
            updateDisplay();
        }, 100);
    } catch (e) {
        showError('Failed to start auto-production: ' + e.message);
        console.error('Auto-production error:', e);
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
    try {
        if (confirm('Are you sure? This will delete all progress!')) {
            localStorage.removeItem('jormaClickerSave');
            location.reload();
        }
    } catch (e) {
        showError('Failed to reset game: ' + e.message);
        console.error('Reset error:', e);
    }
}

// Start game
window.onload = init;