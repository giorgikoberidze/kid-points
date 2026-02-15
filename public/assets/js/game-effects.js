/**
 * Game Effects - Kid Points Child Portal
 * Handles celebrations, particles, sounds, and animations
 */

class GameCelebration {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
        this.celebrationStyle = 'epic'; // 'simple', 'medium', 'dramatic', 'epic'
    }

    /**
     * Set celebration style
     * @param {string} style - 'simple', 'medium', 'dramatic', 'epic'
     */
    setCelebrationStyle(style) {
        this.celebrationStyle = style || 'epic';
    }

    /**
     * Initialize audio context on first user interaction
     */
    initAudio() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not supported');
                this.soundEnabled = false;
            }
        }
        return this.audioContext;
    }

    /**
     * Play triumphant fanfare sound (ta-tada-taa!)
     * Used for level-up celebrations
     */
    async playFanfare() {
        if (!this.soundEnabled) return;

        try {
            const ctx = this.initAudio();
            if (!ctx) return;

            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const now = ctx.currentTime;

            // Fanfare pattern: ta - tada - TAA!
            const fanfareNotes = [
                // "Ta" - first announcement note
                { freq: 392.00, start: 0, duration: 0.15, volume: 0.18, type: 'triangle' },      // G4

                // "Ta-da" - quick ascending pair
                { freq: 523.25, start: 0.25, duration: 0.12, volume: 0.16, type: 'triangle' },   // C5
                { freq: 659.25, start: 0.38, duration: 0.12, volume: 0.17, type: 'triangle' },   // E5

                // "TAA!" - triumphant finale (layered for richness)
                { freq: 783.99, start: 0.55, duration: 0.5, volume: 0.2, type: 'triangle' },     // G5 (main)
                { freq: 523.25, start: 0.55, duration: 0.45, volume: 0.12, type: 'sine' },       // C5 (harmony)
                { freq: 392.00, start: 0.55, duration: 0.4, volume: 0.1, type: 'sine' },         // G4 (bass)

                // Sparkle accent on finale
                { freq: 1567.98, start: 0.6, duration: 0.3, volume: 0.08, type: 'sine' },        // G6 (shimmer)
                { freq: 1318.51, start: 0.65, duration: 0.25, volume: 0.06, type: 'sine' },      // E6 (shimmer)
            ];

            fanfareNotes.forEach(note => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.frequency.value = note.freq;
                osc.type = note.type;

                const startTime = now + note.start;

                // Attack
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(note.volume, startTime + 0.02);

                // Sustain and decay
                gain.gain.setValueAtTime(note.volume, startTime + note.duration * 0.6);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

                osc.start(startTime);
                osc.stop(startTime + note.duration + 0.05);
            });

        } catch (e) {
            // Silently fail if audio not available
        }
    }

    /**
     * Play sound effects using Web Audio API
     * @param {string} type - Sound type: 'achievement', 'levelup', 'coin', 'click'
     */
    async playSound(type) {
        if (!this.soundEnabled) return;

        try {
            const ctx = this.initAudio();
            if (!ctx) return;

            // Resume context if suspended (required by browsers)
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const sounds = {
                achievement: {
                    notes: [523.25, 659.25, 783.99, 1046.50], // C5 E5 G5 C6
                    type: 'sine',
                    duration: 0.25,
                    delay: 0.08,
                    volume: 0.15
                },
                levelup: {
                    notes: [392.00, 523.25, 659.25, 783.99], // G4 C5 E5 G5
                    type: 'triangle',
                    duration: 0.2,
                    delay: 0.12,
                    volume: 0.15
                },
                coin: {
                    notes: [1318.51, 1567.98], // E6 G6
                    type: 'sine',
                    duration: 0.15,
                    delay: 0.05,
                    volume: 0.1
                },
                click: {
                    notes: [800],
                    type: 'sine',
                    duration: 0.05,
                    delay: 0,
                    volume: 0.08
                },
                firework: {
                    notes: [200, 400, 600, 800, 1000, 1200],
                    type: 'sawtooth',
                    duration: 0.08,
                    delay: 0.02,
                    volume: 0.06
                },
                whoosh: {
                    notes: [150, 300, 450],
                    type: 'triangle',
                    duration: 0.15,
                    delay: 0.05,
                    volume: 0.08
                },
                sparkle: {
                    notes: [1500, 1800, 2000],
                    type: 'sine',
                    duration: 0.1,
                    delay: 0.03,
                    volume: 0.05
                },
                chestOpen: {
                    notes: [330, 392, 494, 587, 659, 784],
                    type: 'triangle',
                    duration: 0.2,
                    delay: 0.08,
                    volume: 0.12
                },
                multiplier: {
                    notes: [440, 554, 659, 880, 1109, 1319],
                    type: 'sine',
                    duration: 0.25,
                    delay: 0.06,
                    volume: 0.1
                }
            };

            const sound = sounds[type] || sounds.click;

            sound.notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.frequency.value = freq;
                osc.type = sound.type;

                const startTime = ctx.currentTime + i * sound.delay;
                gain.gain.setValueAtTime(sound.volume, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + sound.duration);

                osc.start(startTime);
                osc.stop(startTime + sound.duration + 0.1);
            });
        } catch (e) {
            // Silently fail if audio not available
        }
    }

    /**
     * Create particle explosion effect
     * @param {string} type - 'gold' or 'rainbow'
     * @param {number} count - Number of particles
     * @param {Element} origin - Origin element (optional, defaults to center)
     */
    createParticles(type = 'gold', count = 80, origin = null) {
        const container = document.createElement('div');
        container.className = 'particle-container';
        document.body.appendChild(container);

        const colors = type === 'rainbow'
            ? ['#fbbf24', '#60a5fa', '#a78bfa', '#34d399', '#f472b6', '#fb923c']
            : ['#fbbf24', '#f59e0b', '#d97706'];

        // Get origin point
        let originX = window.innerWidth / 2;
        let originY = window.innerHeight / 2;

        if (origin) {
            const rect = origin.getBoundingClientRect();
            originX = rect.left + rect.width / 2;
            originY = rect.top + rect.height / 2;
        }

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 6 + Math.random() * 10;
            const angle = Math.random() * 360;
            const velocity = 50 + Math.random() * 150;
            const x = Math.cos(angle * Math.PI / 180) * velocity;
            const y = Math.sin(angle * Math.PI / 180) * velocity - 50; // Bias upward

            particle.style.cssText = `
                --color: ${color};
                --size: ${size}px;
                --x: ${x}px;
                --y: ${y}px;
                --rotation: ${Math.random() * 720}deg;
                left: ${originX}px;
                top: ${originY}px;
                background: ${color};
                width: ${size}px;
                height: ${size}px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            `;

            container.appendChild(particle);
        }

        setTimeout(() => container.remove(), 3000);
    }

    /**
     * Create expanding ring effects
     * @param {number} count - Number of rings
     */
    createRings(count = 5) {
        const container = document.createElement('div');
        container.className = 'ring-container';
        document.body.appendChild(container);

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const ring = document.createElement('div');
                ring.className = 'expanding-ring';
                ring.style.borderColor = `hsl(${45 + i * 15}, 100%, 60%)`;
                container.appendChild(ring);

                setTimeout(() => ring.remove(), 1000);
            }, i * 150);
        }

        setTimeout(() => container.remove(), 2000);
    }

    /**
     * Create firework explosion at a specific point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} color - Base color (optional)
     */
    createFirework(x, y, color = null) {
        const container = document.createElement('div');
        container.className = 'firework-container';
        container.style.cssText = `position: fixed; left: ${x}px; top: ${y}px; pointer-events: none; z-index: 10001;`;
        document.body.appendChild(container);

        const colors = color ? [color] : ['#ff0044', '#ffaa00', '#00ff88', '#00aaff', '#ff00ff', '#ffff00'];
        const particleCount = 30 + Math.floor(Math.random() * 20);

        // Create explosion particles
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework-particle';

            const angle = (i / particleCount) * 360 + Math.random() * 30;
            const velocity = 80 + Math.random() * 120;
            const particleColor = colors[Math.floor(Math.random() * colors.length)];
            const size = 3 + Math.random() * 4;

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${particleColor};
                border-radius: 50%;
                box-shadow: 0 0 ${size * 2}px ${particleColor}, 0 0 ${size * 4}px ${particleColor};
                animation: fireworkExplode 1.5s ease-out forwards;
                --angle: ${angle}deg;
                --velocity: ${velocity}px;
            `;

            container.appendChild(particle);
        }

        // Create center flash
        const flash = document.createElement('div');
        flash.className = 'firework-flash';
        flash.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: fireworkFlash 0.3s ease-out forwards;
        `;
        container.appendChild(flash);

        this.playSound('firework');

        setTimeout(() => container.remove(), 2000);
    }

    /**
     * Launch fireworks from corners of screen
     * @param {number} count - Number of fireworks per corner (default 3)
     */
    launchCornerFireworks(count = 3) {
        const corners = [
            { x: 50, y: window.innerHeight - 50 },  // Bottom-left
            { x: window.innerWidth - 50, y: window.innerHeight - 50 },  // Bottom-right
        ];

        corners.forEach(corner => {
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    // Launch point
                    const launchX = corner.x + (Math.random() - 0.5) * 100;
                    // Explode at random height in upper half of screen
                    const explodeY = 100 + Math.random() * (window.innerHeight * 0.4);
                    const explodeX = launchX + (Math.random() - 0.5) * 200;

                    // Create trail
                    this.createFireworkTrail(launchX, corner.y, explodeX, explodeY, () => {
                        this.createFirework(explodeX, explodeY);
                    });
                }, i * 400 + Math.random() * 200);
            }
        });
    }

    /**
     * Create firework launch trail
     */
    createFireworkTrail(startX, startY, endX, endY, callback) {
        const trail = document.createElement('div');
        trail.className = 'firework-trail';
        trail.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: #ffaa00;
            border-radius: 50%;
            box-shadow: 0 0 8px #ffaa00, 0 0 16px #ff6600;
            left: ${startX}px;
            top: ${startY}px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(trail);

        this.playSound('whoosh');

        const duration = 600;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 2);

            const x = startX + (endX - startX) * easeOut;
            const y = startY + (endY - startY) * easeOut;

            trail.style.left = x + 'px';
            trail.style.top = y + 'px';

            // Add sparkle trail
            if (Math.random() > 0.5) {
                const sparkle = document.createElement('div');
                sparkle.style.cssText = `
                    position: fixed;
                    width: 2px;
                    height: 2px;
                    background: #ffdd88;
                    border-radius: 50%;
                    left: ${x + (Math.random() - 0.5) * 10}px;
                    top: ${y + (Math.random() - 0.5) * 10}px;
                    z-index: 9999;
                    pointer-events: none;
                    animation: sparkleTrailFade 0.5s ease-out forwards;
                `;
                document.body.appendChild(sparkle);
                setTimeout(() => sparkle.remove(), 500);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                trail.remove();
                if (callback) callback();
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Create colorful confetti rain effect (falling from top)
     * @param {number} count - Number of confetti pieces
     */
    createConfetti(count = 100) {
        const colors = [
            '#fbbf24', // Gold
            '#60a5fa', // Blue
            '#a78bfa', // Purple
            '#34d399', // Green
            '#f472b6', // Pink
            '#fb923c', // Orange
            '#f43f5e', // Rose
            '#22d3ee', // Cyan
        ];

        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        for (let i = 0; i < count; i++) {
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
                box-shadow: 0 0 6px ${color};
            `;

            container.appendChild(confetti);
        }

        // Remove after animation completes
        setTimeout(() => {
            if (container.parentNode) {
                container.remove();
            }
        }, 5000);
    }

    /**
     * Create golden rain effect (falling coins/stars)
     * @param {number} count - Number of falling items
     * @param {number} duration - Duration in ms
     */
    createGoldenRain(count = 50, duration = 3000) {
        const container = document.createElement('div');
        container.className = 'golden-rain-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
            overflow: hidden;
        `;
        document.body.appendChild(container);

        const items = ['✦', '★', '●', '◆', '✧'];
        const colors = ['#ffd700', '#ffb700', '#ff9500', '#ffe066', '#fff4b3'];

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const item = document.createElement('div');
                const symbol = items[Math.floor(Math.random() * items.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = 12 + Math.random() * 16;
                const startX = Math.random() * 100;
                const drift = (Math.random() - 0.5) * 100;
                const fallDuration = 2 + Math.random() * 2;
                const delay = Math.random() * 0.5;
                const rotation = Math.random() * 720;

                item.textContent = symbol;
                item.style.cssText = `
                    position: absolute;
                    left: ${startX}%;
                    top: -30px;
                    font-size: ${size}px;
                    color: ${color};
                    text-shadow: 0 0 10px ${color}, 0 0 20px ${color};
                    animation: goldenRainFall ${fallDuration}s ease-in ${delay}s forwards;
                    --drift: ${drift}px;
                    --rotation: ${rotation}deg;
                    opacity: 0.9;
                `;
                container.appendChild(item);
            }, (i / count) * (duration * 0.6));
        }

        setTimeout(() => container.remove(), duration + 3000);
    }

    /**
     * Create screen shake/pulse effect
     * @param {string} intensity - 'light', 'medium', 'heavy'
     */
    screenShake(intensity = 'medium') {
        const body = document.body;
        const intensityMap = {
            light: { amount: 2, duration: 200 },
            medium: { amount: 4, duration: 300 },
            heavy: { amount: 8, duration: 500 }
        };
        const config = intensityMap[intensity] || intensityMap.medium;

        body.style.animation = `screenShake ${config.duration}ms ease-in-out`;
        body.style.setProperty('--shake-amount', config.amount + 'px');

        setTimeout(() => {
            body.style.animation = '';
        }, config.duration);
    }

    /**
     * Create screen pulse/flash effect
     * @param {string} color - Flash color (default gold)
     */
    screenPulse(color = 'rgba(251, 191, 36, 0.3)') {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            pointer-events: none;
            z-index: 9998;
            animation: screenPulseAnim 0.5s ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    }

    /**
     * Create floating background stars
     * @param {number} count - Number of stars
     * @param {number} duration - How long to show (0 for permanent)
     */
    createFloatingStars(count = 15, duration = 0) {
        let container = document.querySelector('.floating-stars-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'floating-stars-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
                overflow: hidden;
            `;
            document.body.appendChild(container);
        }

        const symbols = ['✦', '✧', '★', '·', '•'];
        const colors = ['rgba(251, 191, 36, 0.6)', 'rgba(167, 139, 250, 0.5)', 'rgba(96, 165, 250, 0.5)', 'rgba(52, 211, 153, 0.4)'];

        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 8 + Math.random() * 12;
            const startX = Math.random() * 100;
            const startY = 100 + Math.random() * 20;
            const floatDuration = 8 + Math.random() * 12;
            const delay = Math.random() * floatDuration;
            const drift = (Math.random() - 0.5) * 50;

            star.textContent = symbol;
            star.className = 'floating-star';
            star.style.cssText = `
                position: absolute;
                left: ${startX}%;
                bottom: -20px;
                font-size: ${size}px;
                color: ${color};
                animation: floatUp ${floatDuration}s linear ${delay}s infinite;
                --drift: ${drift}px;
                opacity: 0;
            `;
            container.appendChild(star);
        }

        if (duration > 0) {
            setTimeout(() => container.remove(), duration);
        }
    }

    /**
     * Run full celebration based on style
     * @param {string} style - 'simple', 'medium', 'dramatic', 'epic' (optional, uses default)
     * @param {Object} options - Additional options
     */
    celebrate(style = null, options = {}) {
        const celebrationStyle = style || this.celebrationStyle;

        switch (celebrationStyle) {
            case 'simple':
                this.createParticles('gold', 50);
                this.playSound('achievement');
                break;

            case 'medium':
                this.createParticles('rainbow', 80);
                this.createRings(3);
                this.screenPulse();
                this.playSound('levelup');
                break;

            case 'dramatic':
                this.createParticles('rainbow', 120);
                this.createRings(5);
                this.launchCornerFireworks(2);
                this.screenShake('light');
                this.screenPulse();
                this.playSound('levelup');
                break;

            case 'epic':
            default:
                this.screenPulse('rgba(255, 215, 0, 0.4)');
                this.screenShake('medium');
                this.createParticles('rainbow', 150);
                this.createRings(5);
                setTimeout(() => this.launchCornerFireworks(3), 300);
                setTimeout(() => this.createGoldenRain(40), 800);
                this.playSound('levelup');
                break;
        }
    }

    /**
     * Show achievement unlock celebration
     * @param {Object} achievement - {name, description, icon}
     */
    showAchievementUnlock(achievement) {
        this.createParticles('gold', 80);
        this.playSound('achievement');

        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-popup-content">
                <div class="achievement-unlock-burst"></div>
                <div class="achievement-icon-large">
                    <i class="bi ${achievement.icon || 'bi-trophy-fill'}"></i>
                </div>
                <div class="achievement-unlock-text">Achievement Unlocked!</div>
                <h3 class="achievement-name">${this.escapeHtml(achievement.name)}</h3>
                <p class="achievement-desc">${this.escapeHtml(achievement.description || '')}</p>
                <button class="btn-celebrate" onclick="this.closest('.achievement-popup').remove()">
                    Awesome!
                </button>
            </div>
        `;

        document.body.appendChild(popup);

        // Auto-dismiss after 6 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => popup.remove(), 300);
            }
        }, 6000);
    }

    /**
     * Show level-up celebration
     * @param {Object} level - {name, icon, stars, badge_class, bonus_points, celebration_style}
     * @param {Object} langStrings - Translation strings
     */
    showLevelUp(level, langStrings = {}) {
        // Use level-specific style or default
        const style = level.celebration_style || this.celebrationStyle;
        this.celebrate(style);

        // Add colorful confetti rain for level-up
        this.createConfetti(120);

        // Play triumphant fanfare sound (ta-tada-taa!) after initial effects
        setTimeout(() => this.playFanfare(), 400);

        // Trigger pet reaction
        if (window.petMascot) {
            window.petMascot.onLevelUp();
        }

        const stars = this.generateStars(level.stars || 1);

        const popup = document.createElement('div');
        popup.className = 'level-up-celebration';
        popup.innerHTML = `
            <div class="level-up-card" onclick="event.stopPropagation()">
                <div class="level-up-rays"></div>
                <div class="level-icon-container">
                    <div class="level-icon-ring"></div>
                    <span class="level-icon-large">${level.icon || '🌟'}</span>
                </div>
                <h2>${langStrings.level_up || 'Level Up!'}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 16px;">
                    ${langStrings.reached_level || 'You reached'}
                </p>
                <div class="level-badge ${level.badge_class || ''}" style="display: inline-flex; margin-bottom: 16px;">
                    <span class="level-name" style="font-weight: 600;">${this.escapeHtml(level.name || 'New Level')}</span>
                    <span class="level-stars" style="margin-left: 8px;">${stars}</span>
                </div>
                ${level.bonus_points ? `
                    <div class="bonus-points-display">
                        <i class="bi bi-coin"></i>
                        +${level.bonus_points} ${langStrings.bonus_points || 'bonus points'}!
                    </div>
                ` : ''}
                <button type="button" class="btn-celebrate">
                    ${langStrings.awesome || 'Awesome!'}
                </button>
            </div>
        `;

        document.body.appendChild(popup);

        // Close function
        const closePopup = () => {
            popup.style.opacity = '0';
            popup.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (popup.parentNode) popup.remove();
            }, 300);
        };

        // Click on button to close
        popup.querySelector('.btn-celebrate').addEventListener('click', closePopup);

        // Click on overlay to close
        popup.addEventListener('click', closePopup);

        // Global close function for backward compatibility
        window.closeLevelUp = closePopup;

        // Auto-dismiss after 10 seconds as backup
        setTimeout(() => {
            if (popup.parentNode) closePopup();
        }, 10000);
    }

    /**
     * Show goal completion celebration
     * @param {Object} goal - {name}
     * @param {Object} langStrings - Translation strings
     */
    showGoalComplete(goal, langStrings = {}) {
        this.createParticles('gold', 60);
        this.playSound('achievement');

        // Trigger pet reaction
        if (window.petMascot) {
            window.petMascot.onGoalCompleted();
        }

        const toast = document.createElement('div');
        toast.className = 'celebration-toast';
        toast.innerHTML = `
            <i class="bi bi-trophy-fill" style="font-size: 3rem; margin-bottom: 16px;"></i>
            <h3>${langStrings.congratulations || 'Congratulations'}!</h3>
            <p>${langStrings.goal_completed || 'Goal completed!'}</p>
            <div class="fw-bold">${this.escapeHtml(goal.name)}</div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Show goal completion with chest reward animation
     * @param {Object} data - {goal: {name, target_points}, chest: {type, xp_reward, multiplier_reward}}
     * @param {Object} langStrings - Translation strings
     */
    showGoalChest(data, langStrings = {}) {
        const { goal, chest } = data;

        // First show goal completion celebration
        this.createParticles('gold', 40);
        this.playSound('achievement');

        // Trigger pet reaction
        if (window.petMascot) {
            window.petMascot.onGoalCompleted();
        }

        // Determine chest visual based on type
        const chestVisuals = {
            small: { color: '#a78bfa', glow: '#c4b5fd', icon: 'bi-box', size: '60px' },
            medium: { color: '#fbbf24', glow: '#fde68a', icon: 'bi-box-fill', size: '70px' },
            large: { color: '#f97316', glow: '#fed7aa', icon: 'bi-box2-heart', size: '80px' },
            epic: { color: '#ec4899', glow: '#fbcfe8', icon: 'bi-gem', size: '90px' }
        };
        const visual = chestVisuals[chest.type] || chestVisuals.medium;

        // Create goal chest overlay
        const overlay = document.createElement('div');
        overlay.className = 'goal-chest-overlay';
        overlay.innerHTML = `
            <div class="goal-chest-content">
                <div class="goal-complete-text">
                    <i class="bi bi-trophy-fill" style="font-size: 2rem; color: #fbbf24;"></i>
                    <h3>${langStrings.congratulations || 'Congratulations'}!</h3>
                    <p class="mb-4">${langStrings.goal_completed || 'Goal completed!'}</p>
                    <div class="goal-name-badge">${this.escapeHtml(goal.name)}</div>
                </div>
                <div class="goal-chest-animation">
                    <div class="goal-chest-glow" style="background: radial-gradient(circle, ${visual.glow}80 0%, transparent 70%);"></div>
                    <div class="goal-chest-icon" style="font-size: ${visual.size}; color: ${visual.color};">
                        <i class="bi ${visual.icon}"></i>
                    </div>
                    <div class="goal-chest-sparkles"></div>
                </div>
                <div class="goal-chest-reward">
                    <h4 style="color: ${visual.color};">${langStrings.goal_chest_opened || 'Chest Reward!'}</h4>
                    ${chest.xp_reward > 0 ? `
                        <div class="reward-item xp-reward">
                            <i class="bi bi-plus-circle-fill"></i>
                            <span>+${chest.xp_reward} XP</span>
                        </div>
                    ` : ''}
                    ${chest.multiplier_reward >= 1.5 ? `
                        <div class="reward-item multiplier-reward">
                            <i class="bi bi-lightning-charge-fill"></i>
                            <span>${chest.multiplier_reward}x ${langStrings.multiplier_24h || 'Multiplier!'}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add sparkles to the chest
        const sparklesContainer = overlay.querySelector('.goal-chest-sparkles');
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'goal-sparkle';
            sparkle.style.setProperty('--angle', `${i * 45}deg`);
            sparkle.style.setProperty('--delay', `${i * 0.1}s`);
            sparklesContainer.appendChild(sparkle);
        }

        // Play chest sound
        setTimeout(() => {
            this.playSound('levelup');
            this.createParticles(visual.color, 30);
        }, 500);

        // Show reward animation
        setTimeout(() => {
            const rewardSection = overlay.querySelector('.goal-chest-reward');
            if (rewardSection) {
                rewardSection.classList.add('show');
            }
            this.playSound('coin');
            this.createParticles('gold', 40);
        }, 1200);

        // Close on click
        overlay.addEventListener('click', () => {
            overlay.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => overlay.remove(), 300);
        });

        // Auto close after 6 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => overlay.remove(), 300);
            }
        }, 6000);
    }

    /**
     * Animate a number counting up
     * @param {Element} element - DOM element to animate
     * @param {number} start - Starting value
     * @param {number} end - Ending value
     * @param {number} duration - Animation duration in ms
     * @param {string} prefix - Prefix string (e.g., '+')
     * @param {string} suffix - Suffix string (e.g., ' pts')
     */
    animateValue(element, start, end, duration = 1000, prefix = '', suffix = '') {
        if (!element) return;

        const range = end - start;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + range * easeOut);

            element.textContent = prefix + current.toLocaleString() + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Play coin sound on point change
     */
    async playCoinSound() {
        await this.playSound('coin');
    }

    /**
     * Play click sound for buttons
     */
    async playClickSound() {
        await this.playSound('click');
    }

    /**
     * Generate star HTML
     * @param {number} count - Number of stars
     * @returns {string} HTML string
     */
    generateStars(count) {
        return Array(count).fill('<i class="bi bi-star-fill star"></i>').join('');
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    /**
     * Show a custom confirmation dialog
     * @param {Object} options - Configuration options
     * @param {string} options.title - Dialog title
     * @param {string} options.message - Message to display
     * @param {string} options.confirmText - Confirm button text
     * @param {string} options.cancelText - Cancel button text
     * @param {string} options.type - Dialog type: 'danger', 'warning', 'info', 'purchase' (default: 'warning')
     * @param {Object} options.item - Item details for purchase confirmation
     * @param {string} options.item.name - Item name
     * @param {string} options.item.icon - Item icon class
     * @param {number} options.item.cost - Item cost in points
     * @param {string} options.item.costLabel - Label for points (e.g., "XP", "pts")
     * @returns {Promise<boolean>} - Resolves true if confirmed, false if cancelled
     */
    confirm(options = {}) {
        return new Promise((resolve) => {
            const {
                title = '',
                message = '',
                confirmText = 'Yes',
                cancelText = 'No',
                type = 'warning',
                item = null
            } = options;

            const iconMap = {
                danger: 'ph-fill ph-warning-circle',
                warning: 'ph-fill ph-question',
                info: 'ph-fill ph-info',
                purchase: 'ph-fill ph-shopping-cart'
            };
            const colorMap = {
                danger: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6',
                purchase: '#8b5cf6'
            };

            let itemHtml = '';
            if (item && type === 'purchase') {
                itemHtml = `
                    <div class="confirm-item">
                        <div class="confirm-item-icon">
                            <i class="${item.icon || 'bi bi-gift'}"></i>
                        </div>
                        <div class="confirm-item-name">${this.escapeHtml(item.name)}</div>
                        <div class="confirm-item-cost">
                            <i class="ph-fill ph-coin"></i>
                            <span>${item.cost}</span>
                            <small>${this.escapeHtml(item.costLabel || 'pts')}</small>
                        </div>
                    </div>
                `;
            }

            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.innerHTML = `
                <div class="confirm-dialog ${type === 'purchase' ? 'confirm-purchase' : ''}">
                    ${type !== 'purchase' ? `
                        <div class="confirm-icon" style="color: ${colorMap[type] || colorMap.warning}">
                            <i class="${iconMap[type] || iconMap.warning}"></i>
                        </div>
                    ` : ''}
                    ${itemHtml}
                    ${title ? `<h4 class="confirm-title">${this.escapeHtml(title)}</h4>` : ''}
                    <p class="confirm-message">${this.escapeHtml(message)}</p>
                    <div class="confirm-buttons">
                        <button type="button" class="confirm-btn confirm-btn-cancel">${this.escapeHtml(cancelText)}</button>
                        <button type="button" class="confirm-btn confirm-btn-confirm ${type === 'danger' ? 'danger' : ''} ${type === 'purchase' ? 'purchase' : ''}">${this.escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Animate in
            requestAnimationFrame(() => {
                overlay.classList.add('active');
            });

            const closeDialog = (result) => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 200);
            };

            // Event handlers
            overlay.querySelector('.confirm-btn-cancel').addEventListener('click', () => closeDialog(false));
            overlay.querySelector('.confirm-btn-confirm').addEventListener('click', () => {
                // Play coin sound immediately for purchase confirmations
                if (type === 'purchase') {
                    this.playCoinSound();
                }
                closeDialog(true);
            });
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeDialog(false);
            });

            // Focus confirm button
            overlay.querySelector('.confirm-btn-confirm').focus();
        });
    }

    /**
     * Create click sparkle effect at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    createClickSparkle(x, y) {
        const sparkles = ['✦', '✧', '★', '✨', '⭐', '💫'];
        const colors = ['#fbbf24', '#a78bfa', '#60a5fa', '#f472b6', '#34d399'];
        const count = 3 + Math.floor(Math.random() * 4);

        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'click-sparkle';
            sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            sparkle.style.cssText = `
                left: ${x + (Math.random() - 0.5) * 40}px;
                top: ${y + (Math.random() - 0.5) * 40}px;
                color: ${colors[Math.floor(Math.random() * colors.length)]};
                animation-delay: ${i * 0.05}s;
            `;
            document.body.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 700);
        }

        this.playSound('sparkle');
    }

    /**
     * Initialize random click sparkle system
     * @param {number} chance - Probability (0-1) of sparkle on click
     */
    initClickSparkles(chance = 0.1) {
        document.addEventListener('click', (e) => {
            if (Math.random() < chance) {
                this.createClickSparkle(e.clientX, e.clientY);
            }
        });
    }

    /**
     * Show surprise message toast
     * @param {string} message - Message to show
     * @param {string} icon - Icon/emoji to show
     */
    showSurpriseToast(message, icon = '🎉') {
        const toast = document.createElement('div');
        toast.className = 'surprise-toast';
        toast.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 8px;">${icon}</div>
            <div style="font-weight: 600; color: #92400e;">${this.escapeHtml(message)}</div>
        `;
        document.body.appendChild(toast);

        this.playSound('achievement');
        this.createParticles('gold', 30);

        setTimeout(() => {
            toast.classList.add('surprise-toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    /**
     * Initialize avatar easter egg (click 5 times for surprise)
     * @param {string} selector - CSS selector for avatar element
     */
    initAvatarEasterEgg(selector = '.player-avatar, .avatar-ring') {
        let clickCount = 0;
        let lastClickTime = 0;
        const resetTime = 2000; // Reset if no click for 2 seconds

        document.querySelectorAll(selector).forEach(avatar => {
            avatar.style.cursor = 'pointer';
            avatar.addEventListener('click', (e) => {
                e.stopPropagation();
                const now = Date.now();

                if (now - lastClickTime > resetTime) {
                    clickCount = 0;
                }
                lastClickTime = now;
                clickCount++;

                // Small sparkle on each click
                this.createClickSparkle(e.clientX, e.clientY);

                if (clickCount >= 5) {
                    clickCount = 0;
                    this.triggerEasterEgg();
                }
            });
        });
    }

    /**
     * Trigger secret easter egg celebration
     */
    triggerEasterEgg() {
        const messages = [
            { text: "You found a secret!", icon: "🎉" },
            { text: "Amazing discovery!", icon: "🌟" },
            { text: "You're awesome!", icon: "🚀" },
            { text: "Super explorer!", icon: "🔮" },
            { text: "Magic found!", icon: "✨" },
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];

        this.showSurpriseToast(msg.text, msg.icon);
        this.celebrate('dramatic');

        // Dispatch event for achievement tracking
        window.dispatchEvent(new CustomEvent('easterEggFound', { detail: { type: 'avatar_click' } }));
    }

    /**
     * Initialize all surprise systems
     */
    initSurprises() {
        this.initClickSparkles(0.1);
        this.initAvatarEasterEgg();
        this.createFloatingStars(12); // Permanent floating background
    }

    /**
     * Show treasure chest modal
     * @param {Object} chest - Chest data {type, visual, reward_value, has_multiplier, multiplier}
     * @param {Object} langStrings - Translation strings
     * @param {Function} onOpen - Callback when chest is opened
     */
    showTreasureChest(chest, langStrings = {}, onOpen = null) {
        // Trigger pet reaction - pet gets excited about chest
        if (window.petMascot) {
            window.petMascot.onChestAvailable();
        }

        const isGolden = chest.visual === 'golden' || chest.type === 'sunday';
        const isBonus = chest.visual === 'bonus' || chest.type === 'bonus' || chest.type === 'active_bonus';
        const chestClass = isGolden ? 'chest-golden' : (isBonus ? 'chest-bonus' : 'chest-regular');
        const chestTitle = isGolden ? 'Golden Chest!' : (isBonus ? 'Bonus Chest!' : 'Daily Chest!');

        const overlay = document.createElement('div');
        overlay.className = 'chest-overlay';
        overlay.innerHTML = `
            <div class="chest-modal ${chestClass}">
                <div class="chest-glow"></div>
                <div class="chest-sparkles"></div>
                <div class="chest-container">
                    <div class="chest-box" id="treasureChest">
                        <!-- Lid -->
                        <div class="chest-lid">
                            <div class="chest-lid-top"></div>
                            <div class="chest-shine"></div>
                        </div>
                        <!-- Base -->
                        <div class="chest-base">
                            <!-- Metal bands -->
                            <div class="chest-band chest-band-1"></div>
                            <div class="chest-band chest-band-2"></div>
                            <div class="chest-band chest-band-3"></div>
                            <!-- Rivets -->
                            <div class="chest-rivet" style="top: 8px; left: 32px;"></div>
                            <div class="chest-rivet" style="top: 8px; right: 32px;"></div>
                            <div class="chest-rivet" style="bottom: 10px; left: 32px;"></div>
                            <div class="chest-rivet" style="bottom: 10px; right: 32px;"></div>
                            <!-- Corner brackets -->
                            <div class="chest-corner chest-corner-bl"></div>
                            <div class="chest-corner chest-corner-br"></div>
                        </div>
                        <!-- Lock mechanism -->
                        <div class="chest-lock">
                            <div class="chest-keyhole"></div>
                        </div>
                        <!-- Decorative gems on lid -->
                        <div class="chest-gem chest-gem-ruby" style="top: 25px; left: 28px;"></div>
                        <div class="chest-gem chest-gem-emerald" style="top: 25px; right: 28px;"></div>
                        <div class="chest-gem chest-gem-sapphire" style="top: 55px; left: 50%; margin-left: -5px;"></div>
                        <!-- Light effects (hidden until open) -->
                        <div class="chest-light-beam"></div>
                        <div class="chest-light-burst"></div>
                        <div class="chest-magic-circle"></div>
                    </div>
                </div>
                <h3 class="chest-title">${this.escapeHtml(langStrings.title || chestTitle)}</h3>
                <p class="chest-subtitle">${this.escapeHtml(langStrings.subtitle || 'Tap to open!')}</p>
                <div class="chest-reward-preview" style="display: none;">
                    <div class="chest-reward-icon"></div>
                    <div class="chest-reward-text"></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add sparkles around chest
        this.addChestSparkles(overlay.querySelector('.chest-sparkles'), isGolden, isBonus);

        // Add light rays for burst effect
        this.addLightRays(overlay.querySelector('.chest-light-burst'));

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('active');
            this.playSound('sparkle');
        });

        // Click to open
        const chestContainer = overlay.querySelector('.chest-container');
        const chestEl = overlay.querySelector('#treasureChest');
        let opened = false;

        const openHandler = () => {
            if (opened) return;
            opened = true;

            // Stop heartbeat animation
            chestContainer.classList.add('chest-clicked');

            this.animateChestOpen(overlay, chest, langStrings, () => {
                if (onOpen) onOpen(chest);
            });
        };

        chestEl.addEventListener('click', openHandler);
        overlay.querySelector('.chest-modal').addEventListener('click', (e) => {
            if (e.target === overlay.querySelector('.chest-modal') || e.target.closest('.chest-container')) {
                openHandler();
            }
        });
    }

    /**
     * Add light rays for burst effect
     */
    addLightRays(container) {
        const rayCount = 12;
        for (let i = 0; i < rayCount; i++) {
            const ray = document.createElement('div');
            ray.className = 'chest-light-ray';
            ray.style.transform = `rotate(${i * (360 / rayCount)}deg)`;
            ray.style.animationDelay = `${i * 0.05}s`;
            container.appendChild(ray);
        }
    }

    /**
     * Add animated sparkles around chest - Enhanced magical particles
     */
    addChestSparkles(container, isGolden, isBonus = false) {
        const colors = isGolden
            ? ['#ffd700', '#ffb700', '#fff4b3', '#ffffff', '#ffe066']
            : isBonus
                ? ['#ec4899', '#f472b6', '#a855f7', '#c084fc', '#ffffff']
                : ['#60a5fa', '#a78bfa', '#fbbf24', '#34d399', '#ffffff'];

        // Create orbiting sparkles
        for (let i = 0; i < 30; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'chest-sparkle-particle';

            // Create elliptical orbit patterns
            const orbitRadius = 80 + Math.random() * 100;
            const angle = (i / 30) * 360;
            const xOffset = Math.cos(angle * Math.PI / 180) * orbitRadius;
            const yOffset = Math.sin(angle * Math.PI / 180) * orbitRadius * 0.6; // Elliptical

            sparkle.style.cssText = `
                --delay: ${(i / 30) * 2}s;
                --duration: ${2 + Math.random() * 1.5}s;
                --x: ${xOffset}px;
                --y: ${yOffset}px;
                --color: ${colors[Math.floor(Math.random() * colors.length)]};
                --size: ${3 + Math.random() * 5}px;
            `;
            container.appendChild(sparkle);
        }

        // Add a few larger, slower floating particles
        for (let i = 0; i < 8; i++) {
            const floater = document.createElement('div');
            floater.className = 'chest-sparkle-particle';
            floater.style.cssText = `
                --delay: ${Math.random() * 3}s;
                --duration: ${3 + Math.random() * 2}s;
                --x: ${(Math.random() - 0.5) * 250}px;
                --y: ${(Math.random() - 0.5) * 200}px;
                --color: ${colors[0]};
                --size: ${8 + Math.random() * 6}px;
            `;
            container.appendChild(floater);
        }
    }

    /**
     * Animate chest opening - Dramatic sequence with glow and light effects
     */
    animateChestOpen(overlay, chest, langStrings, callback) {
        const chestEl = overlay.querySelector('#treasureChest');
        const chestContainer = overlay.querySelector('.chest-container');
        const modal = overlay.querySelector('.chest-modal');
        const isGolden = chest.visual === 'golden' || chest.type === 'sunday';
        const isBonus = chest.visual === 'bonus' || chest.type === 'bonus' || chest.type === 'active_bonus';

        // Phase 1: Intense shake (0.8 seconds)
        chestContainer.classList.add('chest-shaking');
        this.playSound('click');

        setTimeout(() => {
            chestContainer.classList.remove('chest-shaking');

            // Phase 2: Glow effect
            chestContainer.classList.add('chest-rotating');
            this.playSound('whoosh');

            // Show magic circle
            const magicCircle = chestEl.querySelector('.chest-magic-circle');
            if (magicCircle) {
                magicCircle.classList.add('active');
            }

            setTimeout(() => {
                // Phase 3: Open lid with light beam
                chestEl.classList.add('chest-opening');

                // Activate light beam
                const beam = chestEl.querySelector('.chest-light-beam');
                if (beam) {
                    beam.classList.add('active');
                }

                // Activate light burst rays
                const burst = chestEl.querySelector('.chest-light-burst');
                if (burst) {
                    burst.classList.add('active');
                }

                this.playSound('chestOpen');

                // Add extra glow to overlay
                overlay.style.background = isGolden
                    ? 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.2) 0%, rgba(10, 5, 20, 0.92) 50%, rgba(0, 0, 0, 0.98) 100%)'
                    : isBonus
                        ? 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.2) 0%, rgba(10, 5, 20, 0.92) 50%, rgba(0, 0, 0, 0.98) 100%)'
                        : 'radial-gradient(ellipse at center, rgba(139, 90, 43, 0.15) 0%, rgba(10, 5, 20, 0.92) 50%, rgba(0, 0, 0, 0.98) 100%)';

                setTimeout(() => {
                    // Phase 4: Explosion of particles
                    this.createChestRewardExplosion(chestEl, isGolden, isBonus);

                    // Play achievement sound
                    this.playSound('achievement');

                    // Second particle wave
                    setTimeout(() => {
                        this.createChestRewardExplosion(chestEl, isGolden, isBonus);
                        this.playSound('sparkle');
                    }, 500);

                    // Wait 2.5 seconds before showing reward
                    setTimeout(() => {
                        this.showChestReward(overlay, chest, langStrings, callback);
                    }, 2500);
                }, 500);
            }, 1200); // Wait for glow
        }, 800); // Shake duration
    }

    /**
     * Create particle explosion from chest - Enhanced with more particles and variety
     */
    createChestRewardExplosion(chestEl, isGolden, isBonus = false) {
        const rect = chestEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 3; // Start from top where lid opens

        const colors = isGolden
            ? ['#ffd700', '#ffb700', '#ff9500', '#fff4b3', '#ffffff']
            : isBonus
                ? ['#ec4899', '#f472b6', '#a855f7', '#c084fc', '#ffffff']
                : ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#ffffff'];

        const symbols = ['✦', '★', '◆', '●', '✧', '♦', '❖', '✶'];
        const particleCount = isGolden ? 60 : 50;

        // Create multiple explosion waves
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                for (let i = 0; i < particleCount / 3; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'chest-explosion-particle';
                    particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];

                    const angle = (i / (particleCount / 3)) * 360 + Math.random() * 30;
                    const velocity = (80 + Math.random() * 180) * (1 + wave * 0.3);
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const size = 10 + Math.random() * 16;

                    particle.style.cssText = `
                        position: fixed;
                        left: ${centerX}px;
                        top: ${centerY}px;
                        font-size: ${size}px;
                        color: ${color};
                        text-shadow: 0 0 8px ${color}, 0 0 16px ${color};
                        pointer-events: none;
                        z-index: 10003;
                        --angle: ${angle}deg;
                        --velocity: ${velocity}px;
                        animation: chestParticleExplode 1.2s ease-out forwards;
                    `;
                    document.body.appendChild(particle);
                    setTimeout(() => particle.remove(), 1200);
                }

                // Add coin/gem particles
                for (let j = 0; j < 8; j++) {
                    const coin = document.createElement('div');
                    const coinSymbol = isGolden ? '💰' : isBonus ? '💎' : '🪙';
                    coin.textContent = coinSymbol;
                    const angle = Math.random() * 360;
                    const velocity = 100 + Math.random() * 120;

                    coin.style.cssText = `
                        position: fixed;
                        left: ${centerX}px;
                        top: ${centerY}px;
                        font-size: 24px;
                        pointer-events: none;
                        z-index: 10003;
                        --angle: ${angle}deg;
                        --velocity: ${velocity}px;
                        animation: chestParticleExplode 1.5s ease-out forwards;
                    `;
                    document.body.appendChild(coin);
                    setTimeout(() => coin.remove(), 1500);
                }
            }, wave * 150);
        }

        // Play celebration sounds with delays
        if (isGolden) {
            setTimeout(() => this.playSound('multiplier'), 200);
            setTimeout(() => this.playSound('sparkle'), 400);
        } else if (isBonus) {
            setTimeout(() => this.playSound('sparkle'), 200);
        }
    }

    /**
     * Show the chest reward
     */
    showChestReward(overlay, chest, langStrings, callback) {
        const modal = overlay.querySelector('.chest-modal');
        const chestContainer = overlay.querySelector('.chest-container');
        const rewardPreview = overlay.querySelector('.chest-reward-preview');
        const rewardIcon = overlay.querySelector('.chest-reward-icon');
        const rewardText = overlay.querySelector('.chest-reward-text');
        const title = overlay.querySelector('.chest-title');
        const subtitle = overlay.querySelector('.chest-subtitle');
        const isGolden = chest.visual === 'golden' || chest.type === 'sunday';

        // Fade out chest
        chestContainer.style.opacity = '0';
        chestContainer.style.transform = 'scale(0.8)';

        // Update content
        title.textContent = langStrings.congratulations || 'Congratulations!';

        let rewardHtml = '';
        if (chest.reward_value > 0) {
            rewardHtml = `
                <div class="reward-xp">
                    <i class="bi bi-coin"></i>
                    <span class="reward-amount">+${chest.reward_value}</span>
                    <span class="reward-label">${langStrings.xp || 'XP'}</span>
                </div>
            `;
        }

        if (chest.has_multiplier && chest.multiplier > 1) {
            rewardHtml += `
                <div class="reward-multiplier ${isGolden ? 'golden' : ''}">
                    <i class="bi bi-lightning-charge-fill"></i>
                    <span class="multiplier-value">${chest.multiplier}x</span>
                    <span class="multiplier-label">${langStrings.multiplier_24h || 'Multiplier for 24h!'}</span>
                </div>
            `;
        }

        rewardIcon.innerHTML = isGolden ? '🏆' : '🎁';
        rewardText.innerHTML = rewardHtml;

        // Show reward
        setTimeout(() => {
            rewardPreview.style.display = 'block';
            rewardPreview.classList.add('reward-appear');
            subtitle.style.display = 'none';

            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn-celebrate chest-close-btn';
            closeBtn.textContent = langStrings.awesome || 'Awesome!';
            closeBtn.onclick = () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            };
            modal.appendChild(closeBtn);

            // Celebration effects
            if (isGolden) {
                this.celebrate('dramatic');
            } else {
                this.createParticles('gold', 60);
            }

            if (callback) callback();
        }, 200);
    }

    /**
     * Show multiplier badge on avatar/profile
     * @param {number} multiplier - Multiplier value
     * @param {number} hoursRemaining - Hours until expiry
     */
    showMultiplierBadge(multiplier, hoursRemaining) {
        // Remove existing badge
        document.querySelectorAll('.multiplier-badge-floating').forEach(el => el.remove());

        if (multiplier <= 1) return;

        const badge = document.createElement('div');
        badge.className = 'multiplier-badge-floating';
        badge.innerHTML = `
            <span class="multiplier-value">${multiplier}x</span>
            <span class="multiplier-timer">${Math.ceil(hoursRemaining)}h</span>
        `;

        // Attach to avatar if exists
        const avatar = document.querySelector('.player-avatar, .avatar-ring');
        if (avatar) {
            avatar.style.position = 'relative';
            avatar.appendChild(badge);
        }
    }

    /**
     * Show multiplied points celebration
     * @param {Object} data - { base_points, multiplier, bonus_points, final_points }
     * @param {Object} langStrings - Translation strings
     */
    showMultipliedPointsCelebration(data, langStrings = {}) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'multiplied-points-overlay';
        overlay.innerHTML = `
            <div class="multiplied-points-modal">
                <div class="multiplier-glow"></div>
                <div class="multiplier-icon">
                    <i class="bi bi-lightning-charge-fill"></i>
                </div>
                <h3>${langStrings.multiplied || 'Multiplied!'}</h3>
                <div class="multiplier-breakdown">
                    <div class="base-points">${data.base_points} ${langStrings.base || 'base'}</div>
                    <div class="multiplier-badge">${data.multiplier}x</div>
                    <div class="bonus-display">
                        <span class="bonus-amount">+${data.bonus_points}</span>
                        <span class="bonus-label">${langStrings.bonus || 'bonus'}</span>
                    </div>
                </div>
                <div class="final-points">
                    <i class="bi bi-coin"></i>
                    <span class="final-amount">${data.final_points}</span>
                    <span class="final-label">${langStrings.pts || 'pts'}</span>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Play sounds and effects
        this.playSound('multiplier');
        this.createParticles('gold', 80);
        setTimeout(() => this.launchCornerFireworks(2), 200);

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        // Auto-close after 3 seconds
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }, 3000);

        // Click to close
        overlay.addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        });
    }
}

// Initialize global instance
window.gameCelebration = new GameCelebration();

// Auto-initialize count-up animations on elements with data-count attribute
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';

        if (!isNaN(target)) {
            window.gameCelebration.animateValue(el, 0, target, 1000, prefix, suffix);
        }
    });

    // Add click sound to buttons with .btn-game class
    document.querySelectorAll('.btn-game').forEach(btn => {
        btn.addEventListener('click', () => {
            window.gameCelebration.playClickSound();
        });
    });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameCelebration;
}
