/**
 * Level-up Celebration Script
 * Shows confetti and a celebration modal when a child levels up
 */

document.addEventListener('DOMContentLoaded', function() {
    if (window.levelUpData) {
        showLevelUpCelebration(window.levelUpData);
    }
});

function showLevelUpCelebration(level) {
    // Create confetti
    createConfetti();

    // Create celebration modal
    const modal = document.createElement('div');
    modal.className = 'level-up-celebration';
    modal.id = 'levelUpModal';

    const levelName = window.langStrings?.locale === 'ka' && level.name_ka
        ? level.name_ka
        : level.name;

    const stars = generateStars(level.stars || 1);
    const bonusHtml = level.bonus_points
        ? `<p class="bonus-text">+${level.bonus_points} ${window.langStrings?.bonus_points || 'bonus points'}!</p>`
        : '';

    modal.innerHTML = `
        <div class="level-up-card">
            <div class="level-icon-large">${level.icon || '🌱'}</div>
            <h2>${window.langStrings?.level_up || 'Level Up!'}</h2>
            <p class="text-muted mb-3">${window.langStrings?.reached_level || 'You reached'}</p>
            <div class="level-badge ${level.badge_class || 'level-beginner'} level-lg mx-auto mb-3" style="display: inline-flex;">
                <span class="level-name">${escapeHtml(levelName)}</span>
                <span class="level-stars">${stars}</span>
            </div>
            ${bonusHtml}
            <button class="btn btn-primary btn-lg mt-3" onclick="closeLevelUp()" style="min-width: 140px;">
                ${window.langStrings?.awesome || 'Awesome!'}
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Play celebration sound if available
    playLevelUpSound();
}

function closeLevelUp() {
    const modal = document.getElementById('levelUpModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => modal.remove(), 300);
    }

    // Remove confetti
    const confettiContainer = document.querySelector('.confetti-container');
    if (confettiContainer) {
        confettiContainer.remove();
    }
}

function createConfetti() {
    const colors = [
        '#fbbf24', // Gold
        '#60a5fa', // Blue
        '#a78bfa', // Purple
        '#34d399', // Green
        '#f472b6', // Pink
        '#fb923c', // Orange
    ];

    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    // Create 100 confetti pieces
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        const color = colors[Math.floor(Math.random() * colors.length)];
        const isCircle = Math.random() > 0.5;
        const size = 8 + Math.random() * 8;
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 2.5 + Math.random() * 1.5;

        confetti.style.cssText = `
            background: ${color};
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            border-radius: ${isCircle ? '50%' : '2px'};
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
        `;

        container.appendChild(confetti);
    }

    // Remove confetti after animation completes
    setTimeout(() => {
        if (container.parentNode) {
            container.remove();
        }
    }, 5000);
}

function generateStars(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += '<i class="bi bi-star-fill star"></i>';
    }
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function playLevelUpSound() {
    // Optional: Add a celebration sound
    // You can add an audio file and play it here
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();

            // Create a simple celebratory chime
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.frequency.value = freq;
                osc.type = 'sine';

                gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
                gain.gain.exponentialDecayTo = 0.01;
                gain.gain.setTargetAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2, 0.1);

                osc.start(ctx.currentTime + i * 0.1);
                osc.stop(ctx.currentTime + i * 0.1 + 0.4);
            });
        }
    } catch (e) {
        // Audio not supported or blocked, silently ignore
    }
}

// Allow closing modal by clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('level-up-celebration')) {
        closeLevelUp();
    }
});

// Allow closing modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLevelUp();
    }
});
