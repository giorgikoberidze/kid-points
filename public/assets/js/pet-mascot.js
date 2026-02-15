/**
 * Pet Mascot System - Kid Points Child Portal
 * Enhanced animated companion with mood, movements, and rich interactions
 */

// ============================================
// PetMoodSystem - Mood tracking & time awareness
// ============================================
class PetMoodSystem {
    constructor(pet) {
        this.pet = pet;
        this.currentMood = 'happy';
        this.moodWeights = { happy: 70, playful: 15, sleepy: 10, sad: 5 };
        this.activityLevel = 0;
        this.lastActivityTime = Date.now();
        this.moodInterval = null;
    }

    init() {
        this.setMood(this.calculateInitialMood());
        this.moodInterval = setInterval(() => this.evaluateMood(), 60000);
    }

    calculateInitialMood() {
        const hour = new Date().getHours();
        if (hour >= 21 || hour < 6) {
            return Math.random() < 0.4 ? 'sleepy' : 'happy';
        }
        if (hour >= 6 && hour < 12) {
            return Math.random() < 0.3 ? 'playful' : 'happy';
        }
        return this.getWeightedRandomMood();
    }

    getWeightedRandomMood() {
        const total = Object.values(this.moodWeights).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        for (const [mood, weight] of Object.entries(this.moodWeights)) {
            random -= weight;
            if (random <= 0) return mood;
        }
        return 'happy';
    }

    setMood(mood) {
        const oldMood = this.currentMood;
        this.currentMood = mood;
        if (this.pet.container) {
            this.pet.container.setAttribute('data-mood', mood);
        }
        if (this.pet.weather && oldMood !== mood) {
            this.pet.weather.updateForMood(mood);
        }
    }

    evaluateMood() {
        const hour = new Date().getHours();
        const timeSinceActivity = Date.now() - this.lastActivityTime;

        // Sleepy at night
        if (hour >= 21 || hour < 6) {
            if (Math.random() < 0.3) {
                this.setMood('sleepy');
                return;
            }
        }

        // More playful when child is active
        if (timeSinceActivity < 120000 && this.activityLevel > 3) {
            if (Math.random() < 0.4) {
                this.setMood('playful');
                return;
            }
        }

        // Random mood swing (10% chance)
        if (Math.random() < 0.1) {
            this.setMood(this.getWeightedRandomMood());
        }
    }

    registerActivity() {
        this.activityLevel++;
        this.lastActivityTime = Date.now();
        setTimeout(() => {
            this.activityLevel = Math.max(0, this.activityLevel - 1);
        }, 30000);
    }

    getMoodModifier() {
        return {
            happy: { speed: 1, jumpHeight: 1, effectIntensity: 1 },
            playful: { speed: 1.3, jumpHeight: 1.5, effectIntensity: 1.5 },
            sleepy: { speed: 0.5, jumpHeight: 0.5, effectIntensity: 0.5 },
            sad: { speed: 0.7, jumpHeight: 0.7, effectIntensity: 0.8 }
        }[this.currentMood] || { speed: 1, jumpHeight: 1, effectIntensity: 1 };
    }

    destroy() {
        if (this.moodInterval) clearInterval(this.moodInterval);
    }
}

// ============================================
// PetExpressionSystem - Emotions, talking, expressions
// ============================================
class PetExpressionSystem {
    constructor(pet) {
        this.pet = pet;
        this.currentExpression = 'neutral';
        this.isTalking = false;
        this.talkTimeout = null;
        this.expressionTimeout = null;
        this.blushTimeout = null;
        this.emoteTimeout = null;

        // Speech bubble messages
        this.messages = {
            en: {
                greeting: ['Hi!', 'Hello!', 'Hey there!', 'Yay!'],
                happy: ['Woohoo!', 'Great job!', 'Amazing!', 'You rock!', 'So happy!'],
                sad: ['Aww...', 'Oh no...', 'Hmm...', '*sniff*'],
                love: ['Love you!', '♥ ♥ ♥', 'You\'re the best!', 'Hugs!'],
                excited: ['Wow!', 'Yes!', 'Let\'s go!', 'Awesome!'],
                sleepy: ['*yawn*', 'Zzz...', 'So sleepy...', 'Nap time?'],
                curious: ['Huh?', 'What\'s that?', 'Ooh!', 'Hmm?'],
                encourage: ['You can do it!', 'Keep going!', 'Almost there!', 'Believe!'],
                celebrate: ['Party time!', 'Wahoo!', 'Victory!', 'Champion!']
            },
            ka: {
                greeting: ['გამარჯობა!', 'სალამი!', 'ჰეი!', 'იუპი!'],
                happy: ['ვაშა!', 'მშვენიერია!', 'საოცარი!', 'ყოჩაღ!', 'ბედნიერი ვარ!'],
                sad: ['ვაი...', 'ოჰ არა...', 'ჰმ...', '*ცრემლი*'],
                love: ['მიყვარხარ!', '♥ ♥ ♥', 'საუკეთესო ხარ!', 'ჩახუტება!'],
                excited: ['ვაუ!', 'კი!', 'წავედით!', 'მაგარია!'],
                sleepy: ['*აფხუილი*', 'ზზზ...', 'მეძინება...', 'დასაძინებელია?'],
                curious: ['ჰა?', 'რა არის?', 'ოოჰ!', 'ჰმ?'],
                encourage: ['შეგიძლია!', 'განაგრძე!', 'თითქმის მზადაა!', 'გჯერა!'],
                celebrate: ['დღესასწაული!', 'ვაშა!', 'გამარჯვება!', 'ჩემპიონი!']
            }
        };
    }

    init() {
        // Start random expressions
        this.startRandomExpressions();
    }

    startRandomExpressions() {
        // Occasionally show random expressions
        setInterval(() => {
            if (this.pet.currentState === 'idle' && !this.pet.isDragging && Math.random() < 0.15) {
                const expressions = ['smile', 'curious', 'blink-happy'];
                this.setExpression(expressions[Math.floor(Math.random() * expressions.length)], 2000);
            }
        }, 8000);
    }

    // ========== Mouth Expressions ==========
    setExpression(expression, duration = 2000) {
        const petBody = this.pet.petElement?.querySelector('.pet-body');
        if (!petBody) return;

        // Clear previous expression timeout
        if (this.expressionTimeout) {
            clearTimeout(this.expressionTimeout);
        }

        this.currentExpression = expression;
        petBody.setAttribute('data-expression', expression);

        // Reset after duration
        if (duration > 0) {
            this.expressionTimeout = setTimeout(() => {
                this.clearExpression();
            }, duration);
        }
    }

    clearExpression() {
        const petBody = this.pet.petElement?.querySelector('.pet-body');
        if (petBody) {
            petBody.removeAttribute('data-expression');
        }
        this.currentExpression = 'neutral';
    }

    // ========== Talking Animation ==========
    talk(messageType = 'happy', duration = 3000) {
        if (this.isTalking) return;

        this.isTalking = true;
        this.setExpression('talking', 0);

        // Show speech bubble
        this.showSpeechBubble(messageType);

        // Animate mouth
        this.animateMouth(duration);

        // Clear after duration
        this.talkTimeout = setTimeout(() => {
            this.isTalking = false;
            this.clearExpression();
        }, duration);
    }

    animateMouth(duration) {
        const mouth = this.pet.petElement?.querySelector('.pet-mouth');
        if (!mouth) return;

        let count = 0;
        const interval = setInterval(() => {
            mouth.classList.toggle('mouth-open');
            count++;
            if (count > duration / 150) {
                clearInterval(interval);
                mouth.classList.remove('mouth-open');
            }
        }, 150);
    }

    // ========== Speech Bubbles ==========
    showSpeechBubble(messageType = 'happy', customMessage = null) {
        // Remove existing bubble
        this.hideSpeechBubble();

        const locale = document.documentElement.lang || 'en';
        const messages = this.messages[locale] || this.messages.en;
        const typeMessages = messages[messageType] || messages.happy;
        const message = customMessage || typeMessages[Math.floor(Math.random() * typeMessages.length)];

        const bubble = document.createElement('div');
        bubble.className = 'pet-speech-bubble';
        bubble.innerHTML = `<span>${message}</span>`;

        this.pet.container.appendChild(bubble);

        // Animate in
        requestAnimationFrame(() => {
            bubble.classList.add('show');
        });

        // Remove after delay
        setTimeout(() => {
            this.hideSpeechBubble();
        }, 3000);
    }

    hideSpeechBubble() {
        const bubble = this.pet.container?.querySelector('.pet-speech-bubble');
        if (bubble) {
            bubble.classList.remove('show');
            setTimeout(() => bubble.remove(), 300);
        }
    }

    // ========== Emotes (Floating Symbols) ==========
    showEmote(type = 'heart') {
        const emotes = {
            heart: '❤️',
            hearts: '💕',
            star: '⭐',
            stars: '✨',
            question: '❓',
            exclaim: '❗',
            music: '🎵',
            sweat: '💧',
            anger: '💢',
            sleep: '💤',
            kiss: '💋',
            sparkle: '✦'
        };

        const symbol = emotes[type] || emotes.heart;

        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const emote = document.createElement('div');
                emote.className = 'pet-emote';
                emote.textContent = symbol;
                emote.style.setProperty('--delay', `${i * 0.15}s`);
                emote.style.setProperty('--x-offset', `${(Math.random() - 0.5) * 40}px`);

                const effectsContainer = this.pet.petElement?.querySelector('.pet-effects');
                if (effectsContainer) {
                    effectsContainer.appendChild(emote);
                    setTimeout(() => emote.remove(), 1500);
                }
            }, i * 150);
        }
    }

    // ========== Blush ==========
    showBlush(duration = 3000) {
        const petBody = this.pet.petElement?.querySelector('.pet-body');
        if (!petBody) return;

        petBody.classList.add('blushing');

        if (this.blushTimeout) {
            clearTimeout(this.blushTimeout);
        }

        this.blushTimeout = setTimeout(() => {
            petBody.classList.remove('blushing');
        }, duration);
    }

    // ========== Combined Expression Actions ==========
    smile() {
        this.setExpression('smile', 3000);
    }

    frown() {
        this.setExpression('sad', 3000);
    }

    surprised() {
        this.setExpression('surprised', 2000);
        this.showEmote('exclaim');
    }

    love() {
        this.setExpression('love', 3000);
        this.showBlush(3000);
        this.showEmote('hearts');
    }

    blowKiss() {
        this.setExpression('kiss', 1500);
        this.showBlush(2000);

        setTimeout(() => {
            this.showEmote('kiss');
            this.pet.playPetSound('happy');
        }, 500);

        // Send heart to avatar
        if (this.pet.affection) {
            this.pet.affection.sendHeartsToAvatar();
        }
    }

    confused() {
        this.setExpression('curious', 2500);
        this.showEmote('question');
    }

    excited() {
        this.setExpression('excited', 2000);
        this.showEmote('exclaim');
        this.showEmote('stars');
    }

    sleepy() {
        this.setExpression('sleepy', 4000);
        this.showEmote('sleep');
    }

    greet() {
        this.setExpression('smile', 3000);
        this.talk('greeting', 2500);
    }

    celebrate() {
        this.setExpression('excited', 3000);
        this.showEmote('stars');
        this.talk('celebrate', 2500);
    }

    encourage() {
        this.setExpression('smile', 3000);
        this.talk('encourage', 3000);
    }

    destroy() {
        if (this.talkTimeout) clearTimeout(this.talkTimeout);
        if (this.expressionTimeout) clearTimeout(this.expressionTimeout);
        if (this.blushTimeout) clearTimeout(this.blushTimeout);
    }
}

// ============================================
// PetMovementSystem - Jump, fly, explore
// ============================================
class PetMovementSystem {
    constructor(pet) {
        this.pet = pet;
        this.isMoving = false;
        this.screenBounds = null;
        this.randomMovementInterval = null;
    }

    init() {
        this.updateScreenBounds();
        window.addEventListener('resize', () => this.updateScreenBounds());
        this.startRandomMovements();
    }

    updateScreenBounds() {
        const bottomNavHeight = document.querySelector('.child-bottom-nav')?.offsetHeight || 70;
        const topNavHeight = document.querySelector('.child-navbar')?.offsetHeight || 60;
        this.screenBounds = {
            top: topNavHeight + 20,
            bottom: window.innerHeight - bottomNavHeight - 100,
            left: 20,
            right: window.innerWidth - 100
        };
    }

    startRandomMovements() {
        // Random movements every 20-40 seconds based on mood
        const scheduleNext = () => {
            const moodMod = this.pet.mood ? this.pet.mood.getMoodModifier() : { speed: 1 };
            const baseDelay = 20000 + Math.random() * 20000;
            const delay = baseDelay / moodMod.speed;

            this.randomMovementInterval = setTimeout(() => {
                if (!this.pet.isDragging && !this.isMoving && this.pet.currentState === 'idle') {
                    this.doRandomMovement();
                }
                scheduleNext();
            }, delay);
        };
        scheduleNext();
    }

    doRandomMovement() {
        const hour = new Date().getHours();
        let actions;

        // Time-based behavior selection
        if (hour >= 6 && hour < 12) {
            actions = ['jump', 'flyToRandomPosition', 'exploreEdge', 'wiggle'];
        } else if (hour >= 12 && hour < 18) {
            actions = ['jump', 'exploreEdge', 'wiggle', 'wiggle'];
        } else if (hour >= 18 && hour < 21) {
            actions = ['wiggle', 'look-around', 'look-around'];
        } else {
            actions = ['yawn', 'slow-blink', 'wiggle'];
        }

        // Mood affects action selection
        const mood = this.pet.mood?.currentMood || 'happy';
        if (mood === 'playful') {
            actions = ['jump', 'flyToRandomPosition', 'dance', 'spin360'];
        } else if (mood === 'sleepy') {
            actions = ['yawn', 'slow-blink', 'wiggle'];
        } else if (mood === 'sad') {
            actions = ['wiggle', 'look-around'];
        }

        const action = actions[Math.floor(Math.random() * actions.length)];

        switch (action) {
            case 'jump':
                this.jump();
                break;
            case 'flyToRandomPosition':
                if (Math.random() < 0.3) this.flyToRandomPosition();
                break;
            case 'exploreEdge':
                if (Math.random() < 0.2) this.exploreEdge();
                break;
            case 'dance':
                this.pet.doAction('dance');
                break;
            case 'spin360':
                this.pet.doAction('spin360');
                break;
            case 'yawn':
                this.pet.doAction('yawn');
                break;
            case 'slow-blink':
                this.pet.blink();
                setTimeout(() => this.pet.blink(), 500);
                break;
            default:
                this.pet.doIdleAction(action);
        }
    }

    jump() {
        if (this.isMoving) return;
        this.isMoving = true;
        this.pet.doAction('jump');
        setTimeout(() => {
            this.isMoving = false;
        }, 600);
    }

    flyToRandomPosition() {
        if (this.isMoving || this.pet.isDragging) return;
        this.isMoving = true;

        const targetX = this.screenBounds.left + Math.random() * (this.screenBounds.right - this.screenBounds.left);
        const targetY = this.screenBounds.top + Math.random() * (this.screenBounds.bottom - this.screenBounds.top);

        this.animateToPosition(targetX, targetY, () => {
            this.isMoving = false;
            this.pet.scheduleReturnToDefault();
        });
    }

    exploreEdge() {
        if (this.isMoving || this.pet.isDragging) return;
        this.isMoving = true;

        const edges = ['top', 'bottom', 'left', 'right'];
        const edge = edges[Math.floor(Math.random() * edges.length)];

        let targetX, targetY;
        switch (edge) {
            case 'top':
                targetX = this.screenBounds.left + Math.random() * (this.screenBounds.right - this.screenBounds.left);
                targetY = this.screenBounds.top;
                break;
            case 'bottom':
                targetX = this.screenBounds.left + Math.random() * (this.screenBounds.right - this.screenBounds.left);
                targetY = this.screenBounds.bottom;
                break;
            case 'left':
                targetX = this.screenBounds.left;
                targetY = this.screenBounds.top + Math.random() * (this.screenBounds.bottom - this.screenBounds.top);
                break;
            case 'right':
                targetX = this.screenBounds.right;
                targetY = this.screenBounds.top + Math.random() * (this.screenBounds.bottom - this.screenBounds.top);
                break;
        }

        this.animateToPosition(targetX, targetY, () => {
            this.isMoving = false;
            this.pet.scheduleReturnToDefault();
        });
    }

    animateToPosition(targetX, targetY, callback, duration = 800) {
        const container = this.pet.container;
        const startRect = container.getBoundingClientRect();

        // Set flying state
        this.pet.doAction('flying');

        // Switch to fixed positioning with current coords
        container.style.position = 'fixed';
        container.style.bottom = 'auto';
        container.style.right = 'auto';
        container.style.left = startRect.left + 'px';
        container.style.top = startRect.top + 'px';

        // Animate
        container.style.transition = `left ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1), top ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;

        requestAnimationFrame(() => {
            container.style.left = targetX + 'px';
            container.style.top = targetY + 'px';
        });

        setTimeout(() => {
            this.pet.clearAction();
            container.style.transition = '';
            this.pet.position = { x: targetX, y: targetY };
            if (callback) callback();
        }, duration);
    }

    returnToDefault() {
        const container = this.pet.container;
        if (!container) return;

        // Get current position
        const rect = container.getBoundingClientRect();
        const currentX = rect.left;
        const currentY = rect.top;

        // Calculate target position (bottom-right corner)
        const targetX = window.innerWidth - this.pet.defaultPosition.right - rect.width;
        const targetY = window.innerHeight - this.pet.defaultPosition.bottom - rect.height;

        // Calculate distance
        const deltaX = targetX - currentX;
        const deltaY = targetY - currentY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Determine if short distance (less than 200px = 50% timing)
        const isShortDistance = distance < 200;
        const timeMultiplier = isShortDistance ? 0.5 : 1;

        // Phase durations (in ms): slow start, fast middle, slow end
        const phase1Duration = 500 * timeMultiplier;  // Ease out of current position
        const phase2Duration = 1000 * timeMultiplier; // Cruise speed
        const phase3Duration = 1000 * timeMultiplier; // Ease into target
        const totalDuration = phase1Duration + phase2Duration + phase3Duration;

        // Mark as moving
        this.isMoving = true;
        container.classList.add('returning');

        // Use custom easing animation
        const startTime = performance.now();
        const startX = currentX;
        const startY = currentY;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);

            // Custom easing: slow-fast-slow (sine-based)
            // This creates the effect of: gentle start (0.5s), faster middle (1s), gentle end (1s)
            const eased = this.customReturnEasing(progress, timeMultiplier);

            const newX = startX + deltaX * eased;
            const newY = startY + deltaY * eased;

            container.style.left = newX + 'px';
            container.style.top = newY + 'px';

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete - reset to default positioning
                container.classList.remove('returning');
                container.style.transition = '';
                container.style.left = '';
                container.style.top = '';
                container.style.bottom = this.pet.defaultPosition.bottom + 'px';
                container.style.right = this.pet.defaultPosition.right + 'px';
                container.style.position = 'fixed';
                this.pet.position = { x: null, y: null };
                this.isMoving = false;
            }
        };

        requestAnimationFrame(animate);
    }

    // Custom easing for gentle return: slow start (20%), fast middle (40%), slow end (40%)
    customReturnEasing(t, timeMultiplier = 1) {
        // Phase boundaries (normalized to 0-1)
        const p1End = 0.2;  // First 20% of time: slow acceleration
        const p2End = 0.6;  // Next 40% of time: fast cruise
        // Remaining 40%: slow deceleration

        if (t <= p1End) {
            // Phase 1: Ease-in (slow start) - cubic ease-in
            const phaseProgress = t / p1End;
            return p1End * 0.15 * (phaseProgress * phaseProgress * phaseProgress);
        } else if (t <= p2End) {
            // Phase 2: Linear-ish (fast middle)
            const phaseProgress = (t - p1End) / (p2End - p1End);
            const startValue = p1End * 0.15;
            const endValue = 0.7;
            return startValue + (endValue - startValue) * phaseProgress;
        } else {
            // Phase 3: Ease-out (slow end) - cubic ease-out
            const phaseProgress = (t - p2End) / (1 - p2End);
            const startValue = 0.7;
            const remaining = 1 - startValue;
            return startValue + remaining * (1 - Math.pow(1 - phaseProgress, 3));
        }
    }

    destroy() {
        if (this.randomMovementInterval) clearTimeout(this.randomMovementInterval);
    }
}

// ============================================
// PetInteractionSystem - Clicks & Drag-drop
// ============================================
class PetInteractionSystem {
    constructor(pet) {
        this.pet = pet;
        this.clickCount = 0;
        this.lastClickTime = 0;
        this.holdStartTime = null;
        this.holdThreshold = 500;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    init() {
        this.bindClickEvents();
        this.bindDragEvents();
    }

    bindClickEvents() {
        const container = this.pet.container;
        let clickTimer = null;

        container.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            this.holdStartTime = Date.now();
        });

        container.addEventListener('mouseup', (e) => {
            if (this.isDragging) return;

            const holdDuration = Date.now() - (this.holdStartTime || Date.now());
            this.holdStartTime = null;

            if (holdDuration >= this.holdThreshold) {
                this.onHoldClick();
                return;
            }

            const now = Date.now();
            if (now - this.lastClickTime < 300) {
                clearTimeout(clickTimer);
                this.onDoubleClick();
                this.clickCount = 0;
            } else {
                clickTimer = setTimeout(() => {
                    this.onSingleClick();
                }, 300);
            }
            this.lastClickTime = now;
        });
    }

    onSingleClick() {
        const actions = ['jump', 'spin360', 'wiggle', 'trick', 'greet', 'blowKiss', 'excited'];
        const action = actions[Math.floor(Math.random() * actions.length)];

        switch (action) {
            case 'jump':
                this.pet.movement.jump();
                this.pet.expression?.smile();
                break;
            case 'spin360':
                this.pet.doAction('spin360');
                this.pet.expression?.excited();
                break;
            case 'trick':
                this.performTrick();
                break;
            case 'greet':
                this.pet.expression?.greet();
                this.pet.doAction('wave');
                break;
            case 'blowKiss':
                this.pet.expression?.blowKiss();
                break;
            case 'excited':
                this.pet.expression?.excited();
                this.pet.movement.jump();
                break;
            default:
                this.pet.doIdleAction('wiggle');
                this.pet.expression?.smile();
        }

        this.pet.playPetSound('happy');
    }

    onDoubleClick() {
        this.pet.movement.flyToRandomPosition();
        this.pet.addEffect('sparkles');
        this.pet.expression?.excited();
        this.pet.expression?.showEmote('stars');
    }

    onHoldClick() {
        this.performSpecialTrick();
    }

    performTrick() {
        const tricks = ['backflip', 'dance', 'wave'];
        const trick = tricks[Math.floor(Math.random() * tricks.length)];
        this.pet.doAction(trick);
        this.pet.addEffect('sparkles');

        // Show expression based on trick
        if (trick === 'wave') {
            this.pet.expression?.greet();
        } else if (trick === 'dance') {
            this.pet.expression?.talk('happy', 2000);
            this.pet.expression?.setExpression('excited', 2000);
        } else {
            this.pet.expression?.excited();
        }
    }

    performSpecialTrick() {
        this.pet.doAction('megaCelebrate');
        this.pet.addEffect('hearts');
        this.pet.addEffect('sparkles');
        this.pet.playPetSound('happy');

        // Special love expression
        this.pet.expression?.love();
        this.pet.expression?.talk('love', 3000);
    }

    bindDragEvents() {
        const container = this.pet.container;

        const startDrag = (clientX, clientY) => {
            this.isDragging = true;
            this.pet.isDragging = true;
            const rect = container.getBoundingClientRect();
            this.dragOffset.x = clientX - rect.left;
            this.dragOffset.y = clientY - rect.top;

            container.setAttribute('data-dragging', 'true');
            this.pet.doAction('grabbed');

            if (this.pet.returnToDefaultTimeout) {
                clearTimeout(this.pet.returnToDefaultTimeout);
            }

            // Terminate peekaboo game if playing
            if (this.pet.hideSystem && this.pet.hideSystem.isPlayingPeekaboo) {
                this.pet.hideSystem.terminatePeekaboo();
            }

            // Wake up from resting if applicable
            if (this.pet.hideSystem && this.pet.hideSystem.isResting) {
                this.pet.hideSystem.wakeUpFromRest();
            }

            // Reset any hide-related styles
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
            container.style.position = 'fixed';
            container.style.bottom = 'auto';
            container.style.right = 'auto';
            container.style.left = rect.left + 'px';
            container.style.top = rect.top + 'px';
            container.style.transition = 'none';
            container.style.zIndex = '2000';
        };

        const moveDrag = (clientX, clientY) => {
            if (!this.isDragging) return;

            const newX = clientX - this.dragOffset.x;
            const newY = clientY - this.dragOffset.y;

            const bounds = this.pet.movement.screenBounds;
            if (bounds) {
                const constrainedX = Math.max(bounds.left, Math.min(bounds.right, newX));
                const constrainedY = Math.max(bounds.top, Math.min(bounds.bottom, newY));
                container.style.left = constrainedX + 'px';
                container.style.top = constrainedY + 'px';
            } else {
                container.style.left = newX + 'px';
                container.style.top = newY + 'px';
            }
        };

        const endDrag = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.pet.isDragging = false;

            container.removeAttribute('data-dragging');
            this.pet.clearAction();
            container.style.zIndex = '1000';
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';

            const rect = container.getBoundingClientRect();
            this.pet.position = { x: rect.left, y: rect.top };

            // Terminate peekaboo if playing
            if (this.pet.hideSystem && this.pet.hideSystem.isPlayingPeekaboo) {
                this.pet.hideSystem.terminatePeekaboo();
            }

            // Wake up from resting state if applicable
            if (this.pet.hideSystem && this.pet.hideSystem.isResting) {
                this.pet.hideSystem.wakeUpFromRest();
            } else if (this.pet.hideSystem && this.pet.hideSystem.isIdleHiding) {
                // Legacy: come out from idle hide
                this.pet.hideSystem.isIdleHiding = false;
            }

            this.pet.scheduleReturnToDefault();
        };

        // Mouse events
        container.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            startDrag(e.clientX, e.clientY);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            moveDrag(e.clientX, e.clientY);
        });

        document.addEventListener('mouseup', endDrag);

        // Touch events
        container.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startDrag(touch.clientX, touch.clientY);
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            const touch = e.touches[0];
            moveDrag(touch.clientX, touch.clientY);
        }, { passive: true });

        document.addEventListener('touchend', endDrag);
    }
}

// ============================================
// PetHideSystem - Hide behind elements with peek-a-boo
// ============================================
class PetHideSystem {
    constructor(pet) {
        this.pet = pet;
        this.hideElements = [
            '.child-navbar',
            '.player-card',
            '.player-card-bg',
            '.avatar-ring',
            '.mission-card',
            '.stats-panel',
            '.trophy-case',
            '.child-bottom-nav'
        ];
        this.currentlyBehind = null;
        this.transparentElements = new Set();

        // Peek-a-boo game state
        this.isPlayingPeekaboo = false;
        this.peekCount = 0;
        this.maxPeeks = 3 + Math.floor(Math.random() * 3); // 3-5 peeks
        this.peekTimeouts = [];
        this.hideElement = null;

        // Idle rest state (pet goes to header and becomes static)
        this.lastInteractionTime = Date.now();
        this.idleRestTimeout = null;
        this.idleThreshold = 60000; // 60 seconds of no interaction
        this.isResting = false;
        this.isIdleHiding = false; // Legacy compatibility
    }

    init() {
        this.setupInteractionTracking();

        if (this.isFirstVisit()) {
            this.startPeekabooGame();
        } else {
            this.startIdleRestTimer();
        }
    }

    isFirstVisit() {
        // Use a session-specific key based on page load time stored in sessionStorage
        // This ensures peek-a-boo plays once per browser session (closes when browser closes)
        // and resets when logging in fresh

        const sessionKey = 'petPeekabooPlayed';
        const loginIndicator = document.referrer;

        // Check if coming from login page - always play peek-a-boo
        if (loginIndicator && loginIndicator.includes('child-login')) {
            sessionStorage.removeItem(sessionKey);
        }

        const played = sessionStorage.getItem(sessionKey);
        if (!played) {
            sessionStorage.setItem(sessionKey, Date.now().toString());
            return true;
        }

        // Also play if it's been more than 1 hour since last play (user probably logged out and back in)
        const lastPlayed = parseInt(played);
        if (Date.now() - lastPlayed > 3600000) { // 1 hour
            sessionStorage.setItem(sessionKey, Date.now().toString());
            return true;
        }

        return false;
    }

    // ========== Interaction Tracking ==========
    setupInteractionTracking() {
        const container = this.pet.container;
        if (!container) return;

        // Track mouse movement near pet
        document.addEventListener('mousemove', (e) => {
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
                Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
            );
            // If mouse is within 150px of pet
            if (distance < 150) {
                this.registerInteraction();
            }
        });

        // Track clicks and drags on pet
        container.addEventListener('mousedown', () => this.registerInteraction());
        container.addEventListener('touchstart', () => this.registerInteraction());
    }

    registerInteraction() {
        this.lastInteractionTime = Date.now();

        // If playing peekaboo and user drags, terminate game
        if (this.isPlayingPeekaboo && this.pet.isDragging) {
            this.terminatePeekaboo();
        }

        // If resting, wake up
        if (this.isResting) {
            this.wakeUpFromRest();
        }

        // Legacy: if idle hiding, come out
        if (this.isIdleHiding) {
            this.comeOutFromIdleHide();
        }

        // Reset idle timer
        this.startIdleRestTimer();
    }

    // ========== Peek-a-boo Game on Login ==========
    startPeekabooGame() {
        const container = this.pet.container;
        if (!container) return;

        this.isPlayingPeekaboo = true;
        this.peekCount = 0;
        this.maxPeeks = 3 + Math.floor(Math.random() * 3);

        // Find the player card to hide behind
        this.hideElement = document.querySelector('.player-card-bg') ||
                          document.querySelector('.player-card') ||
                          document.querySelector('.avatar-ring');

        if (!this.hideElement) {
            // No element to hide behind, just show normally
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
            this.isPlayingPeekaboo = false;
            this.startIdleHideTimer();
            return;
        }

        // Position pet behind the element (completely hidden)
        this.positionBehindElement(this.hideElement, true);

        // Start peek-a-boo after 2-5 seconds
        const initialDelay = 2000 + Math.random() * 3000;
        this.peekTimeouts.push(setTimeout(() => {
            this.doPeek();
        }, initialDelay));
    }

    positionBehindElement(element, hidden = true) {
        const container = this.pet.container;
        const rect = element.getBoundingClientRect();

        // Position behind and slightly below the element center
        container.style.position = 'fixed';
        container.style.left = (rect.left + rect.width / 2 - 50) + 'px';
        container.style.top = (rect.bottom - 40) + 'px';
        container.style.bottom = 'auto';
        container.style.right = 'auto';
        container.style.zIndex = '999'; // Behind the card
        container.style.transition = 'none';

        if (hidden) {
            container.style.opacity = '0';
            container.style.transform = 'scale(0.8) translateY(30px)';
        }
    }

    doPeek() {
        if (!this.isPlayingPeekaboo || this.pet.isDragging) {
            this.terminatePeekaboo();
            return;
        }

        const container = this.pet.container;
        this.peekCount++;

        // Gentle peek out animation
        container.style.transition = 'opacity 0.5s ease-out, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        container.style.opacity = '1';
        container.style.transform = 'scale(1) translateY(-40px)'; // Peek up

        // Play peek sound
        this.pet.playPetSound('peek');

        // Do a peek action
        setTimeout(() => {
            if (!this.isPlayingPeekaboo) return;
            const peekActions = ['look-left', 'look-right', 'look-up', 'wiggle'];
            const action = peekActions[Math.floor(Math.random() * peekActions.length)];
            this.pet.doIdleAction(action);
        }, 300);

        // Hide again after 1.5-3 seconds
        const peekDuration = 1500 + Math.random() * 1500;
        this.peekTimeouts.push(setTimeout(() => {
            if (!this.isPlayingPeekaboo) return;
            this.doHide();
        }, peekDuration));
    }

    doHide() {
        if (!this.isPlayingPeekaboo || this.pet.isDragging) {
            this.terminatePeekaboo();
            return;
        }

        const container = this.pet.container;

        // Gentle hide animation
        container.style.transition = 'opacity 0.4s ease-in, transform 0.6s ease-in';
        container.style.opacity = '0.3';
        container.style.transform = 'scale(0.9) translateY(20px)'; // Slide back down

        // Check if we should do more peeks or finish
        if (this.peekCount >= this.maxPeeks) {
            // Finish the game - go to default position
            this.peekTimeouts.push(setTimeout(() => {
                this.finishPeekaboo();
            }, 800));
        } else {
            // Do another peek after 2-4 seconds
            const hideDelay = 2000 + Math.random() * 2000;
            this.peekTimeouts.push(setTimeout(() => {
                if (this.isPlayingPeekaboo) {
                    this.doPeek();
                }
            }, hideDelay));
        }
    }

    finishPeekaboo() {
        if (!this.isPlayingPeekaboo) return;

        const container = this.pet.container;
        this.isPlayingPeekaboo = false;

        // Final reveal with wave
        container.style.transition = 'opacity 0.5s ease-out, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        container.style.opacity = '1';
        container.style.transform = 'scale(1) translateY(-50px)';
        container.style.zIndex = '1000';

        // Play surprise "boo" sound on final reveal
        this.pet.playPetSound('surprise');

        setTimeout(() => {
            this.pet.doAction('wave');
            this.pet.addEffect('sparkles');
            this.pet.playPetSound('happy');
        }, 300);

        // Then go to default position
        setTimeout(() => {
            container.style.transform = 'scale(1)';
            this.pet.movement.returnToDefault();
            this.startIdleHideTimer();
        }, 1500);
    }

    terminatePeekaboo() {
        this.isPlayingPeekaboo = false;
        this.peekTimeouts.forEach(t => clearTimeout(t));
        this.peekTimeouts = [];

        const container = this.pet.container;
        container.style.opacity = '1';
        container.style.transform = 'scale(1)';
        container.style.zIndex = '1000';

        this.startIdleHideTimer();
    }

    // ========== Idle Rest Behavior (pet goes to header and becomes static) ==========
    startIdleRestTimer() {
        if (this.idleRestTimeout) {
            clearTimeout(this.idleRestTimeout);
        }

        this.idleRestTimeout = setTimeout(() => {
            this.checkIdleRest();
        }, this.idleThreshold);
    }

    checkIdleRest() {
        const timeSinceInteraction = Date.now() - this.lastInteractionTime;

        if (timeSinceInteraction >= this.idleThreshold &&
            !this.pet.isDragging &&
            !this.pet.movement.isMoving &&
            !this.isPlayingPeekaboo &&
            !this.isResting) {
            this.goToRest();
        } else {
            this.startIdleRestTimer();
        }
    }

    goToRest() {
        const header = document.querySelector('.child-navbar');
        if (!header) {
            this.startIdleRestTimer();
            return;
        }

        this.isResting = true;
        this.isIdleHiding = true; // Legacy compatibility

        const container = this.pet.container;
        const headerRect = header.getBoundingClientRect();

        // Target position: top-center of header
        const targetX = headerRect.left + headerRect.width / 2 - 50; // Center horizontally
        const targetY = headerRect.top + 5; // Slightly inside the header top

        // Show sleepy expression before moving
        if (this.pet.expression) {
            this.pet.expression.sleepy();
        }

        // Gentle multi-phase fly to rest spot (slow-fast-slow over 2.5 seconds)
        this.animateToRestPosition(targetX, targetY, () => {
            // Enter rest state - become static
            container.classList.add('pet-resting');

            // Stop all animations and idle behavior
            if (this.pet.idleInterval) {
                clearInterval(this.pet.idleInterval);
            }
            if (this.pet.blinkInterval) {
                clearInterval(this.pet.blinkInterval);
            }

            // Set resting expression
            const petBody = this.pet.petElement?.querySelector('.pet-body');
            if (petBody) {
                petBody.setAttribute('data-state', 'resting');
                petBody.setAttribute('data-expression', 'sleepy');
            }

            container.style.transition = 'none';
            container.style.zIndex = '1001'; // Above header
        });
    }

    // Gentle multi-phase animation for going to rest (slow-fast-slow, 2.5 seconds total)
    animateToRestPosition(targetX, targetY, callback) {
        const container = this.pet.container;
        const startRect = container.getBoundingClientRect();
        const startX = startRect.left;
        const startY = startRect.top;

        // Set flying state
        this.pet.doAction('flying');

        // Switch to fixed positioning
        container.style.position = 'fixed';
        container.style.bottom = 'auto';
        container.style.right = 'auto';
        container.style.left = startX + 'px';
        container.style.top = startY + 'px';
        container.style.transition = 'none';

        // Phase durations: slow start (0.5s), fast middle (1.5s), slow end (0.5s) = 2.5s total
        const phase1Duration = 500;
        const phase2Duration = 1500;
        const phase3Duration = 500;
        const totalDuration = phase1Duration + phase2Duration + phase3Duration;

        const startTime = performance.now();

        // Custom easing: slow-fast-slow
        const customEase = (t) => {
            if (t < 0.2) {
                // Phase 1: slow start (ease-in, 0-20% of time = 0.5s)
                const phase = t / 0.2;
                return 0.1 * (phase * phase); // Quadratic ease-in, covers 10% of distance
            } else if (t < 0.8) {
                // Phase 2: faster middle (linear-ish, 20-80% of time = 1.5s)
                const phase = (t - 0.2) / 0.6;
                return 0.1 + 0.8 * phase; // Linear, covers 80% of distance
            } else {
                // Phase 3: slow end (ease-out, 80-100% of time = 0.5s)
                const phase = (t - 0.8) / 0.2;
                return 0.9 + 0.1 * (1 - Math.pow(1 - phase, 2)); // Quadratic ease-out, covers 10% of distance
            }
        };

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);
            const easedProgress = customEase(progress);

            const currentX = startX + (targetX - startX) * easedProgress;
            const currentY = startY + (targetY - startY) * easedProgress;

            container.style.left = currentX + 'px';
            container.style.top = currentY + 'px';

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.pet.clearAction();
                this.pet.position = { x: targetX, y: targetY };
                if (callback) callback();
            }
        };

        requestAnimationFrame(animate);
    }

    wakeUpFromRest() {
        if (!this.isResting) return;

        this.isResting = false;
        this.isIdleHiding = false;

        const container = this.pet.container;
        container.classList.remove('pet-resting');

        // Wake up expression
        if (this.pet.expression) {
            this.pet.expression.setExpression('surprised', 1000);
            setTimeout(() => {
                this.pet.expression.greet();
            }, 500);
        }

        // Do a little wake-up animation
        this.pet.doAction('wiggle');
        this.pet.playPetSound('surprise');

        // Restore animations
        this.pet.startIdleAnimations();
        this.pet.startBlinking();

        // Clear resting state
        const petBody = this.pet.petElement?.querySelector('.pet-body');
        if (petBody) {
            petBody.removeAttribute('data-state');
            petBody.removeAttribute('data-expression');
        }

        container.style.zIndex = '1000';

        // Schedule return to default position
        this.pet.scheduleReturnToDefault();
    }

    // Legacy methods for backward compatibility
    startIdleHideTimer() {
        this.startIdleRestTimer();
    }

    comeOutFromIdleHide() {
        this.wakeUpFromRest();
    }

    // ========== Legacy methods for compatibility ==========
    randomlyHideBehindElement() {
        if (this.pet.isDragging || this.pet.movement.isMoving || this.isPlayingPeekaboo) return;

        const elements = this.hideElements
            .map(sel => document.querySelector(sel))
            .filter(el => el && this.isElementVisible(el));

        if (elements.length === 0) return;

        const target = elements[Math.floor(Math.random() * elements.length)];
        this.hideBehind(target);
    }

    hideBehind(element) {
        const rect = element.getBoundingClientRect();

        const positions = [
            { x: rect.left - 30, y: rect.top + rect.height / 2 - 60 },
            { x: rect.right - 70, y: rect.top + rect.height / 2 - 60 },
            { x: rect.left + rect.width / 2 - 50, y: rect.top - 30 },
            { x: rect.left + rect.width / 2 - 50, y: rect.bottom - 90 }
        ];

        const pos = positions[Math.floor(Math.random() * positions.length)];

        this.pet.movement.animateToPosition(pos.x, pos.y, () => {
            this.currentlyBehind = element;

            if (Math.random() > 0.5) {
                this.pet.container.style.zIndex = '999';
            } else {
                this.setElementTransparency(element, true);
            }

            this.doPeekBehaviorRandom();
        });
    }

    doPeekBehaviorRandom() {
        const peekActions = ['look-left', 'look-right', 'look-up'];
        const action = peekActions[Math.floor(Math.random() * peekActions.length)];
        this.pet.doIdleAction(action);

        setTimeout(() => {
            this.comeOutFromHiding();
        }, 3000 + Math.random() * 3000);
    }

    comeOutFromHiding() {
        if (this.currentlyBehind) {
            this.setElementTransparency(this.currentlyBehind, false);
        }

        this.pet.container.style.zIndex = '1000';
        this.currentlyBehind = null;

        this.pet.doAction('pop-out');
        this.pet.movement.returnToDefault();
    }

    setElementTransparency(element, transparent) {
        if (transparent) {
            element.style.transition = 'opacity 0.3s';
            element.style.opacity = '0.7';
            element.dataset.petBehind = 'true';
            this.transparentElements.add(element);
        } else {
            element.style.opacity = '';
            delete element.dataset.petBehind;
            this.transparentElements.delete(element);
        }
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0 &&
               rect.left < window.innerWidth && rect.right > 0;
    }

    destroy() {
        this.peekTimeouts.forEach(t => clearTimeout(t));
        this.peekTimeouts = [];
        if (this.idleRestTimeout) {
            clearTimeout(this.idleRestTimeout);
        }
        if (this.pet.container) {
            this.pet.container.classList.remove('pet-resting');
        }
        this.transparentElements.forEach(el => {
            el.style.opacity = '';
            delete el.dataset.petBehind;
        });
        this.transparentElements.clear();
    }
}

// ============================================
// PetWeatherSystem - Mood-based weather
// ============================================
class PetWeatherSystem {
    constructor(pet) {
        this.pet = pet;
        this.currentWeather = null;
        this.weatherContainer = null;
    }

    init() {
        this.createWeatherContainer();
    }

    createWeatherContainer() {
        if (!this.pet.petElement) return;

        this.weatherContainer = document.createElement('div');
        this.weatherContainer.className = 'pet-weather-container';
        this.pet.petElement.appendChild(this.weatherContainer);
    }

    updateForMood(mood) {
        if (!this.weatherContainer) return;

        this.clearWeather();

        switch (mood) {
            case 'happy':
                this.showSunSparkles();
                break;
            case 'sad':
                this.showRainCloud();
                break;
            case 'playful':
                this.showBubbles();
                break;
            case 'sleepy':
                this.showMoonStars();
                break;
        }

        this.currentWeather = mood;
    }

    clearWeather() {
        if (this.weatherContainer) {
            this.weatherContainer.innerHTML = '';
        }
    }

    showSunSparkles() {
        if (!this.weatherContainer) return;
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'weather-sparkle';
            sparkle.style.cssText = `--delay: ${i * 0.3}s; --x: ${(Math.random() - 0.5) * 80}px; --y: ${(Math.random() - 0.5) * 80}px;`;
            sparkle.textContent = '✦';
            this.weatherContainer.appendChild(sparkle);
        }
    }

    showRainCloud() {
        if (!this.weatherContainer) return;
        const cloud = document.createElement('div');
        cloud.className = 'weather-cloud';
        cloud.innerHTML = `
            <div class="cloud-body">☁️</div>
            <div class="raindrops">
                <span style="--delay: 0s">💧</span>
                <span style="--delay: 0.3s">💧</span>
                <span style="--delay: 0.6s">💧</span>
            </div>
        `;
        this.weatherContainer.appendChild(cloud);
    }

    showBubbles() {
        if (!this.weatherContainer) return;
        for (let i = 0; i < 6; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'weather-bubble';
            bubble.style.cssText = `--delay: ${i * 0.4}s; --x: ${(Math.random() - 0.5) * 100}px;`;
            bubble.textContent = Math.random() > 0.5 ? '⭐' : '🫧';
            this.weatherContainer.appendChild(bubble);
        }
    }

    showMoonStars() {
        if (!this.weatherContainer) return;
        const moon = document.createElement('div');
        moon.className = 'weather-moon';
        moon.textContent = '🌙';
        this.weatherContainer.appendChild(moon);

        for (let i = 0; i < 3; i++) {
            const star = document.createElement('div');
            star.className = 'weather-star';
            star.style.cssText = `--delay: ${i * 0.5}s; --x: ${(Math.random() - 0.5) * 60}px; --y: ${-20 - Math.random() * 40}px;`;
            star.textContent = '✨';
            this.weatherContainer.appendChild(star);
        }
    }
}

// ============================================
// PetAffectionSystem - Hearts to avatar
// ============================================
class PetAffectionSystem {
    constructor(pet) {
        this.pet = pet;
        this.heartsInterval = null;
        this.avatarElement = null;
    }

    init() {
        this.avatarElement = document.querySelector('.avatar-ring, .player-avatar, .avatar-img');
        this.startHeartsTimer();
    }

    startHeartsTimer() {
        const scheduleNext = () => {
            const min = this.pet.config.heartsInterval?.min || 30000;
            const max = this.pet.config.heartsInterval?.max || 60000;
            let delay = min + Math.random() * (max - min);

            // More frequent when active
            if (this.pet.mood && this.pet.mood.activityLevel > 2) {
                delay *= 0.5;
            }

            this.heartsInterval = setTimeout(() => {
                this.sendHeartsToAvatar();
                scheduleNext();
            }, delay);
        };

        scheduleNext();
    }

    sendHeartsToAvatar() {
        if (!this.avatarElement || this.pet.isDragging) return;

        const petRect = this.pet.container.getBoundingClientRect();
        const avatarRect = this.avatarElement.getBoundingClientRect();

        const heartCount = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                this.createFloatingHeart(
                    petRect.left + petRect.width / 2,
                    petRect.top + 20,
                    avatarRect.left + avatarRect.width / 2,
                    avatarRect.top + avatarRect.height / 2
                );
            }, i * 150);
        }

        this.pet.doAction('blow-kiss');
    }

    createFloatingHeart(startX, startY, endX, endY) {
        const heart = document.createElement('div');
        heart.className = 'pet-floating-heart';
        heart.textContent = Math.random() > 0.3 ? '❤️' : '💕';
        heart.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            font-size: 20px;
            pointer-events: none;
            z-index: 1001;
            --endX: ${endX - startX}px;
            --endY: ${endY - startY}px;
        `;

        document.body.appendChild(heart);

        requestAnimationFrame(() => {
            heart.classList.add('floating');
        });

        setTimeout(() => heart.remove(), 1500);
    }

    destroy() {
        if (this.heartsInterval) clearTimeout(this.heartsInterval);
    }
}

// ============================================
// Main PetMascot Class
// ============================================
class PetMascot {
    constructor(options = {}) {
        this.creature = options.creature || 'dragon';
        this.skin = options.skin || 'default';
        this.enabled = options.enabled !== false;
        this.container = null;
        this.petElement = null;
        this.currentState = 'idle';
        this.stateTimeout = null;
        this.idleInterval = null;
        this.blinkInterval = null;

        // Position tracking
        this.position = { x: null, y: null };
        this.defaultPosition = { bottom: 20, right: 20 };
        this.isDragging = false;
        this.returnToDefaultTimeout = null;

        // Configuration
        this.config = {
            returnToDefaultDelay: 7000,
            heartsInterval: { min: 30000, max: 60000 },
            ...options.config
        };

        // Skin color palettes
        this.skinColors = {
            default: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#c4b5fd', eye: '#1e1b4b' },
            pink: { primary: '#ec4899', secondary: '#f472b6', accent: '#fbcfe8', eye: '#831843' },
            blue: { primary: '#3b82f6', secondary: '#60a5fa', accent: '#bfdbfe', eye: '#1e3a8a' },
            gold: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#fde68a', eye: '#78350f' },
            purple: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#ddd6fe', eye: '#4c1d95' },
            green: { primary: '#10b981', secondary: '#34d399', accent: '#a7f3d0', eye: '#064e3b' },
            red: { primary: '#ef4444', secondary: '#f87171', accent: '#fecaca', eye: '#7f1d1d' }
        };

        // Initialize sub-systems
        this.mood = new PetMoodSystem(this);
        this.expression = new PetExpressionSystem(this);
        this.movement = new PetMovementSystem(this);
        this.interaction = new PetInteractionSystem(this);
        this.hideSystem = new PetHideSystem(this);
        this.weather = new PetWeatherSystem(this);
        this.affection = new PetAffectionSystem(this);

        if (this.enabled) {
            this.init();
        }
    }

    init() {
        this.createContainer();
        this.renderPet();
        this.startIdleAnimations();
        this.bindEvents();

        // Initialize sub-systems (weather before mood since mood triggers weather updates)
        this.weather.init();
        this.mood.init();
        this.expression.init();
        this.movement.init();
        this.interaction.init();
        this.affection.init();
        this.hideSystem.init();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'pet-mascot-container';
        this.container.setAttribute('data-creature', this.creature);
        this.container.setAttribute('data-skin', this.skin);
        this.container.setAttribute('data-mood', 'happy');
        document.body.appendChild(this.container);
    }

    getColors() {
        return this.skinColors[this.skin] || this.skinColors.default;
    }

    renderPet() {
        const colors = this.getColors();
        const svgContent = this.getCreatureSVG(this.creature, colors);

        this.petElement = document.createElement('div');
        this.petElement.className = 'pet-creature';
        this.petElement.innerHTML = `
            <div class="pet-shadow"></div>
            <div class="pet-body" data-state="idle">
                ${svgContent}
            </div>
            <div class="pet-effects"></div>
        `;

        this.container.appendChild(this.petElement);
    }

    getCreatureSVG(creature, colors) {
        const creatures = {
            dragon: this.getDragonSVG(colors),
            unicorn: this.getUnicornSVG(colors),
            phoenix: this.getPhoenixSVG(colors),
            cat: this.getCatSVG(colors),
            owl: this.getOwlSVG(colors),
            bunny: this.getBunnySVG(colors),
            fox: this.getFoxSVG(colors),
            panda: this.getPandaSVG(colors),
            penguin: this.getPenguinSVG(colors),
            butterfly: this.getButterflySVG(colors)
        };
        return creatures[creature] || creatures.dragon;
    }

    getDragonSVG(c) {
        return `
        <svg viewBox="0 0 100 100" class="pet-svg">
            <ellipse cx="50" cy="60" rx="25" ry="20" fill="${c.primary}"/>
            <ellipse cx="50" cy="65" rx="15" ry="12" fill="${c.accent}"/>
            <circle cx="50" cy="35" r="18" fill="${c.primary}"/>
            <!-- Snout -->
            <ellipse cx="50" cy="42" rx="8" ry="5" fill="${c.secondary}"/>
            <!-- Nostrils -->
            <circle cx="47" cy="41" r="1.5" fill="${c.eye}"/>
            <circle cx="53" cy="41" r="1.5" fill="${c.eye}"/>
            <!-- Eye whites -->
            <ellipse cx="42" cy="32" rx="5" ry="6" fill="white" class="pet-eye-white pet-eye-white-left"/>
            <ellipse cx="58" cy="32" rx="5" ry="6" fill="white" class="pet-eye-white pet-eye-white-right"/>
            <!-- Pupils -->
            <circle cx="43" cy="33" r="3" fill="${c.eye}" class="pet-pupil pet-pupil-left"/>
            <circle cx="59" cy="33" r="3" fill="${c.eye}" class="pet-pupil pet-pupil-right"/>
            <!-- Eye shine -->
            <circle cx="44" cy="31" r="1" fill="white" class="pet-eye-shine"/>
            <circle cx="60" cy="31" r="1" fill="white" class="pet-eye-shine"/>
            <!-- Happy eyes (hidden by default) -->
            <path d="M38 33 Q42 29 46 33" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-left"/>
            <path d="M54 33 Q58 29 62 33" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-right"/>
            <!-- Heart eyes (hidden by default) -->
            <path d="M40 30 C38 28 35 30 40 35 C45 30 42 28 40 30" fill="#ec4899" class="pet-heart-eye pet-heart-eye-left"/>
            <path d="M60 30 C58 28 55 30 60 35 C65 30 62 28 60 30" fill="#ec4899" class="pet-heart-eye pet-heart-eye-right"/>
            <!-- Blush cheeks -->
            <ellipse cx="32" cy="38" rx="5" ry="3" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-left"/>
            <ellipse cx="68" cy="38" rx="5" ry="3" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-right"/>
            <!-- Mouth expressions -->
            <g class="pet-mouth-group">
                <!-- Neutral/smile mouth -->
                <path d="M46 46 Q50 49 54 46" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-neutral"/>
                <!-- Happy/big smile -->
                <path d="M44 45 Q50 52 56 45" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-mouth pet-mouth-smile"/>
                <!-- Open mouth (talking/surprised) -->
                <ellipse cx="50" cy="47" rx="4" ry="3" fill="${c.eye}" class="pet-mouth pet-mouth-open"/>
                <!-- Sad mouth -->
                <path d="M46 48 Q50 44 54 48" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-sad"/>
                <!-- Kiss/pucker mouth -->
                <circle cx="50" cy="47" r="2" fill="#ec4899" class="pet-mouth pet-mouth-kiss"/>
            </g>
            <!-- Horns -->
            <path d="M35 22 L30 8 L38 20 Z" fill="${c.secondary}"/>
            <path d="M65 22 L70 8 L62 20 Z" fill="${c.secondary}"/>
            <!-- Wings -->
            <path d="M25 50 Q5 35 15 55 Q10 60 25 60 Z" fill="${c.secondary}" class="pet-wing pet-wing-left"/>
            <path d="M75 50 Q95 35 85 55 Q90 60 75 60 Z" fill="${c.secondary}" class="pet-wing pet-wing-right"/>
            <!-- Tail -->
            <path d="M70 70 Q85 75 90 65 Q95 60 88 58" fill="none" stroke="${c.primary}" stroke-width="6" stroke-linecap="round" class="pet-tail"/>
            <!-- Head crest -->
            <path d="M42 20 L50 12 L58 20" fill="${c.secondary}"/>
            <!-- Feet -->
            <ellipse cx="38" cy="78" rx="8" ry="4" fill="${c.secondary}"/>
            <ellipse cx="62" cy="78" rx="8" ry="4" fill="${c.secondary}"/>
            <!-- Eyelids -->
            <rect x="37" y="26" width="10" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-left"/>
            <rect x="53" y="26" width="10" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-right"/>
        </svg>`;
    }

    getUnicornSVG(c) {
        return `
        <svg viewBox="0 0 100 100" class="pet-svg">
            <ellipse cx="50" cy="62" rx="22" ry="18" fill="${c.primary}"/>
            <ellipse cx="50" cy="35" rx="16" ry="14" fill="${c.primary}"/>
            <ellipse cx="50" cy="42" rx="8" ry="6" fill="${c.accent}"/>
            <!-- Horn -->
            <path d="M50 10 L46 25 L54 25 Z" fill="${c.secondary}">
                <animate attributeName="fill" values="${c.secondary};${c.accent};${c.secondary}" dur="2s" repeatCount="indefinite"/>
            </path>
            <path d="M48 24 L50 18 M50 21 L52 15" stroke="${c.accent}" stroke-width="1" fill="none"/>
            <!-- Eye whites -->
            <ellipse cx="42" cy="33" rx="4" ry="5" fill="white" class="pet-eye-white pet-eye-white-left"/>
            <ellipse cx="58" cy="33" rx="4" ry="5" fill="white" class="pet-eye-white pet-eye-white-right"/>
            <!-- Pupils -->
            <circle cx="43" cy="34" r="2.5" fill="${c.eye}" class="pet-pupil pet-pupil-left"/>
            <circle cx="59" cy="34" r="2.5" fill="${c.eye}" class="pet-pupil pet-pupil-right"/>
            <!-- Eye shine -->
            <circle cx="44" cy="32" r="1" fill="white" class="pet-eye-shine"/>
            <circle cx="60" cy="32" r="1" fill="white" class="pet-eye-shine"/>
            <!-- Happy eyes -->
            <path d="M38 34 Q42 30 46 34" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-left"/>
            <path d="M54 34 Q58 30 62 34" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-right"/>
            <!-- Heart eyes -->
            <path d="M41 31 C39 29 36 31 41 36 C46 31 43 29 41 31" fill="#ec4899" class="pet-heart-eye pet-heart-eye-left"/>
            <path d="M59 31 C57 29 54 31 59 36 C64 31 61 29 59 31" fill="#ec4899" class="pet-heart-eye pet-heart-eye-right"/>
            <!-- Blush cheeks -->
            <ellipse cx="32" cy="40" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-left"/>
            <ellipse cx="68" cy="40" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-right"/>
            <!-- Mouth expressions -->
            <g class="pet-mouth-group">
                <path d="M46 46 Q50 49 54 46" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-neutral"/>
                <path d="M44 45 Q50 52 56 45" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-mouth pet-mouth-smile"/>
                <ellipse cx="50" cy="47" rx="3" ry="2.5" fill="${c.eye}" class="pet-mouth pet-mouth-open"/>
                <path d="M46 48 Q50 44 54 48" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-sad"/>
                <circle cx="50" cy="47" r="2" fill="#ec4899" class="pet-mouth pet-mouth-kiss"/>
            </g>
            <!-- Ears -->
            <path d="M35 25 L30 12 L40 22 Z" fill="${c.primary}"/>
            <path d="M65 25 L70 12 L60 22 Z" fill="${c.primary}"/>
            <path d="M36 23 L33 15 L39 21 Z" fill="${c.accent}"/>
            <path d="M64 23 L67 15 L61 21 Z" fill="${c.accent}"/>
            <!-- Mane -->
            <path d="M35 30 Q25 35 30 50 Q28 55 35 55" fill="${c.secondary}" class="pet-mane"/>
            <path d="M32 35 Q22 40 27 52" fill="${c.accent}" class="pet-mane"/>
            <!-- Legs -->
            <rect x="35" y="72" width="6" height="12" rx="3" fill="${c.primary}"/>
            <rect x="59" y="72" width="6" height="12" rx="3" fill="${c.primary}"/>
            <rect x="35" y="82" width="6" height="3" rx="1" fill="${c.secondary}"/>
            <rect x="59" y="82" width="6" height="3" rx="1" fill="${c.secondary}"/>
            <!-- Tail -->
            <path d="M72 62 Q85 55 80 70 Q90 75 78 80" fill="${c.secondary}" class="pet-tail"/>
            <!-- Eyelids -->
            <rect x="38" y="28" width="8" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-left"/>
            <rect x="54" y="28" width="8" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-right"/>
        </svg>`;
    }

    getPhoenixSVG(c) {
        return `
        <svg viewBox="0 0 100 100" class="pet-svg">
            <ellipse cx="50" cy="55" rx="18" ry="22" fill="${c.primary}"/>
            <ellipse cx="50" cy="58" rx="12" ry="15" fill="${c.accent}"/>
            <circle cx="50" cy="28" r="14" fill="${c.primary}"/>
            <!-- Beak -->
            <path d="M50 35 L45 42 L50 40 L55 42 Z" fill="${c.secondary}"/>
            <!-- Eye whites -->
            <ellipse cx="43" cy="26" rx="4" ry="5" fill="white" class="pet-eye-white pet-eye-white-left"/>
            <ellipse cx="57" cy="26" rx="4" ry="5" fill="white" class="pet-eye-white pet-eye-white-right"/>
            <!-- Pupils -->
            <circle cx="44" cy="27" r="2.5" fill="${c.eye}" class="pet-pupil pet-pupil-left"/>
            <circle cx="58" cy="27" r="2.5" fill="${c.eye}" class="pet-pupil pet-pupil-right"/>
            <!-- Eye shine -->
            <circle cx="45" cy="25" r="1" fill="white" class="pet-eye-shine"/>
            <circle cx="59" cy="25" r="1" fill="white" class="pet-eye-shine"/>
            <!-- Happy eyes -->
            <path d="M39 27 Q43 23 47 27" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-left"/>
            <path d="M53 27 Q57 23 61 27" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-right"/>
            <!-- Heart eyes -->
            <path d="M42 24 C40 22 37 24 42 29 C47 24 44 22 42 24" fill="#ec4899" class="pet-heart-eye pet-heart-eye-left"/>
            <path d="M58 24 C56 22 53 24 58 29 C63 24 60 22 58 24" fill="#ec4899" class="pet-heart-eye pet-heart-eye-right"/>
            <!-- Blush cheeks -->
            <ellipse cx="33" cy="32" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-left"/>
            <ellipse cx="67" cy="32" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-right"/>
            <!-- Mouth expressions (below beak) -->
            <g class="pet-mouth-group" transform="translate(0, -3)">
                <path d="M47 46 Q50 48 53 46" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-neutral"/>
                <path d="M45 45 Q50 51 55 45" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-mouth pet-mouth-smile"/>
                <ellipse cx="50" cy="46" rx="3" ry="2" fill="${c.eye}" class="pet-mouth pet-mouth-open"/>
                <path d="M47 47 Q50 44 53 47" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-sad"/>
                <circle cx="50" cy="46" r="2" fill="#ec4899" class="pet-mouth pet-mouth-kiss"/>
            </g>
            <!-- Head crest -->
            <path d="M42 18 Q35 5 45 15" fill="${c.secondary}" class="pet-crest"/>
            <path d="M50 15 Q50 0 55 12" fill="${c.secondary}" class="pet-crest"/>
            <path d="M58 18 Q65 5 55 15" fill="${c.secondary}" class="pet-crest"/>
            <!-- Wings -->
            <path d="M32 45 Q10 30 15 50 Q5 55 20 65 Q15 70 32 65 Z" fill="${c.secondary}" class="pet-wing pet-wing-left">
                <animate attributeName="d" dur="0.5s" repeatCount="indefinite"
                    values="M32 45 Q10 30 15 50 Q5 55 20 65 Q15 70 32 65 Z;
                            M32 45 Q15 25 18 48 Q8 52 22 62 Q18 68 32 65 Z;
                            M32 45 Q10 30 15 50 Q5 55 20 65 Q15 70 32 65 Z"/>
            </path>
            <path d="M68 45 Q90 30 85 50 Q95 55 80 65 Q85 70 68 65 Z" fill="${c.secondary}" class="pet-wing pet-wing-right">
                <animate attributeName="d" dur="0.5s" repeatCount="indefinite"
                    values="M68 45 Q90 30 85 50 Q95 55 80 65 Q85 70 68 65 Z;
                            M68 45 Q85 25 82 48 Q92 52 78 62 Q82 68 68 65 Z;
                            M68 45 Q90 30 85 50 Q95 55 80 65 Q85 70 68 65 Z"/>
            </path>
            <!-- Tail feathers -->
            <path d="M45 75 Q40 95 35 90" fill="${c.secondary}" class="pet-tail-feather"/>
            <path d="M50 77 Q50 100 50 95" fill="${c.primary}" class="pet-tail-feather"/>
            <path d="M55 75 Q60 95 65 90" fill="${c.secondary}" class="pet-tail-feather"/>
            <!-- Feet -->
            <path d="M42 72 L40 82 M42 72 L42 83 M42 72 L45 82" stroke="${c.secondary}" stroke-width="2" stroke-linecap="round"/>
            <path d="M58 72 L55 82 M58 72 L58 83 M58 72 L60 82" stroke="${c.secondary}" stroke-width="2" stroke-linecap="round"/>
            <!-- Fire glow -->
            <ellipse cx="50" cy="55" rx="22" ry="26" fill="url(#fireGlow)" opacity="0.3"/>
            <defs>
                <radialGradient id="fireGlow">
                    <stop offset="0%" stop-color="${c.accent}"/>
                    <stop offset="100%" stop-color="transparent"/>
                </radialGradient>
            </defs>
            <!-- Eyelids -->
            <rect x="39" y="21" width="8" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-left"/>
            <rect x="53" y="21" width="8" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-right"/>
        </svg>`;
    }

    getCatSVG(c) {
        return `
        <svg viewBox="0 0 100 100" class="pet-svg">
            <ellipse cx="50" cy="65" rx="22" ry="18" fill="${c.primary}"/>
            <circle cx="50" cy="38" r="18" fill="${c.primary}"/>
            <!-- Ears -->
            <path d="M32 30 L28 10 L42 25 Z" fill="${c.primary}"/>
            <path d="M68 30 L72 10 L58 25 Z" fill="${c.primary}"/>
            <path d="M34 28 L32 15 L42 24 Z" fill="${c.accent}"/>
            <path d="M66 28 L68 15 L58 24 Z" fill="${c.accent}"/>
            <!-- Muzzle -->
            <ellipse cx="50" cy="42" rx="10" ry="7" fill="${c.accent}"/>
            <!-- Eye whites -->
            <ellipse cx="40" cy="35" rx="5" ry="6" fill="white" class="pet-eye-white pet-eye-white-left"/>
            <ellipse cx="60" cy="35" rx="5" ry="6" fill="white" class="pet-eye-white pet-eye-white-right"/>
            <!-- Pupils (cat-style vertical) -->
            <ellipse cx="41" cy="36" rx="3" ry="4" fill="${c.eye}" class="pet-pupil pet-pupil-left"/>
            <ellipse cx="61" cy="36" rx="3" ry="4" fill="${c.eye}" class="pet-pupil pet-pupil-right"/>
            <!-- Eye shine -->
            <circle cx="42" cy="34" r="1.5" fill="white" class="pet-eye-shine"/>
            <circle cx="62" cy="34" r="1.5" fill="white" class="pet-eye-shine"/>
            <!-- Happy eyes -->
            <path d="M36 36 Q40 31 44 36" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-left"/>
            <path d="M56 36 Q60 31 64 36" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-right"/>
            <!-- Heart eyes -->
            <path d="M39 33 C37 31 34 33 39 38 C44 33 41 31 39 33" fill="#ec4899" class="pet-heart-eye pet-heart-eye-left"/>
            <path d="M61 33 C59 31 56 33 61 38 C66 33 63 31 61 33" fill="#ec4899" class="pet-heart-eye pet-heart-eye-right"/>
            <!-- Blush cheeks -->
            <ellipse cx="28" cy="42" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-left"/>
            <ellipse cx="72" cy="42" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-right"/>
            <!-- Nose -->
            <path d="M50 42 L47 46 L53 46 Z" fill="${c.secondary}"/>
            <!-- Mouth expressions -->
            <g class="pet-mouth-group">
                <g class="pet-mouth pet-mouth-neutral">
                    <path d="M50 46 Q45 50 42 48" fill="none" stroke="${c.eye}" stroke-width="1.5"/>
                    <path d="M50 46 Q55 50 58 48" fill="none" stroke="${c.eye}" stroke-width="1.5"/>
                </g>
                <g class="pet-mouth pet-mouth-smile">
                    <path d="M50 46 Q43 54 40 50" fill="none" stroke="${c.eye}" stroke-width="2"/>
                    <path d="M50 46 Q57 54 60 50" fill="none" stroke="${c.eye}" stroke-width="2"/>
                </g>
                <ellipse cx="50" cy="49" rx="3" ry="2.5" fill="${c.eye}" class="pet-mouth pet-mouth-open"/>
                <path d="M45 50 Q50 46 55 50" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-sad"/>
                <circle cx="50" cy="48" r="2" fill="#ec4899" class="pet-mouth pet-mouth-kiss"/>
            </g>
            <!-- Whiskers -->
            <line x1="30" y1="42" x2="42" y2="44" stroke="${c.secondary}" stroke-width="1" class="pet-whisker"/>
            <line x1="28" y1="46" x2="42" y2="46" stroke="${c.secondary}" stroke-width="1" class="pet-whisker"/>
            <line x1="30" y1="50" x2="42" y2="48" stroke="${c.secondary}" stroke-width="1" class="pet-whisker"/>
            <line x1="70" y1="42" x2="58" y2="44" stroke="${c.secondary}" stroke-width="1" class="pet-whisker"/>
            <line x1="72" y1="46" x2="58" y2="46" stroke="${c.secondary}" stroke-width="1" class="pet-whisker"/>
            <line x1="70" y1="50" x2="58" y2="48" stroke="${c.secondary}" stroke-width="1" class="pet-whisker"/>
            <!-- Paws -->
            <ellipse cx="35" cy="80" rx="8" ry="5" fill="${c.primary}"/>
            <ellipse cx="65" cy="80" rx="8" ry="5" fill="${c.primary}"/>
            <circle cx="35" cy="81" r="2" fill="${c.accent}"/>
            <circle cx="65" cy="81" r="2" fill="${c.accent}"/>
            <!-- Tail -->
            <path d="M72 65 Q90 60 85 45 Q92 40 88 35" fill="none" stroke="${c.primary}" stroke-width="8" stroke-linecap="round" class="pet-tail"/>
            <!-- Eyelids -->
            <rect x="35" y="29" width="10" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-left"/>
            <rect x="55" y="29" width="10" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-right"/>
        </svg>`;
    }

    getOwlSVG(c) {
        return `
        <svg viewBox="0 0 100 100" class="pet-svg">
            <ellipse cx="50" cy="62" rx="22" ry="20" fill="${c.primary}"/>
            <ellipse cx="50" cy="65" rx="15" ry="14" fill="${c.accent}"/>
            <!-- Chest feathers -->
            <path d="M40 55 Q50 58 60 55 Q55 62 50 65 Q45 62 40 55" fill="${c.secondary}"/>
            <!-- Head -->
            <circle cx="50" cy="32" r="20" fill="${c.primary}"/>
            <!-- Ear tufts -->
            <path d="M32 22 L25 8 L38 18 Z" fill="${c.primary}"/>
            <path d="M68 22 L75 8 L62 18 Z" fill="${c.primary}"/>
            <!-- Face disk -->
            <circle cx="50" cy="34" r="15" fill="${c.accent}"/>
            <!-- Eye whites (big owl eyes) -->
            <circle cx="42" cy="32" r="8" fill="white" class="pet-eye-white pet-eye-white-left"/>
            <circle cx="58" cy="32" r="8" fill="white" class="pet-eye-white pet-eye-white-right"/>
            <!-- Pupils -->
            <circle cx="42" cy="32" r="5" fill="${c.eye}" class="pet-pupil pet-pupil-left"/>
            <circle cx="58" cy="32" r="5" fill="${c.eye}" class="pet-pupil pet-pupil-right"/>
            <!-- Eye shine -->
            <circle cx="44" cy="30" r="2" fill="white" class="pet-eye-shine"/>
            <circle cx="60" cy="30" r="2" fill="white" class="pet-eye-shine"/>
            <!-- Happy eyes -->
            <path d="M34 33 Q42 27 50 33" fill="none" stroke="${c.eye}" stroke-width="2.5" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-left"/>
            <path d="M50 33 Q58 27 66 33" fill="none" stroke="${c.eye}" stroke-width="2.5" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-right"/>
            <!-- Heart eyes -->
            <path d="M41 29 C38 26 34 29 41 36 C48 29 44 26 41 29" fill="#ec4899" class="pet-heart-eye pet-heart-eye-left"/>
            <path d="M59 29 C56 26 52 29 59 36 C66 29 62 26 59 29" fill="#ec4899" class="pet-heart-eye pet-heart-eye-right"/>
            <!-- Blush cheeks -->
            <ellipse cx="28" cy="38" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-left"/>
            <ellipse cx="72" cy="38" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-right"/>
            <!-- Beak -->
            <path d="M50 38 L46 45 L50 43 L54 45 Z" fill="${c.secondary}"/>
            <!-- Mouth expressions (below beak) -->
            <g class="pet-mouth-group" transform="translate(0, 2)">
                <path d="M47 46 Q50 48 53 46" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-neutral"/>
                <path d="M45 45 Q50 51 55 45" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-mouth pet-mouth-smile"/>
                <ellipse cx="50" cy="46" rx="3" ry="2" fill="${c.eye}" class="pet-mouth pet-mouth-open"/>
                <path d="M47 48 Q50 45 53 48" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-sad"/>
                <circle cx="50" cy="47" r="2" fill="#ec4899" class="pet-mouth pet-mouth-kiss"/>
            </g>
            <!-- Wings -->
            <path d="M28 55 Q15 50 20 70 Q18 78 30 75 Z" fill="${c.secondary}" class="pet-wing pet-wing-left"/>
            <path d="M72 55 Q85 50 80 70 Q82 78 70 75 Z" fill="${c.secondary}" class="pet-wing pet-wing-right"/>
            <!-- Feet -->
            <path d="M40 80 L35 88 M40 80 L40 88 M40 80 L45 88" stroke="${c.secondary}" stroke-width="3" stroke-linecap="round"/>
            <path d="M60 80 L55 88 M60 80 L60 88 M60 80 L65 88" stroke="${c.secondary}" stroke-width="3" stroke-linecap="round"/>
            <!-- Eyelids -->
            <rect x="34" y="24" width="16" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-left"/>
            <rect x="50" y="24" width="16" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-right"/>
        </svg>`;
    }

    getBunnySVG(c) {
        return `
        <svg viewBox="0 0 100 100" class="pet-svg">
            <!-- Body -->
            <ellipse cx="50" cy="68" rx="22" ry="18" fill="${c.primary}"/>
            <ellipse cx="50" cy="72" rx="16" ry="12" fill="${c.accent}"/>
            <!-- Head -->
            <circle cx="50" cy="40" r="18" fill="${c.primary}"/>
            <!-- Long ears -->
            <ellipse cx="38" cy="15" rx="6" ry="20" fill="${c.primary}" class="pet-ear-left"/>
            <ellipse cx="38" cy="15" rx="3" ry="15" fill="${c.accent}"/>
            <ellipse cx="62" cy="15" rx="6" ry="20" fill="${c.primary}" class="pet-ear-right"/>
            <ellipse cx="62" cy="15" rx="3" ry="15" fill="${c.accent}"/>
            <!-- Face -->
            <ellipse cx="50" cy="48" rx="8" ry="6" fill="${c.accent}"/>
            <!-- Eye whites -->
            <ellipse cx="42" cy="38" rx="5" ry="6" fill="white" class="pet-eye-white pet-eye-white-left"/>
            <ellipse cx="58" cy="38" rx="5" ry="6" fill="white" class="pet-eye-white pet-eye-white-right"/>
            <!-- Pupils -->
            <circle cx="43" cy="39" r="3" fill="${c.eye}" class="pet-pupil pet-pupil-left"/>
            <circle cx="59" cy="39" r="3" fill="${c.eye}" class="pet-pupil pet-pupil-right"/>
            <!-- Eye shine -->
            <circle cx="44" cy="37" r="1.5" fill="white" class="pet-eye-shine"/>
            <circle cx="60" cy="37" r="1.5" fill="white" class="pet-eye-shine"/>
            <!-- Happy eyes -->
            <path d="M38 39 Q42 35 46 39" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-left"/>
            <path d="M54 39 Q58 35 62 39" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-right"/>
            <!-- Heart eyes -->
            <path d="M42 36 C40 34 37 36 42 41 C47 36 44 34 42 36" fill="#ec4899" class="pet-heart-eye pet-heart-eye-left"/>
            <path d="M58 36 C56 34 53 36 58 41 C63 36 60 34 58 36" fill="#ec4899" class="pet-heart-eye pet-heart-eye-right"/>
            <!-- Blush cheeks -->
            <ellipse cx="30" cy="45" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-left"/>
            <ellipse cx="70" cy="45" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-right"/>
            <!-- Nose -->
            <ellipse cx="50" cy="47" rx="3" ry="2" fill="${c.secondary}"/>
            <!-- Mouth expressions -->
            <g class="pet-mouth-group">
                <g class="pet-mouth pet-mouth-neutral">
                    <path d="M50 49 Q46 54 44 52" fill="none" stroke="${c.eye}" stroke-width="1.5"/>
                    <path d="M50 49 Q54 54 56 52" fill="none" stroke="${c.eye}" stroke-width="1.5"/>
                </g>
                <g class="pet-mouth pet-mouth-smile">
                    <path d="M50 49 Q44 56 42 53" fill="none" stroke="${c.eye}" stroke-width="2"/>
                    <path d="M50 49 Q56 56 58 53" fill="none" stroke="${c.eye}" stroke-width="2"/>
                </g>
                <ellipse cx="50" cy="52" rx="3" ry="2.5" fill="${c.eye}" class="pet-mouth pet-mouth-open"/>
                <path d="M46 53 Q50 49 54 53" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-sad"/>
                <circle cx="50" cy="51" r="2" fill="#ec4899" class="pet-mouth pet-mouth-kiss"/>
            </g>
            <!-- Whiskers -->
            <line x1="32" y1="46" x2="42" y2="48" stroke="${c.secondary}" stroke-width="1"/>
            <line x1="32" y1="50" x2="42" y2="50" stroke="${c.secondary}" stroke-width="1"/>
            <line x1="68" y1="46" x2="58" y2="48" stroke="${c.secondary}" stroke-width="1"/>
            <line x1="68" y1="50" x2="58" y2="50" stroke="${c.secondary}" stroke-width="1"/>
            <!-- Feet -->
            <ellipse cx="38" cy="84" rx="10" ry="5" fill="${c.primary}"/>
            <ellipse cx="62" cy="84" rx="10" ry="5" fill="${c.primary}"/>
            <ellipse cx="38" cy="85" rx="6" ry="3" fill="${c.accent}"/>
            <ellipse cx="62" cy="85" rx="6" ry="3" fill="${c.accent}"/>
            <!-- Fluffy tail -->
            <circle cx="72" cy="72" r="8" fill="${c.accent}" class="pet-tail"/>
            <!-- Eyelids -->
            <rect x="37" y="32" width="10" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-left"/>
            <rect x="53" y="32" width="10" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-right"/>
        </svg>`;
    }

    getFoxSVG(c) {
        return `
        <svg viewBox="0 0 100 100" class="pet-svg">
            <!-- Body -->
            <ellipse cx="50" cy="65" rx="20" ry="18" fill="${c.primary}"/>
            <ellipse cx="50" cy="70" rx="12" ry="10" fill="${c.accent}"/>
            <!-- Head -->
            <ellipse cx="50" cy="35" rx="18" ry="16" fill="${c.primary}"/>
            <!-- Pointed ears -->
            <path d="M32 30 L25 8 L40 25 Z" fill="${c.primary}"/>
            <path d="M68 30 L75 8 L60 25 Z" fill="${c.primary}"/>
            <path d="M34 28 L30 14 L40 25 Z" fill="${c.accent}"/>
            <path d="M66 28 L70 14 L60 25 Z" fill="${c.accent}"/>
            <!-- Face mask -->
            <path d="M50 28 Q35 35 40 48 L50 55 L60 48 Q65 35 50 28" fill="${c.accent}"/>
            <!-- Eye whites -->
            <ellipse cx="42" cy="32" rx="4" ry="5" fill="white" class="pet-eye-white pet-eye-white-left"/>
            <ellipse cx="58" cy="32" rx="4" ry="5" fill="white" class="pet-eye-white pet-eye-white-right"/>
            <!-- Pupils (fox-style slightly slit) -->
            <ellipse cx="43" cy="33" rx="2.5" ry="3" fill="${c.eye}" class="pet-pupil pet-pupil-left"/>
            <ellipse cx="59" cy="33" rx="2.5" ry="3" fill="${c.eye}" class="pet-pupil pet-pupil-right"/>
            <!-- Eye shine -->
            <circle cx="44" cy="31" r="1" fill="white" class="pet-eye-shine"/>
            <circle cx="60" cy="31" r="1" fill="white" class="pet-eye-shine"/>
            <!-- Happy eyes -->
            <path d="M38 33 Q42 29 46 33" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-left"/>
            <path d="M54 33 Q58 29 62 33" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-right"/>
            <!-- Heart eyes -->
            <path d="M41 30 C39 28 36 30 41 35 C46 30 43 28 41 30" fill="#ec4899" class="pet-heart-eye pet-heart-eye-left"/>
            <path d="M59 30 C57 28 54 30 59 35 C64 30 61 28 59 30" fill="#ec4899" class="pet-heart-eye pet-heart-eye-right"/>
            <!-- Blush cheeks -->
            <ellipse cx="30" cy="38" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-left"/>
            <ellipse cx="70" cy="38" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-right"/>
            <!-- Nose -->
            <ellipse cx="50" cy="42" rx="4" ry="3" fill="${c.eye}"/>
            <ellipse cx="50" cy="41" rx="2" ry="1" fill="${c.secondary}"/>
            <!-- Mouth expressions -->
            <g class="pet-mouth-group">
                <g class="pet-mouth pet-mouth-neutral">
                    <path d="M50 45 Q46 50 44 48" fill="none" stroke="${c.eye}" stroke-width="1"/>
                    <path d="M50 45 Q54 50 56 48" fill="none" stroke="${c.eye}" stroke-width="1"/>
                </g>
                <g class="pet-mouth pet-mouth-smile">
                    <path d="M50 45 Q44 53 42 50" fill="none" stroke="${c.eye}" stroke-width="1.5"/>
                    <path d="M50 45 Q56 53 58 50" fill="none" stroke="${c.eye}" stroke-width="1.5"/>
                </g>
                <ellipse cx="50" cy="48" rx="3" ry="2.5" fill="${c.eye}" class="pet-mouth pet-mouth-open"/>
                <path d="M46 50 Q50 46 54 50" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-sad"/>
                <circle cx="50" cy="47" r="2" fill="#ec4899" class="pet-mouth pet-mouth-kiss"/>
            </g>
            <!-- Legs -->
            <rect x="35" y="75" width="8" height="12" rx="4" fill="${c.primary}"/>
            <rect x="57" y="75" width="8" height="12" rx="4" fill="${c.primary}"/>
            <ellipse cx="39" cy="86" rx="5" ry="2" fill="${c.eye}"/>
            <ellipse cx="61" cy="86" rx="5" ry="2" fill="${c.eye}"/>
            <!-- Bushy tail -->
            <path d="M70 62 Q95 50 90 65 Q100 70 88 78 Q95 85 75 80" fill="${c.primary}" class="pet-tail"/>
            <path d="M78 72 Q90 70 85 78 Q88 82 76 80" fill="${c.accent}"/>
            <!-- Eyelids -->
            <rect x="38" y="27" width="8" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-left"/>
            <rect x="54" y="27" width="8" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-right"/>
        </svg>`;
    }

    getPandaSVG(c) {
        return `
        <svg viewBox="0 0 100 100" class="pet-svg">
            <!-- Body -->
            <ellipse cx="50" cy="68" rx="24" ry="20" fill="${c.primary}"/>
            <ellipse cx="50" cy="72" rx="16" ry="14" fill="${c.accent}"/>
            <!-- Head -->
            <circle cx="50" cy="35" r="22" fill="${c.primary}"/>
            <!-- Ears with dark patches -->
            <circle cx="30" cy="20" r="10" fill="${c.eye}"/>
            <circle cx="70" cy="20" r="10" fill="${c.eye}"/>
            <!-- Eye patches -->
            <ellipse cx="40" cy="35" rx="10" ry="8" fill="${c.eye}"/>
            <ellipse cx="60" cy="35" rx="10" ry="8" fill="${c.eye}"/>
            <!-- Eye whites -->
            <ellipse cx="40" cy="35" rx="5" ry="6" fill="white" class="pet-eye-white pet-eye-white-left"/>
            <ellipse cx="60" cy="35" rx="5" ry="6" fill="white" class="pet-eye-white pet-eye-white-right"/>
            <!-- Pupils -->
            <circle cx="41" cy="36" r="3" fill="${c.eye}" class="pet-pupil pet-pupil-left"/>
            <circle cx="61" cy="36" r="3" fill="${c.eye}" class="pet-pupil pet-pupil-right"/>
            <!-- Eye shine -->
            <circle cx="42" cy="34" r="1.5" fill="white" class="pet-eye-shine"/>
            <circle cx="62" cy="34" r="1.5" fill="white" class="pet-eye-shine"/>
            <!-- Happy eyes (curved arcs in eye patches) -->
            <path d="M36 36 Q40 31 44 36" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-left"/>
            <path d="M56 36 Q60 31 64 36" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-right"/>
            <!-- Heart eyes -->
            <path d="M39 33 C37 31 34 33 39 38 C44 33 41 31 39 33" fill="#ec4899" class="pet-heart-eye pet-heart-eye-left"/>
            <path d="M61 33 C59 31 56 33 61 38 C66 33 63 31 61 33" fill="#ec4899" class="pet-heart-eye pet-heart-eye-right"/>
            <!-- Blush cheeks (on white fur) -->
            <ellipse cx="26" cy="42" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-left"/>
            <ellipse cx="74" cy="42" rx="4" ry="2.5" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-right"/>
            <!-- Nose -->
            <ellipse cx="50" cy="45" rx="5" ry="3" fill="${c.eye}"/>
            <!-- Mouth expressions -->
            <g class="pet-mouth-group">
                <g class="pet-mouth pet-mouth-neutral">
                    <path d="M50 48 Q45 52 43 50" fill="none" stroke="${c.eye}" stroke-width="1.5"/>
                    <path d="M50 48 Q55 52 57 50" fill="none" stroke="${c.eye}" stroke-width="1.5"/>
                </g>
                <g class="pet-mouth pet-mouth-smile">
                    <path d="M50 48 Q43 55 41 52" fill="none" stroke="${c.eye}" stroke-width="2"/>
                    <path d="M50 48 Q57 55 59 52" fill="none" stroke="${c.eye}" stroke-width="2"/>
                </g>
                <ellipse cx="50" cy="51" rx="4" ry="3" fill="${c.eye}" class="pet-mouth pet-mouth-open"/>
                <path d="M45 53 Q50 49 55 53" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-sad"/>
                <circle cx="50" cy="50" r="2" fill="#ec4899" class="pet-mouth pet-mouth-kiss"/>
            </g>
            <!-- Arms with dark color -->
            <ellipse cx="28" cy="65" rx="8" ry="12" fill="${c.eye}"/>
            <ellipse cx="72" cy="65" rx="8" ry="12" fill="${c.eye}"/>
            <!-- Legs -->
            <ellipse cx="38" cy="85" rx="10" ry="6" fill="${c.eye}"/>
            <ellipse cx="62" cy="85" rx="10" ry="6" fill="${c.eye}"/>
            <!-- Paw pads -->
            <circle cx="38" cy="86" r="3" fill="${c.secondary}"/>
            <circle cx="62" cy="86" r="3" fill="${c.secondary}"/>
            <!-- Eyelids -->
            <rect x="35" y="29" width="10" height="0" fill="${c.eye}" class="pet-eyelid pet-eyelid-left"/>
            <rect x="55" y="29" width="10" height="0" fill="${c.eye}" class="pet-eyelid pet-eyelid-right"/>
        </svg>`;
    }

    getPenguinSVG(c) {
        return `
        <svg viewBox="0 0 100 100" class="pet-svg">
            <!-- Body -->
            <ellipse cx="50" cy="58" rx="22" ry="28" fill="${c.primary}"/>
            <!-- White belly -->
            <ellipse cx="50" cy="62" rx="14" ry="22" fill="${c.accent}"/>
            <!-- Head -->
            <circle cx="50" cy="28" r="18" fill="${c.primary}"/>
            <!-- Face patch -->
            <ellipse cx="50" cy="32" rx="12" ry="10" fill="${c.accent}"/>
            <!-- Eye whites -->
            <ellipse cx="43" cy="28" rx="4" ry="5" fill="white" class="pet-eye-white pet-eye-white-left"/>
            <ellipse cx="57" cy="28" rx="4" ry="5" fill="white" class="pet-eye-white pet-eye-white-right"/>
            <!-- Pupils -->
            <circle cx="44" cy="29" r="2.5" fill="${c.eye}" class="pet-pupil pet-pupil-left"/>
            <circle cx="58" cy="29" r="2.5" fill="${c.eye}" class="pet-pupil pet-pupil-right"/>
            <!-- Eye shine -->
            <circle cx="45" cy="27" r="1" fill="white" class="pet-eye-shine"/>
            <circle cx="59" cy="27" r="1" fill="white" class="pet-eye-shine"/>
            <!-- Happy eyes -->
            <path d="M39 29 Q43 25 47 29" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-left"/>
            <path d="M53 29 Q57 25 61 29" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-right"/>
            <!-- Heart eyes -->
            <path d="M43 26 C41 24 38 26 43 31 C48 26 45 24 43 26" fill="#ec4899" class="pet-heart-eye pet-heart-eye-left"/>
            <path d="M57 26 C55 24 52 26 57 31 C62 26 59 24 57 26" fill="#ec4899" class="pet-heart-eye pet-heart-eye-right"/>
            <!-- Blush cheeks (replaces rosy cheeks) -->
            <circle cx="38" cy="35" r="3" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-left"/>
            <circle cx="62" cy="35" r="3" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-right"/>
            <!-- Beak -->
            <path d="M50 32 L44 38 L50 42 L56 38 Z" fill="${c.secondary}"/>
            <!-- Mouth expressions (below beak) -->
            <g class="pet-mouth-group" transform="translate(0, 3)">
                <path d="M47 44 Q50 46 53 44" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-neutral"/>
                <path d="M45 43 Q50 49 55 43" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round" class="pet-mouth pet-mouth-smile"/>
                <ellipse cx="50" cy="45" rx="3" ry="2" fill="${c.eye}" class="pet-mouth pet-mouth-open"/>
                <path d="M47 46 Q50 43 53 46" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-sad"/>
                <circle cx="50" cy="45" r="2" fill="#ec4899" class="pet-mouth pet-mouth-kiss"/>
            </g>
            <!-- Flippers/wings -->
            <ellipse cx="26" cy="55" rx="6" ry="18" fill="${c.primary}" class="pet-wing pet-wing-left" transform="rotate(-15 26 55)"/>
            <ellipse cx="74" cy="55" rx="6" ry="18" fill="${c.primary}" class="pet-wing pet-wing-right" transform="rotate(15 74 55)"/>
            <!-- Feet -->
            <ellipse cx="40" cy="88" rx="8" ry="4" fill="${c.secondary}"/>
            <ellipse cx="60" cy="88" rx="8" ry="4" fill="${c.secondary}"/>
            <!-- Eyelids -->
            <rect x="39" y="23" width="8" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-left"/>
            <rect x="53" y="23" width="8" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-right"/>
        </svg>`;
    }

    getButterflySVG(c) {
        return `
        <svg viewBox="0 0 100 100" class="pet-svg">
            <!-- Body -->
            <ellipse cx="50" cy="55" rx="5" ry="20" fill="${c.eye}"/>
            <!-- Head -->
            <circle cx="50" cy="30" r="8" fill="${c.primary}"/>
            <!-- Antennae -->
            <path d="M46 24 Q42 12 38 10" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round"/>
            <path d="M54 24 Q58 12 62 10" fill="none" stroke="${c.eye}" stroke-width="2" stroke-linecap="round"/>
            <circle cx="38" cy="10" r="3" fill="${c.secondary}"/>
            <circle cx="62" cy="10" r="3" fill="${c.secondary}"/>
            <!-- Eye whites -->
            <circle cx="46" cy="30" r="3" fill="white" class="pet-eye-white pet-eye-white-left"/>
            <circle cx="54" cy="30" r="3" fill="white" class="pet-eye-white pet-eye-white-right"/>
            <!-- Pupils -->
            <circle cx="47" cy="30" r="2" fill="${c.eye}" class="pet-pupil pet-pupil-left"/>
            <circle cx="55" cy="30" r="2" fill="${c.eye}" class="pet-pupil pet-pupil-right"/>
            <!-- Eye shine -->
            <circle cx="47.5" cy="29" r="0.8" fill="white" class="pet-eye-shine"/>
            <circle cx="55.5" cy="29" r="0.8" fill="white" class="pet-eye-shine"/>
            <!-- Happy eyes (small for butterfly) -->
            <path d="M44 30 Q46 28 48 30" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-left"/>
            <path d="M52 30 Q54 28 56 30" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-happy-eye pet-happy-eye-right"/>
            <!-- Heart eyes (tiny) -->
            <path d="M46 29 C45 28 43.5 29 46 32 C48.5 29 47 28 46 29" fill="#ec4899" class="pet-heart-eye pet-heart-eye-left"/>
            <path d="M54 29 C53 28 51.5 29 54 32 C56.5 29 55 28 54 29" fill="#ec4899" class="pet-heart-eye pet-heart-eye-right"/>
            <!-- Blush -->
            <circle cx="42" cy="32" r="2" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-left"/>
            <circle cx="58" cy="32" r="2" fill="#fca5a5" opacity="0" class="pet-blush pet-blush-right"/>
            <!-- Mouth expressions (tiny for butterfly) -->
            <g class="pet-mouth-group">
                <path d="M48 35 Q50 36 52 35" fill="none" stroke="${c.eye}" stroke-width="1" stroke-linecap="round" class="pet-mouth pet-mouth-neutral"/>
                <path d="M47 34 Q50 38 53 34" fill="none" stroke="${c.eye}" stroke-width="1.5" stroke-linecap="round" class="pet-mouth pet-mouth-smile"/>
                <ellipse cx="50" cy="35" rx="2" ry="1.5" fill="${c.eye}" class="pet-mouth pet-mouth-open"/>
                <path d="M48 36 Q50 34 52 36" fill="none" stroke="${c.eye}" stroke-width="1" stroke-linecap="round" class="pet-mouth pet-mouth-sad"/>
                <circle cx="50" cy="35" r="1.5" fill="#ec4899" class="pet-mouth pet-mouth-kiss"/>
            </g>
            <!-- Upper wings -->
            <ellipse cx="28" cy="42" rx="22" ry="18" fill="${c.primary}" class="pet-wing pet-wing-left">
                <animate attributeName="ry" values="18;16;18" dur="0.5s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="72" cy="42" rx="22" ry="18" fill="${c.primary}" class="pet-wing pet-wing-right">
                <animate attributeName="ry" values="18;16;18" dur="0.5s" repeatCount="indefinite"/>
            </ellipse>
            <!-- Lower wings -->
            <ellipse cx="30" cy="65" rx="18" ry="14" fill="${c.secondary}" class="pet-wing-lower-left">
                <animate attributeName="ry" values="14;12;14" dur="0.5s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="70" cy="65" rx="18" ry="14" fill="${c.secondary}" class="pet-wing-lower-right">
                <animate attributeName="ry" values="14;12;14" dur="0.5s" repeatCount="indefinite"/>
            </ellipse>
            <!-- Wing patterns -->
            <circle cx="25" cy="40" r="8" fill="${c.accent}"/>
            <circle cx="75" cy="40" r="8" fill="${c.accent}"/>
            <circle cx="20" cy="48" r="5" fill="${c.secondary}"/>
            <circle cx="80" cy="48" r="5" fill="${c.secondary}"/>
            <circle cx="28" cy="65" r="6" fill="${c.primary}"/>
            <circle cx="72" cy="65" r="6" fill="${c.primary}"/>
            <!-- Small dots on wings -->
            <circle cx="35" cy="38" r="2" fill="white" opacity="0.6"/>
            <circle cx="65" cy="38" r="2" fill="white" opacity="0.6"/>
            <!-- Eyelids (small for butterfly) -->
            <rect x="43" y="27" width="6" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-left"/>
            <rect x="51" y="27" width="6" height="0" fill="${c.primary}" class="pet-eyelid pet-eyelid-right"/>
        </svg>`;
    }

    startIdleAnimations() {
        this.idleInterval = setInterval(() => {
            if (this.currentState === 'idle' && !this.isDragging) {
                const actions = ['look-left', 'look-right', 'look-up', 'wiggle'];
                const action = actions[Math.floor(Math.random() * actions.length)];
                this.doIdleAction(action);
            }
        }, 3000 + Math.random() * 4000);

        this.blinkInterval = setInterval(() => {
            this.blink();
        }, 3000 + Math.random() * 2000);
    }

    doIdleAction(action) {
        const body = this.petElement?.querySelector('.pet-body');
        if (!body) return;
        body.setAttribute('data-action', action);

        setTimeout(() => {
            body.removeAttribute('data-action');
        }, 800);
    }

    doAction(action) {
        const body = this.petElement?.querySelector('.pet-body');
        if (!body) return;
        body.setAttribute('data-action', action);
    }

    clearAction() {
        const body = this.petElement?.querySelector('.pet-body');
        if (!body) return;
        body.removeAttribute('data-action');
    }

    blink() {
        const eyelids = this.petElement?.querySelectorAll('.pet-eyelid');
        if (!eyelids) return;

        eyelids.forEach(eyelid => {
            eyelid.style.transition = 'height 0.1s ease';
            eyelid.style.height = '12px';
        });

        setTimeout(() => {
            eyelids.forEach(eyelid => {
                eyelid.style.height = '0';
            });
        }, 150);
    }

    setState(state, duration = 2000) {
        if (this.stateTimeout) {
            clearTimeout(this.stateTimeout);
        }

        this.currentState = state;
        const body = this.petElement?.querySelector('.pet-body');
        if (body) {
            body.setAttribute('data-state', state);
        }

        if (state !== 'idle') {
            this.stateTimeout = setTimeout(() => {
                this.setState('idle');
            }, duration);
        }
    }

    scheduleReturnToDefault() {
        if (this.returnToDefaultTimeout) {
            clearTimeout(this.returnToDefaultTimeout);
        }

        this.returnToDefaultTimeout = setTimeout(() => {
            if (!this.isDragging) {
                this.movement.returnToDefault();
            }
        }, this.config.returnToDefaultDelay);
    }

    // Reactive behaviors
    celebrate() {
        this.setState('celebrate', 3000);
        this.addEffect('sparkles');
        this.playPetSound('happy');
    }

    sad() {
        this.setState('sad', 2500);
        this.playPetSound('sad');
        if (this.mood) {
            this.mood.setMood('sad');
            setTimeout(() => this.mood.evaluateMood(), 10000);
        }
    }

    excited() {
        this.setState('excited', 2000);
        this.addEffect('hearts');
    }

    point(direction = 'right') {
        this.setState(`point-${direction}`, 3000);
    }

    sleep() {
        this.setState('sleep', 5000);
        this.addEffect('zzz');
    }

    addEffect(type) {
        const effectsContainer = this.petElement?.querySelector('.pet-effects');
        if (!effectsContainer) return;

        const moodMod = this.mood ? this.mood.getMoodModifier() : { effectIntensity: 1 };
        const count = Math.floor(5 * moodMod.effectIntensity);

        if (type === 'sparkles') {
            for (let i = 0; i < count; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'pet-effect-sparkle';
                sparkle.style.left = `${20 + Math.random() * 60}%`;
                sparkle.style.animationDelay = `${i * 0.1}s`;
                effectsContainer.appendChild(sparkle);
                setTimeout(() => sparkle.remove(), 1000);
            }
        } else if (type === 'hearts') {
            for (let i = 0; i < Math.floor(count * 0.6); i++) {
                const heart = document.createElement('div');
                heart.className = 'pet-effect-heart';
                heart.innerHTML = '<i class="bi bi-heart-fill"></i>';
                heart.style.left = `${30 + Math.random() * 40}%`;
                heart.style.animationDelay = `${i * 0.2}s`;
                effectsContainer.appendChild(heart);
                setTimeout(() => heart.remove(), 1500);
            }
        } else if (type === 'zzz') {
            const zzz = document.createElement('div');
            zzz.className = 'pet-effect-zzz';
            zzz.textContent = 'Zzz';
            effectsContainer.appendChild(zzz);
            setTimeout(() => zzz.remove(), 5000);
        }
    }

    playPetSound(type) {
        if (!window.gameCelebration || !window.gameCelebration.soundEnabled) return;

        try {
            const ctx = window.gameCelebration.initAudio();
            if (!ctx || ctx.state === 'suspended') return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'happy') {
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'sad') {
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            } else if (type === 'surprise' || type === 'boo') {
                // Playful "boo" sound - starts low, rises, then wobbles
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.15);
                osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.25);
                osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.4);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.2);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.5);
            } else if (type === 'peek') {
                // Quick cute peek sound
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.08);
                osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {
            // Ignore audio errors
        }
    }

    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.followMouse(e);
        });
    }

    followMouse(e) {
        if (this.currentState !== 'idle' || this.isDragging) return;

        const rect = this.container?.getBoundingClientRect();
        if (!rect) return;

        const petCenterX = rect.left + rect.width / 2;
        const petCenterY = rect.top + rect.height / 2;

        const deltaX = e.clientX - petCenterX;
        const deltaY = e.clientY - petCenterY;

        const maxMove = 2;
        const moveX = Math.max(-maxMove, Math.min(maxMove, deltaX / 100));
        const moveY = Math.max(-maxMove, Math.min(maxMove, deltaY / 100));

        const pupils = this.petElement?.querySelectorAll('.pet-pupil');
        pupils?.forEach(pupil => {
            pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    }

    // Enhanced event handlers
    onPointsEarned(amount) {
        if (this.mood) this.mood.registerActivity();
        if (amount > 0) {
            this.doAction('bounce');
            this.playPetSound('happy');
            if (this.expression) {
                this.expression.setExpression('excited', 2500);
                this.expression.showEmote('star');
                if (amount >= 50) {
                    this.expression.talk('happy', 3000);
                    this.expression.showBlush(2000);
                }
            }
            if (amount >= 50) {
                setTimeout(() => this.addEffect('sparkles'), 200);
            }
        }
    }

    onPointsLost(amount) {
        if (amount < 0) {
            this.doAction('droop');
            this.sad();
            if (this.expression) {
                this.expression.setExpression('sad', 3000);
                this.expression.talk('sad', 2500);
            }
        }
    }

    onChestAvailable() {
        this.point('up');
        this.excited();
        if (this.expression) {
            this.expression.setExpression('excited', 2000);
            this.expression.showEmote('exclaim');
        }
    }

    onChestOpened() {
        if (this.mood) this.mood.registerActivity();
        this.doAction('megaCelebrate');
        this.addEffect('sparkles');
        this.addEffect('hearts');
        if (this.expression) {
            this.expression.celebrate();
            this.expression.showBlush(2500);
        }
        setTimeout(() => this.movement.jump(), 500);
    }

    onAchievementEarned() {
        if (this.mood) this.mood.registerActivity();
        this.celebrate();
        this.movement.jump();
        if (this.expression) {
            this.expression.setExpression('excited', 3000);
            this.expression.talk('celebrate', 2500);
            this.expression.showEmote('stars');
        }
    }

    onGoalCreated() {
        if (this.mood) this.mood.registerActivity();
        this.excited();
        this.point('up');
        if (this.expression) {
            this.expression.setExpression('smile', 2500);
            this.expression.talk('encourage', 2000);
        }
        setTimeout(() => this.addEffect('sparkles'), 300);
    }

    onGoalCompleted() {
        if (this.mood) this.mood.registerActivity();
        this.doAction('megaCelebrate');
        this.addEffect('sparkles');
        this.addEffect('hearts');
        if (this.expression) {
            this.expression.celebrate();
            this.expression.showBlush(3000);
            this.expression.showEmote('stars');
        }
        setTimeout(() => this.movement.jump(), 500);
        setTimeout(() => this.doAction('dance'), 1000);
    }

    onLevelUp() {
        if (this.mood) this.mood.registerActivity();
        if (this.mood) this.mood.setMood('happy');

        this.doAction('megaCelebrate');
        this.addEffect('sparkles');

        if (this.expression) {
            this.expression.love();
            this.expression.talk('celebrate', 3000);
        }

        setTimeout(() => this.movement.jump(), 300);
        setTimeout(() => {
            this.addEffect('hearts');
            this.doAction('dance');
            this.expression?.showEmote('stars');
        }, 800);
        setTimeout(() => this.movement.flyToRandomPosition(), 1500);
        setTimeout(() => this.movement.returnToDefault(), 3000);
    }

    onRewardRedeemed() {
        if (this.mood) this.mood.registerActivity();
        this.doAction('curious');
        if (this.expression) {
            this.expression.setExpression('curious', 2000);
        }
        setTimeout(() => {
            this.doAction('wave');
            this.playPetSound('happy');
            if (this.expression) {
                this.expression.greet();
            }
        }, 1500);
    }

    destroy() {
        if (this.idleInterval) clearInterval(this.idleInterval);
        if (this.blinkInterval) clearInterval(this.blinkInterval);
        if (this.stateTimeout) clearTimeout(this.stateTimeout);
        if (this.returnToDefaultTimeout) clearTimeout(this.returnToDefaultTimeout);

        this.mood?.destroy();
        this.expression?.destroy();
        this.movement?.destroy();
        this.affection?.destroy();
        this.hideSystem?.destroy();

        if (this.container) this.container.remove();
    }
}

// Global instance
window.PetMascot = PetMascot;
