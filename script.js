class JormaClicker {
    constructor() {
        this.jormas = 0;
        this.jps = 0;
        this.upgrades = [
            { name: 'Jorma Helper', cost: 10, jps: 1, owned: 0 },
            { name: 'Super Jorma', cost: 100, jps: 5, owned: 0 },
            { name: 'Jorma Factory', cost: 1000, jps: 20, owned: 0 }
        ];
        this.clickValue = 1;
        this.gameLoop = null;
        this.init();
    }

    init() {
        this.loadGame();
        this.updateDisplay();
        this.setupEventListeners();
        this.startGameLoop();
        setInterval(() => this.autoSave(), 10000); // Auto-save every 10s
    }

    setupEventListeners() {
        const clickBtn = document.getElementById('clickBtn');
        const upgradeList = document.getElementById('upgradeList');

        clickBtn.addEventListener('click', (e) => {
            this.click(e);
            this.playClickSound();
        });

        // Render upgrades
        this.upgrades.forEach((upgrade, index) => {
            const div = document.createElement('div');
            div.className = 'upgrade';
            div.innerHTML = `
                <span>${upgrade.name} (Owned: ${upgrade.owned}) - Cost: ${this.formatNumber(upgrade.cost)} - +${upgrade.jps} JPS</span>
                <button onclick="game.buyUpgrade(${index})">Buy</button>
            `;
            upgradeList.appendChild(div);
        });
    }

    click(e) {
        this.jormas += this.clickValue;
        this.createParticle(e);
        this.updateDisplay();
    }

    buyUpgrade(index) {
        const upgrade = this.upgrades[index];
        if (this.jormas >= upgrade.cost) {
            this.jormas -= upgrade.cost;
            upgrade.owned++;
            upgrade.cost = Math.floor(upgrade.cost * 1.5); // Cost increase
            this.jps += upgrade.jps;
            this.updateDisplay();
            this.rerenderUpgrades();
        }
    }

    rerenderUpgrades() {
        const upgradeList = document.getElementById('upgradeList');
        upgradeList.innerHTML = '';
        this.upgrades.forEach((upgrade, index) => {
            const div = document.createElement('div');
            div.className = 'upgrade';
            div.innerHTML = `
                <span>${upgrade.name} (Owned: ${upgrade.owned}) - Cost: ${this.formatNumber(upgrade.cost)} - +${upgrade.jps} JPS</span>
                <button onclick="game.buyUpgrade(${index})" ${this.jormas < upgrade.cost ? 'disabled' : ''}>Buy</button>
            `;
            upgradeList.appendChild(div);
        });
    }

    startGameLoop() {
        this.gameLoop = setInterval(() => {
            this.jormas += this.jps / 10; // 10 FPS for smooth JPS
            this.updateDisplay();
        }, 100);
    }

    updateDisplay() {
        document.getElementById('jormas').textContent = this.formatNumber(Math.floor(this.jormas));
        document.getElementById('jps').textContent = this.jps.toFixed(1);
        this.rerenderUpgrades(); // Update buy buttons
    }

    createParticle(e) {
        const particle = document.createElement('div');
        particle.textContent = '+1';
        particle.className = 'particles';
        particle.style.left = e.clientX + 'px';
        particle.style.top = e.clientY + 'px';
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }

    playClickSound() {
        const audio = document.getElementById('clickSound');
        audio.currentTime = 0;
        audio.play().catch(() => {}); // Ignore autoplay errors
    }

    formatNumber(num) {
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }

    saveGame() {
        const saveData = {
            jormas: this.jormas,
            jps: this.jps,
            upgrades: this.upgrades,
            clickValue: this.clickValue
        };
        localStorage.setItem('jormaClickerSave', JSON.stringify(saveData));
    }

    loadGame() {
        const saved = localStorage.getItem('jormaClickerSave');
        if (saved) {
            const data = JSON.parse(saved);
            this.jormas = data.jormas || 0;
            this.jps = data.jps || 0;
            this.upgrades = data.upgrades || this.upgrades;
            this.clickValue = data.clickValue || 1;
        }
    }

    autoSave() {
        this.saveGame();
    }
}

const game = new JormaClicker();