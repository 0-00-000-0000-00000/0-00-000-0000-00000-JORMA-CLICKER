// Game state
let score = 0;
let clickValue = 1;
let cps = 0;
let items = {
    clicker: { count: 0, baseCost: 100, cps: 1 },
    paskapasi: { count: 0, baseCost: 250, cps: 5 },
    pirjo: { count: 0, baseCost: 500, cps: 50 }
};
let upgrades = [];
let autoSaveInterval;
let autoProdInterval;

// Available upgrades
const availableUpgrades = [
    { name: 'Double Clicks', cost: 1000, condition: () => clickValue === 1, effect: () => { clickValue = 2; } },
    { name: 'Triple Clicks', cost: 5000, condition: () => clickValue === 2, effect: () => { clickValue = 3; } },
    { name: 'Clicker Boost', cost: 2000, condition: () => items.clicker.count >= 5, effect: () => { items.clicker.cps *= 2; updateCPS(); } },
    { name: 'Paska Efficiency', cost: 10000, condition: () => items.paskapasi.count >= 3, effect: () => { items.paskapasi.cps *= 1.5; updateCPS(); } },
    { name: 'Pirjo Mastery', cost: 50000, condition: () => items.pirjo.count >= 1, effect: () => { items.pirjo.cps *= 2; updateCPS(); } }
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

// Bind click event to Jorma face
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

// Load game from localStorage
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
                pirjo: { ...items.pirjo, ...data.items?.pirjo }
            };
            upgrades = data.upgrades || [];
            applyUpgrades();
        }
    } catch (e) {
        showError('Failed to load game: ' + e.message);
        console.error('Load error:', e);
    }
}

// Save game to localStorage
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

// Auto-save every 10 seconds
function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(saveGame, 10000);
}

// Apply purchased upgrades
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
        renderUpgrades();
    } catch (e) {
        showError('Failed to update display: ' + e.message);
        console.error('Display error:', e);
    }
}

// Update CPS
function updateCPS() {
    try {
        cps = Object.values(items).reduce((total, item) => total + (item.cps * item.count), 0);
        document.getElementById('cps').innerText = cps.toFixed(1);
    } catch (e) {
        showError('Failed to update CPS: ' + e.message);
        console.error('CPS error:', e);
    }
}

// Update store buttons
function updateStore() {
    try {
        Object.keys(items).forEach(type => {
            const item = items[type];
            const cost = Math.floor(item.baseCost * Math.pow(1.15, item.count));
            item.cost = cost;
            document.getElementById(`count-${type}`).innerText = item.count;
            document.getElementById(`cost-${type}`).innerText = cost;
            const button = document.getElementById(`buy-${type}`);
            button.disabled = score < cost;
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
            const isAvailable = upgrade.condition() && score >= upgrade.cost && !isPurchased;
            if (isAvailable || isPurchased) {
                const div = document.createElement('div');
                div.className = 'upgrade';
                div.innerHTML = `
                    <span><strong>${upgrade.name}</strong> - Cost: ${upgrade.cost} Jormas</span>
                    ${isPurchased ? '<span style="color: green;"> (Purchased)</span>' : ''}
                    ${isAvailable ? `<button onclick="buyUpgrade('${upgrade.name}')">Buy</button>` : ''}
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
        console.log('Clicked Jorma! Score:', score); // Debug log
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
        if (score >= cost) {
            score -= cost;
            item.count++;
            updateDisplay();
            saveGame();
            startAutoProduction();
        } else {
            showError('Not enough Jormas to buy ' + type + '!');
        }
    } catch (e) {
        showError('Failed to buy item: ' + e.message);
        console.error('Buy item error:', e);
    }
}

// Start auto-production
function startAutoProduction() {
    try {
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
    } catch (e) {
        showError('Failed to start auto-production: ' + e.message);
        console.error('Auto-production error:', e);
    }
}

// Show error message
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