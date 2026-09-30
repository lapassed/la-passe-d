/* ============================================================
   ANIMATIONS.JS — La Passe D Basketball Identity Animations
   ============================================================
   Vanilla JS, no dependencies.
   Each feature checks for a disable class on <html> and
   respects prefers-reduced-motion.
   ============================================================ */

(function () {
    'use strict';

    /* === HELPERS === */
    const html = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const speedVar = () => {
        const v = getComputedStyle(html).getPropertyValue('--anim-speed');
        return parseFloat(v) || 1;
    };

    /** Create an SVG basketball icon (simple circle with lines) */
    function createBallSVG(color) {
        const c = color || 'currentColor';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('fill', 'none');
        svg.innerHTML = `
            <circle cx="50" cy="50" r="45" stroke="${c}" stroke-width="3"/>
            <path d="M50 5 C50 95 50 95 50 95" stroke="${c}" stroke-width="2"/>
            <path d="M5 50 C95 50 95 50 95 50" stroke="${c}" stroke-width="2"/>
            <path d="M13 18 C35 40 65 40 87 18" stroke="${c}" stroke-width="2" fill="none"/>
            <path d="M13 82 C35 60 65 60 87 82" stroke="${c}" stroke-width="2" fill="none"/>
        `;
        return svg;
    }

    /* === PRELOADER: TIP-OFF (sessionStorage, max 1.5s) === */
    function initPreloader() {
        if (prefersReducedMotion || html.classList.contains('no-preloader')) return;

        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        // If already shown this session, skip
        if (sessionStorage.getItem('lpd-preloader-shown')) {
            preloader.classList.add('hidden');
            return;
        }

        // Create bouncing ball
        const ballDiv = document.createElement('div');
        ballDiv.className = 'preloader-ball';
        ballDiv.appendChild(createBallSVG('#ffffff'));
        preloader.appendChild(ballDiv);

        // Start animation
        requestAnimationFrame(() => {
            ballDiv.classList.add('animate');
        });

        // After bounce, reveal logo
        const dur = 1200 * speedVar();
        setTimeout(() => {
            preloader.classList.add('tipoff-reveal');
        }, dur * 0.6);

        // Hide preloader
        setTimeout(() => {
            preloader.classList.add('hidden');
            sessionStorage.setItem('lpd-preloader-shown', '1');
        }, Math.min(dur + 300, 1500 * speedVar()));
    }

    /* === HERO: COURT LINES SVG === */
    function initCourtLines() {
        if (prefersReducedMotion || html.classList.contains('no-court-lines')) return;

        const hero = document.querySelector('.hero');
        if (!hero) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('court-lines-svg');
        svg.setAttribute('viewBox', '0 0 1200 800');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        svg.setAttribute('aria-hidden', 'true');

        // Draw half-court: key, 3pt arc, center circle
        svg.innerHTML = `
            <!-- Free throw lane / key -->
            <rect x="500" y="550" width="200" height="250" rx="0"/>
            <!-- 3-point arc -->
            <path d="M350 800 Q350 400 600 350 Q850 400 850 800"/>
            <!-- Center circle -->
            <circle cx="600" cy="200" r="80"/>
            <!-- Half-court line -->
            <line x1="0" y1="200" x2="1200" y2="200"/>
            <!-- Free throw circle -->
            <circle cx="600" cy="550" r="60"/>
        `;

        hero.appendChild(svg);

        // Trigger drawing after a delay
        setTimeout(() => {
            svg.classList.add('drawn');
        }, 500 * speedVar());
    }

    /* === DRIBBLING BALL (full-page companion) === */
    function initParallaxBall() {
        return; // Replaced by ball-animation.js (persistent 5-act ball story)

        // --- DOM setup ---
        const container = document.createElement('div');
        container.className = 'dribble-container';
        container.setAttribute('aria-hidden', 'true');

        const ballEl = document.createElement('div');
        ballEl.className = 'dribble-ball';
        ballEl.appendChild(createBallSVG('var(--text-main)'));

        const shadow = document.createElement('div');
        shadow.className = 'dribble-shadow';

        const impact = document.createElement('div');
        impact.className = 'dribble-impact';

        container.appendChild(ballEl);
        container.appendChild(shadow);
        container.appendChild(impact);
        document.body.appendChild(container);

        // --- Play path SVG (dotted line trail) ---
        const pathSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        pathSvg.classList.add('dribble-path');
        pathSvg.setAttribute('aria-hidden', 'true');
        document.body.appendChild(pathSvg);
        const pathSegments = []; // store {x1,y1,x2,y2} for trail lines
        const MAX_SEGMENTS = 40;

        // --- State ---
        let rotation = 0;
        let lastScroll = window.scrollY;
        let lastTime = performance.now();
        let scrollSpeed = 0;
        let isScrolling = false;
        let scrollTimeout = null;
        let rafId = null;

        // Bounce physics
        const BOUNCE_HEIGHT = 60; // px max height of each dribble
        const DRIBBLE_FREQ = 3.5; // bounces per second
        let bouncePhase = 0;
        let lastBounceWasDown = false;

        // Position
        const MARGIN_X = 50; // px from edge
        let targetSide = 1; // 1 = right, -1 = left
        let currentSide = 1;
        let baseY = window.innerHeight * 0.55; // vertical center-ish

        // Track which section we're in for crossover
        let currentSectionIndex = 0;

        // Previous position for path trail
        let prevScreenX = 0, prevScreenY = 0;

        // --- Scroll handler ---
        window.addEventListener('scroll', () => {
            const now = performance.now();
            const dt = Math.max(now - lastTime, 1);
            const delta = window.scrollY - lastScroll;
            scrollSpeed = delta / dt * 1000; // px/s
            lastScroll = window.scrollY;
            lastTime = now;
            rotation += delta * 1.2;

            isScrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => { isScrolling = false; }, 150);

            // Detect section crossover
            const sections = document.querySelectorAll('main > section');
            let idx = 0;
            sections.forEach((sec, i) => {
                if (window.scrollY + window.innerHeight / 2 >= sec.offsetTop) idx = i;
            });
            if (idx !== currentSectionIndex) {
                currentSectionIndex = idx;
                targetSide *= -1; // crossover!
            }
        }, { passive: true });

        // --- Animate ---
        function animate(timestamp) {
            const dt = 1 / 60; // assume ~60fps for phase
            const speed = speedVar();

            // Advance bounce phase (continuous, time-based)
            bouncePhase += dt * DRIBBLE_FREQ * 2 * Math.PI / speed;

            // Bounce height: |cos| gives 0 at top, 1 at bottom
            // We want the ball to spend more time in the air (fast down, slow up)
            const rawBounce = Math.abs(Math.cos(bouncePhase));
            const bounceY = rawBounce * rawBounce; // ease: more time at top
            const airHeight = BOUNCE_HEIGHT * (1 - bounceY); // 0 = ground, BOUNCE_HEIGHT = top

            // Squash & stretch
            const normalizedHeight = airHeight / BOUNCE_HEIGHT; // 0 = ground, 1 = top
            const squashX = 1 + (1 - normalizedHeight) * 0.25; // wider at ground
            const squashY = 1 - (1 - normalizedHeight) * 0.2;  // flatter at ground
            const stretchX = 1 - normalizedHeight * 0.08;       // thinner in air
            const stretchY = 1 + normalizedHeight * 0.12;       // taller in air
            const scX = normalizedHeight < 0.15 ? squashX : stretchX;
            const scY = normalizedHeight < 0.15 ? squashY : stretchY;

            // Detect bounce impact (transition from going down to going up)
            const goingDown = Math.sin(bouncePhase) > 0;
            if (lastBounceWasDown && !goingDown) {
                spawnImpactRipple();
            }
            lastBounceWasDown = goingDown;

            // Shadow: bigger and more visible when ball is lower
            const shadowScale = 0.5 + (1 - normalizedHeight) * 0.8;
            const shadowOpacity = 0.1 + (1 - normalizedHeight) * 0.15;
            shadow.style.transform = `translateX(-50%) scaleX(${shadowScale})`;
            shadow.style.opacity = shadowOpacity;

            // Side crossover: smooth lerp
            currentSide += (targetSide - currentSide) * 0.03;
            const screenX = currentSide > 0
                ? window.innerWidth - MARGIN_X
                : MARGIN_X;
            const lerpedX = prevScreenX + (screenX - prevScreenX) * 0.04;

            // Vertical position: slight sinusoidal drift
            const scrollPct = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const yDrift = Math.sin(scrollPct * Math.PI * 2) * 40;
            const screenY = baseY + yDrift;

            // Apply position to container
            container.style.transform = `translate(${lerpedX - 19}px, ${screenY - airHeight - 19}px)`;

            // Apply squash/stretch + rotation to ball
            ballEl.style.transform = `rotate(${rotation}deg) scaleX(${scX}) scaleY(${scY})`;

            // Idle spin: when not scrolling, add a slow spin
            if (!isScrolling) {
                rotation += 1.5;
            }

            // --- Trail path: draw dotted line ---
            if (!html.classList.contains('no-ball-trail')) {
                const dx = Math.abs(lerpedX - prevScreenX);
                const dy = Math.abs((screenY - airHeight) - prevScreenY);
                if (dx + dy > 12) { // only add segment if moved enough
                    addPathSegment(prevScreenX, prevScreenY, lerpedX, screenY - airHeight);
                    prevScreenX = lerpedX;
                    prevScreenY = screenY - airHeight;
                }
            }

            rafId = requestAnimationFrame(animate);
        }

        prevScreenX = window.innerWidth - MARGIN_X;
        prevScreenY = baseY;
        rafId = requestAnimationFrame(animate);

        // --- Impact ripple ---
        function spawnImpactRipple() {
            impact.classList.remove('ripple-active');
            void impact.offsetWidth; // reflow
            impact.classList.add('ripple-active');
            setTimeout(() => impact.classList.remove('ripple-active'), 500 * speedVar());
        }

        // --- Path trail ---
        function addPathSegment(x1, y1, x2, y2) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            pathSvg.appendChild(line);
            pathSegments.push({ el: line, born: performance.now() });

            // Fade old segments
            const now = performance.now();
            while (pathSegments.length > MAX_SEGMENTS) {
                const old = pathSegments.shift();
                old.el.remove();
            }
            // Fade existing by age
            pathSegments.forEach((seg, i) => {
                const age = (now - seg.born) / 3000;
                seg.el.style.opacity = Math.max(0, 0.12 * (1 - age));
            });
        }

        container._cleanup = () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }

    /* === SCROLL: BALL TRAIL === */
    let trailThrottle = 0;
    function spawnBallTrail(refBall) {
        if (prefersReducedMotion) return;
        const now = Date.now();
        if (now - trailThrottle < 100) return;
        trailThrottle = now;

        const rect = refBall.getBoundingClientRect();
        const p = document.createElement('div');
        p.className = 'ball-trail-particle';
        p.appendChild(createBallSVG('var(--text-main)'));
        p.style.left = (rect.left + rect.width / 2 - 6) + 'px';
        p.style.top = (rect.top + rect.height / 2 - 6) + 'px';
        document.body.appendChild(p);

        setTimeout(() => p.remove(), 600 * speedVar());
    }

    /* === SCROLL: BOUNCE-IN SECTIONS + CASCADE CARDS === */
    function initScrollAnimations() {
        if (prefersReducedMotion) return;

        // Add bounce-in-section class to section headers and main blocks
        const sections = document.querySelectorAll('.section-header, .about-grid, .gallery-grid, .tournament-list, .faq-accordion, .newsletter-container, .survey-banner');
        sections.forEach(el => {
            if (!html.classList.contains('no-bounce-scroll')) {
                el.classList.add('bounce-in-section');
            }
        });

        // Add cascade-card to cards
        if (!html.classList.contains('no-bounce-scroll')) {
            const cards = document.querySelectorAll('.about-card, .tournament-card, .faq-item');
            cards.forEach(card => {
                card.classList.add('cascade-card');
            });
        }

        // Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('appear');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        document.querySelectorAll('.bounce-in-section, .cascade-card').forEach(el => {
            observer.observe(el);
        });
    }

    /* === SCROLL: MIDCOURT SECTION LINES === */
    function initMidcourtLines() {
        if (prefersReducedMotion || html.classList.contains('no-midcourt')) return;

        // Insert midcourt lines between sections
        const mainSections = document.querySelectorAll('main > section');
        mainSections.forEach((section, i) => {
            if (i < mainSections.length - 1) {
                const line = document.createElement('div');
                line.className = 'midcourt-line';
                line.setAttribute('aria-hidden', 'true');
                section.after(line);
            }
        });

        // Observer for drawing
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('drawn');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.midcourt-line').forEach(l => observer.observe(l));
    }

    /* === SCROLL: SCOREBOARD LED NUMBERS === */
    function initScoreboard() {
        if (prefersReducedMotion || html.classList.contains('no-scoreboard')) return;

        // Find number-like content in date badges and countdown
        const dateElements = document.querySelectorAll('.date-badge .day, .time-box span');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateScoreboard(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        dateElements.forEach(el => {
            el.setAttribute('data-final', el.textContent);
            observer.observe(el);
        });
    }

    function animateScoreboard(el) {
        const final = el.getAttribute('data-final') || el.textContent;
        if (!final) return;

        const digits = '0123456789';
        const len = final.length;
        let frame = 0;
        const totalFrames = Math.floor(12 * speedVar());
        el.classList.add('scoreboard-number', 'counting');

        function tick() {
            frame++;
            let text = '';
            for (let i = 0; i < len; i++) {
                if (digits.includes(final[i])) {
                    if (frame >= totalFrames) {
                        text += final[i];
                    } else {
                        text += digits[Math.floor(Math.random() * 10)];
                    }
                } else {
                    text += final[i];
                }
            }
            el.textContent = text;

            if (frame < totalFrames) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = final;
                el.classList.remove('counting');
            }
        }

        requestAnimationFrame(tick);
    }

    /* === INTERACTIONS: PARQUET 3D TILT === */
    function initParquetTilt() {
        if (prefersReducedMotion || !hasHover || html.classList.contains('no-parquet')) return;

        const cards = document.querySelectorAll('.about-card, .tournament-card, .faq-item, .survey-banner');

        cards.forEach(card => {
            // Add shine overlay
            const shine = document.createElement('div');
            shine.className = 'parquet-shine';
            card.style.position = 'relative';
            card.appendChild(shine);

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;

                const rotateX = (y - 0.5) * -8;
                const rotateY = (x - 0.5) * 8;

                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(5px)`;
                shine.style.setProperty('--mouse-x', `${x * 100}%`);
                shine.style.setProperty('--mouse-y', `${y * 100}%`);
            }, { passive: true });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /* === INTERACTIONS: CUSTOM CURSOR === */
    function initCustomCursor() {
        if (prefersReducedMotion || !hasHover || isMobile || html.classList.contains('no-cursor')) return;

        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        document.body.appendChild(cursor);

        let cx = 0, cy = 0;
        let tx = 0, ty = 0;

        document.addEventListener('mousemove', (e) => {
            tx = e.clientX;
            ty = e.clientY;
        }, { passive: true });

        // Smooth follow
        function animateCursor() {
            cx += (tx - cx) * 0.15;
            cy += (ty - cy) * 0.15;
            cursor.style.transform = `translate(${cx - 12}px, ${cy - 12}px)`;
            requestAnimationFrame(animateCursor);
        }
        requestAnimationFrame(animateCursor);

        // Hover state for clickable elements
        const clickables = 'a, button, .btn, input[type="submit"], summary, .menu-toggle, .social-icon';
        
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(clickables)) {
                cursor.classList.add('hovering');
            }
        }, { passive: true });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(clickables)) {
                cursor.classList.remove('hovering');
            }
        }, { passive: true });
    }

    /* === FOOTER: BOUNCING BALL === */
    function initFooterBall() {
        return; // Replaced by ball-animation.js (Act 5 roll into footer)

        const footerBottom = document.querySelector('.footer-bottom');
        if (!footerBottom) return;

        const container = document.createElement('div');
        container.className = 'footer-bounce-container';
        container.setAttribute('aria-hidden', 'true');

        const ball = document.createElement('div');
        ball.className = 'footer-bounce-ball';
        ball.appendChild(createBallSVG('var(--text-muted)'));

        const shadow = document.createElement('div');
        shadow.className = 'footer-ball-shadow';

        container.appendChild(ball);
        container.appendChild(shadow);
        footerBottom.parentNode.insertBefore(container, footerBottom);
    }

    /* === CTA: ARC SHOT HOVER + BUZZER === */
    function initCTAArc() {
        if (prefersReducedMotion || html.classList.contains('no-cta-arc')) return;

        const ctaBtn = document.querySelector('.hero-actions .btn-primary');
        if (!ctaBtn) return;

        // Wrap in arc wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'cta-arc-wrapper';
        ctaBtn.parentNode.insertBefore(wrapper, ctaBtn);
        wrapper.appendChild(ctaBtn);

        // Create mini ball
        const arcBall = document.createElement('div');
        arcBall.className = 'cta-arc-ball';
        arcBall.appendChild(createBallSVG('var(--primary)'));
        wrapper.appendChild(arcBall);

        // Create mini hoop
        const hoop = document.createElement('div');
        hoop.className = 'cta-mini-hoop';
        const hoopSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        hoopSvg.setAttribute('viewBox', '0 0 40 40');
        hoopSvg.innerHTML = `
            <rect x="5" y="5" width="30" height="3" rx="1.5" fill="var(--primary)" opacity="0.8"/>
            <line class="net-line" x1="8" y1="8" x2="12" y2="30" stroke="var(--text-muted)" stroke-width="1" opacity="0.4"/>
            <line class="net-line" x1="20" y1="8" x2="20" y2="32" stroke="var(--text-muted)" stroke-width="1" opacity="0.4"/>
            <line class="net-line" x1="32" y1="8" x2="28" y2="30" stroke="var(--text-muted)" stroke-width="1" opacity="0.4"/>
        `;
        hoop.appendChild(hoopSvg);
        wrapper.appendChild(hoop);

        // Buzzer flash on click
        ctaBtn.addEventListener('click', () => {
            ctaBtn.classList.add('buzzer');
            setTimeout(() => ctaBtn.classList.remove('buzzer'), 300 * speedVar());

            // Play swish sound if enabled
            if (!html.classList.contains('sound-off') && window._swishSound) {
                window._swishSound.currentTime = 0;
                window._swishSound.play().catch(() => { });
            }
        });
    }

    /* === INTERACTIONS: LOGO SPIN === */
    // Already handled by CSS, just ensure hover works

    /* === VISIBILITY CHANGE: Tab title easter egg === */
    function initVisibilityChange() {
        const origTitle = document.title;
        let titleTimeout;

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearTimeout(titleTimeout);
            } else {
                document.title = '🏀 Reviens jouer !';
                titleTimeout = setTimeout(() => {
                    document.title = origTitle;
                }, 2000);
            }
        });
    }

    /* === EASTER EGG: Type "3x3" === */
    function initEasterEgg() {
        if (prefersReducedMotion) return;

        let buffer = '';
        const target = '3x3';

        document.addEventListener('keydown', (e) => {
            buffer += e.key.toLowerCase();
            if (buffer.length > 10) buffer = buffer.slice(-10);

            if (buffer.includes(target)) {
                buffer = '';
                triggerBallRain();
            }
        });
    }

    function triggerBallRain() {
        const count = isMobile ? 15 : 30;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const ball = document.createElement('div');
                ball.className = 'ball-rain-particle';
                const size = 15 + Math.random() * 25;
                ball.style.width = size + 'px';
                ball.style.height = size + 'px';
                ball.style.left = Math.random() * 100 + 'vw';
                ball.style.top = '-50px';
                ball.style.animationDuration = (2 + Math.random() * 2) * speedVar() + 's';
                ball.appendChild(createBallSVG('var(--primary)'));
                document.body.appendChild(ball);

                setTimeout(() => ball.remove(), 4000 * speedVar());
            }, i * 80);
        }
    }

    /* === SOUND: SWISH EFFECT (realistic net swish) === */
    function initSwishSound() {
        // Synthesise a realistic basketball net "swish" using Web Audio API.
        // The sound models nylon strings brushing: shaped pink noise with a
        // descending bandpass sweep and a two-stage envelope (attack + tail).
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const sampleRate = audioCtx.sampleRate;
            const duration = 0.45; // slightly longer for realism
            const numSamples = Math.floor(sampleRate * duration);
            const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
            const data = buffer.getChannelData(0);

            // Pink-ish noise (1/f approximation) — warmer than white noise
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < numSamples; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
                data[i] = pink;
            }

            // Offline render with filters for the swish character
            const offlineCtx = new OfflineAudioContext(1, numSamples, sampleRate);
            const src = offlineCtx.createBufferSource();
            src.buffer = buffer;

            // Bandpass filter: sweeps from ~6kHz down to ~1.5kHz (ball passing through net)
            const bp = offlineCtx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 1.2;
            bp.frequency.setValueAtTime(6000, 0);
            bp.frequency.exponentialRampToValueAtTime(1500, duration * 0.6);
            bp.frequency.exponentialRampToValueAtTime(800, duration);

            // Gentle high-shelf to add "air"
            const hs = offlineCtx.createBiquadFilter();
            hs.type = 'highshelf';
            hs.frequency.value = 4000;
            hs.gain.value = 3;

            // Gain envelope: quick attack, medium sustain, smooth tail
            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0, 0);
            gain.gain.linearRampToValueAtTime(0.7, 0.02);   // fast attack
            gain.gain.linearRampToValueAtTime(0.5, 0.08);   // sustain
            gain.gain.exponentialRampToValueAtTime(0.01, duration); // smooth tail

            src.connect(bp);
            bp.connect(hs);
            hs.connect(gain);
            gain.connect(offlineCtx.destination);
            src.start(0);

            offlineCtx.startRendering().then(renderedBuffer => {
                const wav = audioBufferToWav(renderedBuffer);
                const blob = new Blob([wav], { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.volume = 0.4;
                window._swishSound = audio;
            }).catch(() => {});

            audioCtx.close();
        } catch (e) {
            // Web Audio not supported, no sound
        }
    }

    // Minimal WAV encoder
    function audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        const data = buffer.getChannelData(0);
        const dataLength = data.length * (bitDepth / 8);
        const headerLength = 44;
        const totalLength = headerLength + dataLength;
        const arrayBuffer = new ArrayBuffer(totalLength);
        const view = new DataView(arrayBuffer);

        function writeString(offset, str) {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        }

        writeString(0, 'RIFF');
        view.setUint32(4, totalLength - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
        view.setUint16(32, numChannels * (bitDepth / 8), true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);

        let offset = 44;
        for (let i = 0; i < data.length; i++) {
            const sample = Math.max(-1, Math.min(1, data[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }

        return arrayBuffer;
    }

    /* === SOUND TOGGLE BUTTON === */
    function initSoundToggle() {
        const btn = document.createElement('button');
        btn.className = 'sound-toggle';
        btn.setAttribute('aria-label', 'Activer/Désactiver le son');
        btn.textContent = '🔇';
        document.body.appendChild(btn);

        // Default: sound off
        html.classList.add('sound-off');

        btn.addEventListener('click', () => {
            html.classList.toggle('sound-off');
            btn.textContent = html.classList.contains('sound-off') ? '🔇' : '🔊';
        });
    }

    /* === SHOT CLOCK TEXT REVEAL (on hero subtitle p) === */
    function initShotClockText() {
        if (prefersReducedMotion || html.classList.contains('no-shot-clock')) return;

        const heroP = document.querySelector('.hero-content > p');
        if (!heroP) return;

        // Save original HTML (with <br>)
        const originalHTML = heroP.innerHTML;

        // Clear and rebuild — spaces stay as plain text nodes for proper word spacing
        heroP.innerHTML = '';

        // Split by <br>
        const parts = originalHTML.split(/<br\s*\/?>/i);
        const chars = [];
        let globalIndex = 0;

        parts.forEach((part, pi) => {
            const textContent = part.replace(/<[^>]*>/g, '');
            for (let i = 0; i < textContent.length; i++) {
                const ch = textContent[i];

                // Spaces: plain text node — keeps natural word spacing
                if (ch === ' ') {
                    heroP.appendChild(document.createTextNode(' '));
                    chars.push({ el: null, char: ' ', index: globalIndex++ });
                    continue;
                }

                const span = document.createElement('span');
                span.className = 'shot-clock-char';

                const finalSpan = document.createElement('span');
                finalSpan.className = 'char-final';
                finalSpan.textContent = ch;

                const scrambleSpan = document.createElement('span');
                scrambleSpan.className = 'char-scramble';
                scrambleSpan.textContent = String(Math.floor(Math.random() * 10));

                span.appendChild(finalSpan);
                span.appendChild(scrambleSpan);
                heroP.appendChild(span);
                chars.push({ el: span, char: ch, index: globalIndex++ });
            }
            if (pi < parts.length - 1) {
                heroP.appendChild(document.createElement('br'));
            }
        });

        // Animate: reveal characters one by one with scramble
        const scrambleChars = '0123456789';
        let revealIndex = 0;

        function scrambleTick() {
            chars.forEach(c => {
                if (c.el && c.index >= revealIndex) {
                    const scramble = c.el.querySelector('.char-scramble');
                    if (scramble) scramble.textContent = scrambleChars[Math.floor(Math.random() * 10)];
                }
            });
        }

        const revealInterval = setInterval(() => {
            if (revealIndex >= chars.length) {
                clearInterval(revealInterval);
                clearInterval(scrambleInterval);
                return;
            }
            const batch = Math.min(2, chars.length - revealIndex);
            for (let b = 0; b < batch; b++) {
                if (revealIndex < chars.length) {
                    const c = chars[revealIndex];
                    if (c.el) c.el.classList.add('revealed');
                    revealIndex++;
                }
            }
        }, 50 * speedVar());

        const scrambleInterval = setInterval(scrambleTick, 40);

        // Safety: reveal all after max time
        setTimeout(() => {
            chars.forEach(c => { if (c.el) c.el.classList.add('revealed'); });
            clearInterval(revealInterval);
            clearInterval(scrambleInterval);
        }, 2500 * speedVar());
    }

    /* === NEW: SCROLL PROGRESS BAR === */
    function initScrollProgress() {
        if (prefersReducedMotion || html.classList.contains('no-scroll-progress')) return;

        const bar = document.createElement('div');
        bar.className = 'scroll-progress-bar';
        bar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(bar);

        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = pct + '%';
        }, { passive: true });
    }

    /* === NEW: GALLERY STAGGER REVEAL === */
    function initGalleryStagger() {
        if (prefersReducedMotion || html.classList.contains('no-gallery-stagger')) return;

        const imgs = document.querySelectorAll('.gallery-img');
        imgs.forEach((img, i) => {
            img.classList.add('gallery-stagger');
            img.style.transitionDelay = `${i * 0.12 * speedVar()}s`;
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('gallery-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        imgs.forEach(img => observer.observe(img));
    }

    /* === NEW: FAQ BOUNCE OPEN === */
    function initFAQBounce() {
        if (prefersReducedMotion || html.classList.contains('no-faq-bounce')) return;

        document.querySelectorAll('.faq-item').forEach(item => {
            item.addEventListener('toggle', () => {
                if (item.open) {
                    const content = item.querySelector('.faq-content');
                    if (content) {
                        content.classList.remove('faq-bounce-in');
                        // Force reflow
                        void content.offsetWidth;
                        content.classList.add('faq-bounce-in');
                    }
                }
            });
        });
    }

    /* === NEW: SOCIAL ICONS DRIBBLE HOVER === */
    function initSocialDribble() {
        if (prefersReducedMotion || !hasHover || html.classList.contains('no-social-dribble')) return;

        document.querySelectorAll('.social-icon').forEach(icon => {
            icon.addEventListener('mouseenter', () => {
                icon.classList.add('social-dribble');
            });
            icon.addEventListener('animationend', () => {
                icon.classList.remove('social-dribble');
            });
        });
    }

    /* === NEW: COUNTDOWN DIGIT FLIP === */
    function initCountdownFlip() {
        if (prefersReducedMotion || html.classList.contains('no-countdown-flip')) return;

        const timeSpans = document.querySelectorAll('.time-box span');
        const prevValues = new Map();

        timeSpans.forEach(span => {
            prevValues.set(span, span.textContent);
            // Wrap in a flip container
            const wrapper = document.createElement('div');
            wrapper.className = 'digit-flip-wrapper';
            span.parentNode.insertBefore(wrapper, span);
            wrapper.appendChild(span);
        });

        // Watch for changes via MutationObserver
        timeSpans.forEach(span => {
            const mo = new MutationObserver(() => {
                const current = span.textContent;
                const prev = prevValues.get(span);
                if (current !== prev) {
                    prevValues.set(span, current);
                    span.classList.remove('digit-flipping');
                    void span.offsetWidth;
                    span.classList.add('digit-flipping');
                    setTimeout(() => span.classList.remove('digit-flipping'), 400 * speedVar());
                }
            });
            mo.observe(span, { childList: true, characterData: true, subtree: true });
        });
    }

    /* === NEW: HERO SUBTLE GRAIN TEXTURE === */
    function initHeroGrain() {
        if (prefersReducedMotion || isMobile || html.classList.contains('no-grain')) return;

        const hero = document.querySelector('.hero');
        if (!hero) return;

        const grain = document.createElement('div');
        grain.className = 'hero-grain';
        grain.setAttribute('aria-hidden', 'true');
        hero.appendChild(grain);
    }

    /* === NEW: MAGNETIC PULL ON CTA BUTTONS === */
    function initMagneticButtons() {
        if (prefersReducedMotion || !hasHover || html.classList.contains('no-magnetic')) return;

        document.querySelectorAll('.hero-actions .btn, .survey-btn, .newsletter-btn').forEach(btn => {
            btn.classList.add('magnetic-btn');

            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
            }, { passive: true });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    /* === INIT ALL === */
    function init() {
        initPreloader();
        initCourtLines();

        // Delay post-preloader animations
        const preloaderDelay = sessionStorage.getItem('lpd-preloader-shown') ? 100 : 1600 * speedVar();

        setTimeout(() => {
            initShotClockText();
            initParallaxBall();
            initCTAArc();
        }, preloaderDelay);

        initScrollAnimations();
        initMidcourtLines();
        initScoreboard();
        initParquetTilt();
        initCustomCursor();
        initFooterBall();
        initVisibilityChange();
        initEasterEgg();
        initSwishSound();
        initSoundToggle();

        // New animations
        initScrollProgress();
        initGalleryStagger();
        initFAQBounce();
        initSocialDribble();
        initCountdownFlip();
        initHeroGrain();
        initMagneticButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
