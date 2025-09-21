// Game state
let score = 0;
let clickValue = 1;
let cps = 0; // Total clicks per second
let items = {
    clicker: { count: 0, baseCost: 100, cps: 1 },
    paskapasi: { count: 0, baseCost: 250, cps: 5 },
    pirjo: { count: 0, baseCost: 500, cps: 50 }
};
let upgrades = []; // Array of purchased upgrade names
let autoSaveInterval;

// Available upgrades (name, cost, condition function, effect function)
const availableUpgrades = [
    { name: 'Double Clicks', cost: 1000, condition: () => clickValue === 1, effect: () => { clickValue *= 2; } },
    { name: 'Triple Clicks', cost: 5000, condition: () => clickValue === 2, effect: () => { clickValue *= 1.5; } }, // Now 3 total
    { name: 'Clicker Boost', cost: 2000, condition: () => items.clicker.count >= 5, effect: () => { items.clicker.cps *= 2; updateCPS(); } },
    { name: 'Paska Efficiency', cost: 10000, condition: () => items.paskapasi.count >= 3, effect: () => { items.paskapasi.cps *= 1.5; updateCPS(); } },
    { name: 'Pirjo Mastery', cost: 50000, condition: () => items.pirjo.count >= 1, effect: () => { items.pirjo.cps *= 2; updateCPS(); } }
];

// Load game from localStorage
function loadGame() {
    const saved = localStorage.getItem('jormaClickerSave');
    if (saved) {
        const data = JSON.parse(saved);
        score = data.score || 0;
        clickValue = data.clickValue || 1;
        Object.assign(items, data.items || items);
        upgrades = data.upgrades || [];
        applyUpgrades(); // Re-apply purchased upgrades
        updateDisplay();
        startAutoProduction();
    }
    startAutoSave();
}

// Save game to localStorage
function saveGame() {
    const data = {
        score,
        clickValue,
        items,
        upgrades
    };
    localStorage.setItem('jormaClickerSave', JSON.stringify(data));
}

// Auto-save every 10 seconds
function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(saveGame, 10000);
}

// Apply all purchased upgrades on load
function applyUpgrades() {
    upgrades.forEach(upgradeName => {
        const upgrade = availableUpgrades.find(u => u.name === upgradeName);
        if (upgrade) upgrade.effect();
    });
    updateCPS();
}

// Update display elements
function updateDisplay() {
    document.getElementById('score').innerText = Math.floor(score);
    document.getElementById('clickValue').innerText = clickValue;
    updateCPS();
    updateStore();
    renderUpgrades();
}

// Update CPS total
function updateCPS() {
    cps = Object.values(items).reduce((total, item) => total + (item.cps * item.count), 0);
    document.getElementById('cps').innerText = cps;
}

// Update store buttons (costs, counts, enable/disable)
function updateStore() {
    Object.keys(items).forEach(type => {
        const item = items[type];
        const cost = Math.floor(item.baseCost * Math.pow(1.15, item.count));
        item.cost = cost; // Update current cost
        document.getElementById(`count-${type}`).innerText = item.count;
        document.getElementById(`cost-${type}`).innerText = cost;
        const button = document.getElementById(`buy-${type}`);
        button.disabled = score < cost;
    });
}

// Render available and purchased upgrades
function renderUpgrades() {
    const container = document.getElementById('upgrades');
    container.innerHTML = '';
    availableUpgrades.forEach(upgrade => {
        const isPurchased = upgrades.includes(upgrade.name);
        const isAvailable = upgrade.condition() && score >= upgrade.cost && !isPurchased;
        if (isAvailable || isPurchased) {
            const div = document.createElement('div');
            div.className = 'upgrade';
            div.innerHTML = `
                <strong>${upgrade.name}</strong> - Cost: ${upgrade.cost} Jormas
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
    if (upgrade && score >= upgrade.cost && upgrade.condition()) {
        score -= upgrade.cost;
        upgrades.push(name);
        upgrade.effect();
        saveGame();
        updateDisplay();
    }
}

// Click handler
function clickJorma() {
    score += clickValue;
    document.getElementById('score').innerText = Math.floor(score);
    saveGame();
    checkAndRenderUpgrades();
}

// Buy item from store
function buyItem(type) {
    const item = items[type];
    const cost = item.cost;
    if (score >= cost) {
        score -= cost;
        item.count++;
        document.getElementById('score').innerText = Math.floor(score);
        updateDisplay();
        saveGame();
        startAutoProduction();
    } else {
        alert('Not enough Jormas!');
    }
}

// Start auto-production intervals (one global for efficiency)
function startAutoProduction() {
    if (window.autoProdInterval) clearInterval(window.autoProdInterval);
    window.autoProdInterval = setInterval(() => {
        let produced = 0;
        Object.values(items).forEach(item => {
            produced += item.cps * item.count / 10; // Per 100ms for smoother updates
        });
        score += produced;
        document.getElementById('score').innerText = Math.floor(score);
        saveGame();
    }, 100); // 10 updates per second
}

// Check and render new upgrades
function checkAndRenderUpgrades() {
    renderUpgrades();
}

// Reset game
function resetGame() {
    if (confirm('Are you sure? This will delete all progress!')) {
        localStorage.removeItem('jormaClickerSave');
        location.reload();
    }
}

// Initialize
loadGame();
updateDisplay();