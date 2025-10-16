// Dados do jogo com multiplicadores aumentados
const symbols = ['🍀', '🍒', '💎', '🪙', '🐯', '🐉'];
const payouts = {
    '🐉🐉🐉': 1000000000000000, // 1 QUATRI LHÃO DE VEZES!
    '🐉🐉': 1000000,           // 1 MILHÃO DE VEZES!
    '🐯🐯🐯': 100,             // 3 tigres
    '🪙🪙🪙': 50,              // 3 moedas
    '💎💎💎': 30,              // 3 diamantes
    '🍒🍒🍒': 20,              // 3 cerejas
    '🍀🍀🍀': 10,              // 3 trevos
    '🐯🐯': 5                  // 2 tigres (em qualquer posição)
};

let balance = 1000.00;
let betAmount = 50.00;
let isSpinning = false;
let autoSpinCount = 0;
let gameHistory = [];
let pendingDeposit = 0;
let spinResults = [];
let hasGamePass = false;
let skipAnimation = false;
let hasGamePassLuck = false;
let luckMultiplier = 1;
let spinTimeout = null;

// Elementos DOM
const balanceElement = document.getElementById('balance');
const betAmountElement = document.getElementById('bet-amount');
const spinBtn = document.getElementById('spin-btn');
const decreaseBetBtn = document.getElementById('decrease-bet');
const increaseBetBtn = document.getElementById('increase-bet');
const autoSpinBtn = document.getElementById('auto-spin-btn');
const winMessageElement = document.getElementById('win-message');
const historyListElement = document.getElementById('history-list');
const reelContents = [
    document.getElementById('reel-content1'),
    document.getElementById('reel-content2'),
    document.getElementById('reel-content3')
];

// Elementos de depósito
const depositInput = document.getElementById('deposit-input');
const depositBtn = document.getElementById('deposit-btn');
const quickDepositBtns = document.querySelectorAll('.quick-deposit-btn');
const depositModal = document.getElementById('deposit-modal');
const cancelDepositBtn = document.getElementById('cancel-deposit');
const confirmDepositBtn = document.getElementById('confirm-deposit');
const depositDetailsElement = document.getElementById('deposit-details');

// Elementos de aposta
const betInput = document.getElementById('bet-input');
const setBetBtn = document.getElementById('set-bet-btn');
const quickBetBtns = document.querySelectorAll('.quick-bet-btn');

// Elementos do Game Pass Premium
const gamePassBtn = document.getElementById('game-pass-btn');
const gamePassStatus = document.getElementById('game-pass-status');
const skipAnimationBtn = document.getElementById('skip-animation-btn');
const gamePassModal = document.getElementById('game-pass-modal');
const cancelGamePassBtn = document.getElementById('cancel-game-pass');
const confirmGamePassBtn = document.getElementById('confirm-game-pass');

// Elementos do Game Pass da Sorte
const gamePassLuckBtn = document.getElementById('game-pass-luck-btn');
const gamePassLuckStatus = document.getElementById('game-pass-luck-status');
const gamePassLuckModal = document.getElementById('game-pass-luck-modal');
const cancelGamePassLuckBtn = document.getElementById('cancel-game-pass-luck');
const confirmGamePassLuckBtn = document.getElementById('confirm-game-pass-luck');

// Inicialização do jogo
document.addEventListener('DOMContentLoaded', function() {
    initializeReels();
    updateDisplay();
    updateGamePassDisplay();
    updateGamePassLuckDisplay();
    
    // Event listeners
    spinBtn.addEventListener('click', spin);
    decreaseBetBtn.addEventListener('click', decreaseBet);
    increaseBetBtn.addEventListener('click', increaseBet);
    autoSpinBtn.addEventListener('click', toggleAutoSpin);
    
    // Event listeners de depósito
    depositBtn.addEventListener('click', openDepositModal);
    quickDepositBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = parseFloat(this.getAttribute('data-amount'));
            depositInput.value = amount;
            openDepositModal();
        });
    });
    cancelDepositBtn.addEventListener('click', closeDepositModal);
    confirmDepositBtn.addEventListener('click', confirmDeposit);
    
    // Event listeners de aposta
    setBetBtn.addEventListener('click', setCustomBet);
    quickBetBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = parseFloat(this.getAttribute('data-amount'));
            setBetAmount(amount);
        });
    });
    
    // Event listeners do Game Pass Premium
    gamePassBtn.addEventListener('click', openGamePassModal);
    skipAnimationBtn.addEventListener('click', toggleSkipAnimation);
    cancelGamePassBtn.addEventListener('click', closeGamePassModal);
    confirmGamePassBtn.addEventListener('click', confirmGamePass);
    
    // Event listeners do Game Pass da Sorte
    gamePassLuckBtn.addEventListener('click', openGamePassLuckModal);
    cancelGamePassLuckBtn.addEventListener('click', closeGamePassLuckModal);
    confirmGamePassLuckBtn.addEventListener('click', confirmGamePassLuck);
});

// Inicializar os rolos com símbolos
function initializeReels() {
    for (let i = 0; i < reelContents.length; i++) {
        let content = '';
        for (let j = 0; j < 15; j++) {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            const symbolClass = randomSymbol === '🐉' ? 'dragon-symbol' : '';
            content += `<div class="symbol ${symbolClass}">${randomSymbol}</div>`;
        }
        reelContents[i].innerHTML = content;
    }
}

// Atualizar a exibição
function updateDisplay() {
    balanceElement.textContent = balance.toFixed(2);
    betAmountElement.textContent = betAmount.toFixed(2);
    
    spinBtn.disabled = isSpinning || balance < betAmount;
    gamePassBtn.disabled = hasGamePass || balance < 100000;
    gamePassLuckBtn.disabled = hasGamePassLuck || balance < 500000;
}

// Atualizar exibição do Game Pass Premium
function updateGamePassDisplay() {
    if (hasGamePass) {
        gamePassStatus.textContent = "ATIVO";
        gamePassStatus.className = "game-pass-active";
        gamePassBtn.textContent = "✅ Game Pass Ativo";
        skipAnimationBtn.disabled = false;
    } else {
        gamePassStatus.textContent = "INATIVO";
        gamePassStatus.className = "game-pass-inactive";
        gamePassBtn.textContent = "Comprar por R$ 100.000";
        skipAnimationBtn.disabled = true;
    }
}

// Atualizar exibição do Game Pass da Sorte
function updateGamePassLuckDisplay() {
    if (hasGamePassLuck) {
        gamePassLuckStatus.textContent = "ATIVO";
        gamePassLuckStatus.className = "game-pass-luck-active";
        gamePassLuckBtn.textContent = "✅ Sorte Ativa";
        gamePassLuckBtn.disabled = true;
        document.querySelector('.game-pass-luck-section').classList.add('game-pass-luck-active-effect');
        showLuckIndicator();
    } else {
        gamePassLuckStatus.textContent = "INATIVO";
        gamePassLuckStatus.className = "game-pass-luck-inactive";
        gamePassLuckBtn.textContent = "Comprar por R$ 500.000";
        gamePassLuckBtn.disabled = balance < 500000;
        document.querySelector('.game-pass-luck-section').classList.remove('game-pass-luck-active-effect');
        hideLuckIndicator();
    }
}

// Definir aposta personalizada
function setCustomBet() {
    const amount = parseFloat(betInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        winMessageElement.textContent = 'Digite um valor válido para a aposta!';
        return;
    }
    
    if (amount > balance) {
        winMessageElement.textContent = 'Saldo insuficiente para esta aposta!';
        return;
    }
    
    setBetAmount(amount);
    betInput.value = '';
}

// Definir valor da aposta
function setBetAmount(amount) {
    betAmount = amount;
    updateDisplay();
    winMessageElement.textContent = `Aposta definida para R$ ${amount.toFixed(2)}!`;
}

// Girar os rolos
function spin() {
    if (isSpinning || balance < betAmount) return;
    
    balance -= betAmount;
    updateDisplay();
    
    isSpinning = true;
    winMessageElement.textContent = '';
    spinResults = [];
    
    // Gerar resultados com multiplicador de sorte
    for (let i = 0; i < 3; i++) {
        let randomValue = Math.random();
        
        if (hasGamePassLuck) {
            if (randomValue < (0.00001 * luckMultiplier)) {
                spinResults.push('🐉');
            } else if (randomValue < (0.01 * luckMultiplier)) {
                spinResults.push('🐯');
            } else if (randomValue < (0.05 * luckMultiplier)) {
                spinResults.push('🪙');
            } else if (randomValue < (0.1 * luckMultiplier)) {
                spinResults.push('💎');
            } else {
                const commonSymbols = ['🍀', '🍒'];
                spinResults.push(commonSymbols[Math.floor(Math.random() * commonSymbols.length)]);
            }
        } else {
            if (randomValue < 0.00001) {
                spinResults.push('🐉');
            } else if (randomValue < 0.01) {
                spinResults.push('🐯');
            } else if (randomValue < 0.05) {
                spinResults.push('🪙');
            } else if (randomValue < 0.1) {
                spinResults.push('💎');
            } else {
                const commonSymbols = ['🍀', '🍒'];
                spinResults.push(commonSymbols[Math.floor(Math.random() * commonSymbols.length)]);
            }
        }
    }
    
    if (skipAnimation && hasGamePass) {
        showInstantResult();
    } else {
        spinReel(0, spinResults[0]);
        setTimeout(() => spinReel(1, spinResults[1]), 300);
        setTimeout(() => spinReel(2, spinResults[2]), 600);
        spinTimeout = setTimeout(checkResult, 3500);
    }
}

// Mostrar resultado instantâneo
function showInstantResult() {
    for (let i = 0; i < 3; i++) {
        const reelContent = reelContents[i];
        const symbolsArray = Array.from(reelContent.children);
        let targetPosition = -1;
        
        for (let j = 0; j < symbolsArray.length; j++) {
            if (symbolsArray[j].textContent === spinResults[i]) {
                targetPosition = j;
                break;
            }
        }
        
        if (targetPosition !== -1) {
            reelContent.style.top = (-targetPosition * 150) + 'px';
        }
    }
    
    setTimeout(checkResult, 100);
}

// Girar um rolo específico
function spinReel(reelIndex, targetSymbol) {
    const reelContent = reelContents[reelIndex];
    const symbolHeight = 150;
    
    const symbolsArray = Array.from(reelContent.children);
    let targetPosition = -1;
    
    const startIndex = Math.floor(Math.random() * 5) + 5;
    for (let i = startIndex; i < symbolsArray.length; i++) {
        if (symbolsArray[i].textContent === targetSymbol) {
            targetPosition = i;
            break;
        }
    }
    
    if (targetPosition === -1) {
        for (let i = 0; i < symbolsArray.length; i++) {
            if (symbolsArray[i].textContent === targetSymbol) {
                targetPosition = i;
                break;
            }
        }
    }
    
    const finalPosition = -targetPosition * symbolHeight;
    const extraSpins = 5;
    const totalSpins = (symbolsArray.length + extraSpins) * symbolHeight;
    
    reelContent.style.top = '0px';
    
    let currentPosition = 0;
    const spinInterval = setInterval(() => {
        currentPosition -= 40;
        reelContent.style.top = currentPosition + 'px';
        
        if (currentPosition <= -totalSpins) {
            currentPosition = finalPosition;
            reelContent.style.top = currentPosition + 'px';
            clearInterval(spinInterval);
        }
    }, 20);
}

// Verificar o resultado do giro
function checkResult() {
    isSpinning = false;
    
    const results = [...spinResults];
    let winMultiplier = 0;
    const resultString = results.join('');
    
    if (results[0] === results[1] && results[1] === results[2]) {
        winMultiplier = payouts[resultString] || 0;
        
        if (hasGamePassLuck && winMultiplier > 0) {
            if (winMultiplier < 1000 && Math.random() < 0.5) {
                winMultiplier *= 2;
            }
        }
    }
    
    if (winMultiplier === 0) {
        const dragonCount = results.filter(symbol => symbol === '🐉').length;
        if (dragonCount >= 2) {
            winMultiplier = payouts['🐉🐉'];
            if (hasGamePassLuck && Math.random() < 0.3) {
                winMultiplier *= 1.5;
            }
        }
    }
    
    if (winMultiplier === 0) {
        const tigerCount = results.filter(symbol => symbol === '🐯').length;
        if (tigerCount >= 2) {
            winMultiplier = payouts['🐯🐯'];
            if (hasGamePassLuck && Math.random() < 0.4) {
                winMultiplier *= 2;
            }
        }
    }
    
    const winAmount = betAmount * winMultiplier;
    
    if (winAmount > 0) {
        balance += winAmount;
        
        if (hasGamePassLuck && winMultiplier > payouts[resultString]) {
            winMessageElement.textContent = `🎰 SORTE EXTRA! R$ ${formatNumber(winAmount)}!`;
        } else {
            if (winMultiplier === 1000000000000000) {
                winMessageElement.textContent = `🎉 JACKPOT DO DRAGÃO! 🎉 R$ ${formatNumber(winAmount)}!`;
                winMessageElement.className = "win-message mega-jackpot-win";
                document.body.style.animation = "megaJackpotWin 0.3s infinite";
                setTimeout(() => { document.body.style.animation = ""; }, 3000);
            } else if (winMultiplier === 1000000) {
                winMessageElement.textContent = `🔥 2 DRAGÕES! 🔥 R$ ${formatNumber(winAmount)}!`;
                winMessageElement.className = "win-message jackpot-win";
            } else {
                winMessageElement.textContent = `Você ganhou R$ ${formatNumber(winAmount)}!`;
                winMessageElement.className = "win-message";
            }
        }
        
        document.querySelector('.slot-machine').classList.add('win-animation');
        setTimeout(() => {
            document.querySelector('.slot-machine').classList.remove('win-animation');
        }, 1500);
    } else {
        winMessageElement.textContent = 'Tente novamente!';
        winMessageElement.className = "win-message";
    }
    
    addToHistory(results, winAmount);
    updateDisplay();
    
    if (autoSpinCount > 0) {
        autoSpinCount--;
        if (autoSpinCount > 0 && balance >= betAmount) {
            setTimeout(spin, 1000);
        } else {
            autoSpinCount = 0;
            autoSpinBtn.textContent = 'Auto x10';
        }
    }
}

// Formatar números grandes
function formatNumber(num) {
    if (num >= 1000000000000000) {
        return "1 QUATRI LHÃO";
    } else if (num >= 1000000000000) {
        return (num / 1000000000000).toFixed(1) + " TRILHÕES";
    } else if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + " BILHÕES";
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + " MILHÕES";
    } else {
        return num.toFixed(2);
    }
}

// Diminuir aposta em 10%
function decreaseBet() {
    const newBet = betAmount * 0.9;
    if (newBet >= 1) {
        setBetAmount(Math.max(1, Math.floor(newBet)));
    }
}

// Aumentar aposta em 10%
function increaseBet() {
    const newBet = betAmount * 1.1;
    if (newBet <= balance) {
        setBetAmount(Math.min(balance, Math.ceil(newBet)));
    } else {
        winMessageElement.textContent = 'Saldo insuficiente para aumentar a aposta!';
    }
}

// Alternar auto-spin
function toggleAutoSpin() {
    if (autoSpinCount > 0) {
        autoSpinCount = 0;
        autoSpinBtn.textContent = 'Auto x10';
    } else if (balance >= betAmount * 10) {
        autoSpinCount = 10;
        autoSpinBtn.textContent = 'Parar Auto';
        
        if (!isSpinning) {
            spin();
        }
    } else {
        winMessageElement.textContent = 'Saldo insuficiente para 10 giros!';
    }
}

// Adicionar ao histórico
function addToHistory(results, winAmount) {
    const historyItem = document.createElement('div');
    
    if (winAmount === betAmount * 1000000000000000) {
        historyItem.className = "history-item mega-jackpot-history";
    } else if (winAmount === betAmount * 1000000) {
        historyItem.className = "history-item jackpot-history";
    } else {
        historyItem.className = `history-item ${winAmount > 0 ? 'win' : 'loss'}`;
    }
    
    const resultSymbols = results.map(symbol => `<span class="symbol-small ${symbol === '🐉' ? 'dragon-small' : ''}">${symbol}</span>`).join(' ');
    
    if (winAmount === betAmount * 1000000000000000) {
        historyItem.innerHTML = `${resultSymbols} - 🎉 JACKPOT! R$ ${formatNumber(winAmount)}`;
    } else if (winAmount === betAmount * 1000000) {
        historyItem.innerHTML = `${resultSymbols} - 🔥 2 DRAGÕES! R$ ${formatNumber(winAmount)}`;
    } else {
        historyItem.innerHTML = `${resultSymbols} - ${winAmount > 0 ? 'Ganhou R$ ' + formatNumber(winAmount) : 'Perdeu R$ ' + betAmount.toFixed(2)}`;
    }
    
    historyListElement.insertBefore(historyItem, historyListElement.firstChild);
    
    if (historyListElement.children.length > 10) {
        historyListElement.removeChild(historyListElement.lastChild);
    }
    
    gameHistory.unshift({
        results: [...results],
        winAmount: winAmount,
        betAmount: betAmount,
        timestamp: new Date().toLocaleTimeString()
    });
}

// Sistema de Depósito
function openDepositModal() {
    const amount = parseFloat(depositInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        winMessageElement.textContent = 'Digite um valor válido!';
        return;
    }
    
    pendingDeposit = amount;
    depositDetailsElement.textContent = `Depositando R$ ${amount.toFixed(2)}`;
    depositModal.style.display = 'flex';
}

function closeDepositModal() {
    depositModal.style.display = 'none';
    pendingDeposit = 0;
}

function confirmDeposit() {
    balance += pendingDeposit;
    updateDisplay();
    closeDepositModal();
    
    balanceElement.classList.add('deposit-success');
    setTimeout(() => {
        balanceElement.classList.remove('deposit-success');
    }, 500);
    
    winMessageElement.textContent = `Depósito de R$ ${pendingDeposit.toFixed(2)} realizado!`;
    pendingDeposit = 0;
    depositInput.value = '';
}

// Sistema do Game Pass Premium
function openGamePassModal() {
    if (hasGamePass) {
        winMessageElement.textContent = 'Você já possui o Game Pass!';
        return;
    }
    
    if (balance < 100000) {
        winMessageElement.textContent = 'Saldo insuficiente para comprar o Game Pass!';
        return;
    }
    
    gamePassModal.style.display = 'flex';
}

function closeGamePassModal() {
    gamePassModal.style.display = 'none';
}

function confirmGamePass() {
    if (balance >= 100000) {
        balance -= 100000;
        hasGamePass = true;
        updateDisplay();
        updateGamePassDisplay();
        closeGamePassModal();
        
        winMessageElement.textContent = 'Game Pass Premium ativado com sucesso! 🎮';
    }
}

function toggleSkipAnimation() {
    if (!hasGamePass) return;
    
    skipAnimation = !skipAnimation;
    
    if (skipAnimation) {
        skipAnimationBtn.textContent = '⏩ Animação Desligada';
        skipAnimationBtn.style.background = 'linear-gradient(to bottom, #4CAF50, #2E7D32)';
        winMessageElement.textContent = 'Modo rápido ativado! ⚡';
    } else {
        skipAnimationBtn.textContent = '⏩ Pular Animação';
        skipAnimationBtn.style.background = 'linear-gradient(to bottom, #9C27B0, #7B1FA2)';
        winMessageElement.textContent = 'Modo rápido desativado!';
    }
}

// Sistema do Game Pass da Sorte
function openGamePassLuckModal() {
    if (hasGamePassLuck) {
        winMessageElement.textContent = 'Você já possui o Game Pass da Sorte!';
        return;
    }
    
    if (balance < 500000) {
        winMessageElement.textContent = 'Saldo insuficiente para comprar o Game Pass da Sorte!';
        return;
    }
    
    gamePassLuckModal.style.display = 'flex';
}

function closeGamePassLuckModal() {
    gamePassLuckModal.style.display = 'none';
}

function confirmGamePassLuck() {
    if (balance >= 500000) {
        balance -= 500000;
        hasGamePassLuck = true;
        luckMultiplier = 300;
        updateDisplay();
        updateGamePassLuckDisplay();
        closeGamePassLuckModal();
        
        winMessageElement.textContent = 'Game Pass da Sorte ativado! 🍀 Sua sorte aumentou!';
        
        const luckSection = document.querySelector('.game-pass-luck-section');
        luckSection.style.animation = 'luckGlow 0.5s 3';
    }
}

// Mostrar indicador de sorte
function showLuckIndicator() {
    let indicator = document.getElementById('luck-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'luck-indicator';
        indicator.className = 'luck-indicator';
        indicator.textContent = '🍀 SORTE ATIVA';
        document.body.appendChild(indicator);
    }
    indicator.style.display = 'block';
}

// Esconder indicador de sorte
function hideLuckIndicator() {
    const indicator = document.getElementById('luck-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}