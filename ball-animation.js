/* ============================================================
   BALL-ANIMATION.JS — "L'Action" — Scroll-driven basketball
   ============================================================
   One ball, five acts, 100 % scroll-driven.
   Scroll forward = play. Scroll back = rewind.
   No infinite loops — everything is f(scrollProgress).

   Le ballon navigue EXCLUSIVEMENT dans les espaces libres :
   Acte 1 : Mise en jeu   (Hero)        — couloir libre droit (face aux textes)
   Acte 2 : Crossover      (About)       — baseline sous les cartes (zone 100% libre)
   Acte 3 : La Passe D     (Gallery)     — ciel aérien au-dessus des photos
   Acte 4 : Montée au cercle (Tournaments) — couloir libre droit (à côté des cartes 800px)
   Acte 5 : Swish & Roll   (FAQ→Footer)  — couloir libre droit et roule en bord de footer

   RÈGLE D'OR : Les dessins (tracé de passe, panier, etc.) ne sont
   visibles QUE lorsqu'ils sont utiles à l'action en cours.
   En dehors de leur acte utile, ils sont STRICTEMENT MASQUÉS.
   ============================================================ */

(function () {
    'use strict';

    const html = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setupReducedMotionBall();
        return;
    }
    if (html.classList.contains('no-ball-story')) return;

    /* === CONFIGURATION === */
    const CONFIG = {
        ballSize: 60,
        ballSizeMobile: 40,
        mobileBreakpoint: 768,
        lerpFactor: 0.09,
        ghostCount: 3,
    };

    /* === HELPERS === */
    const lerp  = (a, b, t) => a + (b - a) * t;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const easeOut   = t => 1 - (1 - t) * (1 - t);
    const easeIn    = t => t * t;
    const isMobile  = () => window.innerWidth <= CONFIG.mobileBreakpoint;
    const getBallSize = () => isMobile() ? CONFIG.ballSizeMobile : CONFIG.ballSize;

    /* === CALCUL DYNAMIQUE DES ESPACES LIBRES (GUTTERS & CORRIDORS) === */
    function getRightLaneX(vw) {
        if (vw > 1200) {
            return Math.min(vw - 55, Math.max(vw * 0.88, (vw + 800) / 2 + 50));
        } else if (vw > 768) {
            return Math.min(vw - 45, Math.max(vw * 0.88, (vw + 800) / 2 + 40));
        }
        return vw * 0.88;
    }

    function getLeftLaneX(vw) {
        if (vw > 1200) {
            return Math.max(55, Math.min(vw * 0.12, (vw - 800) / 2 - 50));
        } else if (vw > 768) {
            return Math.max(45, Math.min(vw * 0.12, (vw - 800) / 2 - 40));
        }
        return vw * 0.12;
    }

    /* === WEB AUDIO SOUND SYNTHESIS === */
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {}
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    let lastThudTime = 0;
    function playBounceThud(vol = 0.20) {
        if (html.classList.contains('sound-off')) return;
        const now = performance.now();
        if (now - lastThudTime < 130) return;
        lastThudTime = now;

        const ctx = getAudioContext();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(115, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {}
    }

    function playSwishSound() {
        if (html.classList.contains('sound-off')) return;
        if (window._swishSound) {
            try {
                window._swishSound.currentTime = 0;
                window._swishSound.play().catch(() => {});
            } catch (e) {}
        }
    }

    /* === SVG FACTORIES === */
    function makeBallSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 72 72');
        svg.setAttribute('fill', 'none');
        svg.innerHTML = `
            <circle cx="36" cy="36" r="33" fill="var(--ball-bg, #ffffff)" stroke="var(--ball-lines, #121822)" stroke-width="2.6"/>
            <path d="M36 3 L36 69" stroke="var(--ball-lines, #121822)" stroke-width="2"/>
            <path d="M3 36 L69 36" stroke="var(--ball-lines, #121822)" stroke-width="2"/>
            <path d="M9 13 Q28 32 63 13" stroke="var(--ball-lines, #121822)" stroke-width="1.8"/>
            <path d="M9 59 Q28 40 63 59" stroke="var(--ball-lines, #121822)" stroke-width="1.8"/>
        `;
        return svg;
    }

    function makeHoopHTML() {
        return `
            <svg viewBox="0 0 100 120" fill="none">
                <rect class="hoop-structure" x="15" y="4" width="70" height="46" rx="3"
                      stroke="var(--text-main)" stroke-width="2" fill="rgba(255,255,255,0.08)"/>
                <rect class="hoop-structure" x="35" y="24" width="30" height="22" rx="1"
                      stroke="var(--text-main)" stroke-width="1.5" opacity="0.65"/>
                <line class="hoop-structure" x1="50" y1="46" x2="50" y2="52"
                      stroke="var(--secondary, #6ea4e6)" stroke-width="2.5"/>
                <ellipse class="hoop-structure hoop-rim" cx="50" cy="53" rx="26" ry="8"
                         stroke="var(--secondary, #6ea4e6)" stroke-width="2.8"/>
                <path class="net-strand" d="M26 58 Q29 78 36 98" stroke="var(--text-main)" stroke-width="1.2" opacity="0.55"/>
                <path class="net-strand" d="M38 59 Q40 82 43 100" stroke="var(--text-main)" stroke-width="1.2" opacity="0.55"/>
                <path class="net-strand" d="M50 60 Q50 84 50 100" stroke="var(--text-main)" stroke-width="1.2" opacity="0.55"/>
                <path class="net-strand" d="M62 59 Q60 82 57 100" stroke="var(--text-main)" stroke-width="1.2" opacity="0.55"/>
                <path class="net-strand" d="M74 58 Q71 78 64 98" stroke="var(--text-main)" stroke-width="1.2" opacity="0.55"/>
                <path d="M30 72 Q50 66 70 72" stroke="var(--text-main)" stroke-width="0.8" opacity="0.35"/>
                <path d="M34 85 Q50 80 66 85" stroke="var(--text-main)" stroke-width="0.8" opacity="0.3"/>
            </svg>
            <div class="swish-ring"></div>
        `;
    }

    function makePassLineSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('ball-pass-line');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.display = 'none';
        svg.style.opacity = '0';
        svg.innerHTML = `
            <defs>
                <marker id="coach-pass-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--secondary, #6ea4e6)" />
                </marker>
            </defs>
            <path id="passTrajectoryPath" d="M0,0 Q0,0 0,0" marker-end="url(#coach-pass-arrow)" />
        `;
        return svg;
    }

    /* === REDUCED MOTION STATIC BALL === */
    function setupReducedMotionBall() {
        const hero = document.getElementById('home');
        if (!hero) return;
        const staticBall = document.createElement('div');
        staticBall.style.cssText = `
            position: absolute;
            bottom: 40px;
            right: 50px;
            width: 60px;
            height: 60px;
            pointer-events: none;
            z-index: 5;
            filter: drop-shadow(0 4px 12px rgba(18,24,34,0.25));
        `;
        staticBall.appendChild(makeBallSVG());
        hero.appendChild(staticBall);
    }

    /* === DOM INITIALIZATION === */
    const scene = document.createElement('div');
    scene.className = 'ball-scene';
    scene.setAttribute('aria-hidden', 'true');

    const ballEl = document.createElement('div');
    ballEl.className = 'ball-el';
    ballEl.appendChild(makeBallSVG());

    const shadowEl = document.createElement('div');
    shadowEl.className = 'ball-shadow-el';

    const hoopEl = document.createElement('div');
    hoopEl.className = 'ball-hoop';
    hoopEl.innerHTML = makeHoopHTML();
    hoopEl.style.display = 'none';
    hoopEl.style.opacity = '0';

    const flashEl = document.createElement('div');
    flashEl.className = 'ball-flash';

    const passSvgEl = makePassLineSVG();
    const passTrajectoryPath = passSvgEl.querySelector('#passTrajectoryPath');

    const ghosts = [];
    if (!isMobile()) {
        for (let i = 0; i < CONFIG.ghostCount; i++) {
            const g = document.createElement('div');
            g.className = 'ball-ghost';
            g.appendChild(makeBallSVG());
            scene.appendChild(g);
            ghosts.push(g);
        }
    }

    scene.appendChild(passSvgEl);
    scene.appendChild(shadowEl);
    scene.appendChild(ballEl);
    scene.appendChild(hoopEl);
    scene.appendChild(flashEl);

    document.body.appendChild(scene);

    /* === STATE VARIABLES === */
    let targetProgress  = 0;
    let displayProgress = 0;
    let prevY = window.scrollY;
    let prevTime = performance.now();
    let scrollSpeed = 0;
    let boundaries = null;
    const history = [];
    const HISTORY_MAX = 25;
    let swishTriggered = false;

    /* === DYNAMIC SECTION BOUNDARIES === */
    function calcBoundaries() {
        const docH = document.documentElement.scrollHeight;
        const winH = window.innerHeight;
        const maxScroll = Math.max(docH - winH, 1);

        const getTop = id => {
            const el = document.getElementById(id);
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return (rect.top + window.scrollY) / maxScroll;
        };

        const topAbout = getTop('about') || 0.20;
        const topGallery = getTop('gallery') || 0.40;
        const topTournaments = getTop('tournaments') || 0.60;
        const topFaq = getTop('faq') || 0.80;

        return [
            { start: 0,              end: topAbout },       // Act 1: Hero
            { start: topAbout,       end: topGallery },     // Act 2: About
            { start: topGallery,     end: topTournaments }, // Act 3: Gallery
            { start: topTournaments, end: topFaq },         // Act 4: Tournaments
            { start: topFaq,         end: 1.0 },            // Act 5: FAQ -> Footer
        ];
    }

    function getCurrentAct(p) {
        if (!boundaries) return 0;
        for (let i = boundaries.length - 1; i >= 0; i--) {
            if (p >= boundaries[i].start) return i;
        }
        return 0;
    }

    function getLocalProgress(p, actIndex) {
        if (!boundaries || !boundaries[actIndex]) return 0;
        const b = boundaries[actIndex];
        const span = b.end - b.start;
        if (span <= 0) return 0;
        return clamp((p - b.start) / span, 0, 1);
    }

    /* === GESTIONNAIRE CENTRALISÉ DE VISIBILITÉ DES DESSINS === */
    // Règle : aucun dessin ne reste affiché quand il n'est pas utile à l'action !
    function updateDrawingsVisibility(currentActIndex, localP) {
        // 1. Tracé de la passe : UNIQUEMENT dans l'Acte 3 pendant le lancer
        if (currentActIndex === 2) {
            passSvgEl.style.display = 'block';
            if (localP < 0.04) {
                passSvgEl.style.opacity = '0';
            } else if (localP < 0.82) {
                passSvgEl.style.opacity = '0.75';
            } else {
                // S'estompe dès que le ballon arrive à destination
                passSvgEl.style.opacity = `${clamp(1 - (localP - 0.82) / 0.18, 0, 1) * 0.75}`;
            }
        } else {
            passSvgEl.style.opacity = '0';
            passSvgEl.style.display = 'none';
        }

        // 2. Panier de basket : UNIQUEMENT dans l'Acte 4 (tir) et au tout début de l'Acte 5 (swish)
        if (currentActIndex === 3) {
            // Acte 4 : Le panier apparaît pour le tir
            hoopEl.style.display = 'block';
            const hoopOpacity = clamp(localP / 0.35, 0, 1);
            hoopEl.style.opacity = `${hoopOpacity}`;
        } else if (currentActIndex === 4 && localP < 0.18) {
            // Acte 5 : Visible pour le swish, puis s'efface immédiatement dès que le ballon chute
            hoopEl.style.display = 'block';
            if (localP < 0.08) {
                hoopEl.style.opacity = '1';
            } else {
                hoopEl.style.opacity = `${clamp(1 - (localP - 0.08) / 0.10, 0, 1)}`;
            }
        } else {
            // Partout ailleurs (Hero, About, Gallery, fin FAQ, Newsletter, Footer) : Panier totalement masqué
            hoopEl.style.opacity = '0';
            hoopEl.style.display = 'none';
        }

        // 3. Fantômes : UNIQUEMENT dans l'Acte 2 en déplacement rapide
        if (currentActIndex !== 1) {
            ghosts.forEach(g => { g.style.opacity = '0'; });
        }
    }

    /* ============================================================
       ACTE 1 : LA MISE EN JEU (Hero)
       Couloir libre droit : le texte du hero et les boutons sont à gauche/centre.
       ============================================================ */
    function computeAct1(p) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const mobile = isMobile();

        const xPos = getRightLaneX(vw);
        const baseY = 0.72 * vh;

        const amp = clamp(p * 1.5, 0, 1) * (mobile ? 35 : 50);
        const freq = 4.5 + p * 2.5;
        const phase = p * freq * Math.PI;

        const rawSin = Math.sin(phase);
        const bounce = Math.abs(rawSin) * amp;
        const y = baseY - bounce;

        let sx = 1, sy = 1;
        if (bounce < 4 && amp > 5) {
            const sq = (1 - bounce / 4) * 0.16;
            sx = 1 + sq;
            sy = 1 - sq;
            if (rawSin < 0.1 && p > 0.05) playBounceThud(0.18);
        } else if (amp > 5) {
            const st = (bounce / Math.max(amp, 1)) * 0.08;
            sx = 1 - st;
            sy = 1 + st;
        }

        const rot = p * 240;
        return { x: xPos, y, rot, sx, sy, opacity: 1, shadowY: baseY, floorDist: bounce };
    }

    /* ============================================================
       ACTE 2 : LE CROSSOVER (Section Mission / À propos)
       Trajectoire : plonge SOUS les cartes (ligne de fond libre)
       Les 3 cartes sont entre Y ~ 0.35 et Y ~ 0.76.
       En naviguant à baselineY ~ 0.83vh (SOUS les cartes), le ballon
       ne masque aucun texte ni aucune icône.
       ============================================================ */
    function computeAct2(p) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const mobile = isMobile();

        const rightX = getRightLaneX(vw);
        const leftX  = getLeftLaneX(vw);
        const baselineY = (mobile ? 0.84 : 0.83) * vh;

        let x, y, rot, bounce = 0;
        if (p < 0.50) {
            // Descente du couloir droit vers la ligne de fond sous les cartes
            const t = p / 0.50;
            x = lerp(rightX, vw * 0.50, easeInOut(t));
            y = lerp(0.72 * vh, baselineY, easeIn(t));
            rot = t * 320;
        } else {
            // Rebond crossover sec au centre bas (sous les cartes), puis remontée vers le couloir gauche
            const t = (p - 0.50) / 0.50;
            x = lerp(vw * 0.50, leftX, easeInOut(t));
            const bounceAmp = (mobile ? 18 : 30) * (1 - t * 0.4);
            bounce = Math.abs(Math.sin(t * 2.5 * Math.PI)) * bounceAmp;
            y = lerp(baselineY, 0.70 * vh, t) - bounce;
            rot = 320 + t * 400;
            if (t < 0.1) playBounceThud(0.24);
        }

        let sx = 1, sy = 1;
        if (bounce < 4 && p > 0.50) {
            sx = 1.14; sy = 0.88;
        }

        return { x, y, rot, sx, sy, opacity: 1, shadowY: baselineY, floorDist: bounce };
    }

    /* ============================================================
       ACTE 3 : LA PASSE D (Section Galerie / Highlights)
       Passe aérienne haute dans le ciel libre :
       Survole l'espace au-dessus des photos (entre le header et la grille),
       du couloir gauche vers le couloir droit.
       ============================================================ */
    function computeAct3(p) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const mobile = isMobile();

        const startX = getLeftLaneX(vw);
        const endX   = getRightLaneX(vw);
        const startY = 0.70 * vh;
        const endY   = 0.45 * vh;

        // Apex aérien haut dans le corridor dégagé au-dessus des photos
        const apexY = (mobile ? 0.23 : 0.20) * vh;
        const t = easeInOut(p);
        const x = lerp(startX, endX, t);
        const arcY = Math.sin(p * Math.PI) * (startY - apexY);
        const y = lerp(startY, endY, p) - arcY;

        const rot = -p * 720;
        updatePassLine(startX, startY, endX, endY, apexY, p);

        return { x, y, rot, sx: 1, sy: 1, opacity: 1, shadowY: Math.max(startY, endY), floorDist: startY - y };
    }

    function updatePassLine(x1, y1, x2, y2, apexY, p) {
        if (!passTrajectoryPath) return;
        const cpx = (x1 + x2) / 2;
        const cpy = apexY - 25;

        passTrajectoryPath.setAttribute('d', `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cpx.toFixed(1)},${cpy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
        const totalLen = passTrajectoryPath.getTotalLength ? passTrajectoryPath.getTotalLength() : 500;
        passTrajectoryPath.style.strokeDasharray = `${totalLen}`;
        const drawnLength = clamp(p * totalLen, 0, totalLen);
        passTrajectoryPath.style.strokeDashoffset = `${totalLen - drawnLength}`;
    }

    /* ============================================================
       ACTE 4 : LA MONTÉE AU CERCLE (Section Tournois)
       Couloir libre droit : les cartes tournois et le sondage sont
       dans le bloc centré max 800px. Le couloir droit est 100% libre.
       Panier et tir restent à 100% dans ce couloir dégagé.
       ============================================================ */
    function computeAct4(p) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const mobile = isMobile();

        const hoopX = getRightLaneX(vw);
        const hoopY = (mobile ? 0.24 : 0.26) * vh;
        const approachX = hoopX - (mobile ? 18 : 25);
        const baseY = 0.65 * vh;

        updateHoop(hoopX, hoopY, p);

        if (p < 0.35) {
            const t = p / 0.35;
            const x = approachX;
            const bounce = Math.abs(Math.sin(t * 2 * Math.PI)) * (mobile ? 20 : 30);
            const y = baseY - bounce;
            const rot = t * 240;
            if (bounce < 4 && t > 0.1) playBounceThud(0.2);
            return { x, y, rot, sx: 1, sy: 1, opacity: 1, shadowY: baseY, floorDist: bounce };
        }

        // Shoot parabolique vers le panier (100% dans le couloir droit)
        const t = (p - 0.35) / 0.65;
        const x = lerp(approachX, hoopX, easeInOut(t));
        const apexH = (mobile ? 100 : 150);
        const peakCurve = Math.sin(t * Math.PI);
        const y = lerp(baseY, hoopY, t) - peakCurve * apexH;

        const rot = -t * 640;
        return { x, y, rot, sx: 1, sy: 1, opacity: 1, shadowY: baseY, floorDist: baseY - y };
    }

    function updateHoop(hx, hy, p) {
        hoopEl.style.transform = `translate(${hx - 50}px, ${hy - 50}px)`;
        const hoopOpacity = clamp(p / 0.35, 0, 1);

        const structures = hoopEl.querySelectorAll('.hoop-structure');
        structures.forEach(s => {
            const len = s.getTotalLength ? s.getTotalLength() : 300;
            s.style.strokeDasharray = `${len}`;
            s.style.strokeDashoffset = `${len * (1 - hoopOpacity)}`;
        });
    }

    /* ============================================================
       ACTE 5 : LE SWISH, REBONDS ET ROULE AU FOOTER (FAQ→Footer)
       Swish & rebonds dans le couloir droit (FAQ centrée max 800px).
       Roule doucement dans l'espace dégagé du footer.
       Le panier disparaît dès que le swish est terminé !
       ============================================================ */
    function computeAct5(p) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const mobile = isMobile();

        const hoopX = getRightLaneX(vw);
        const hoopY = (mobile ? 0.24 : 0.26) * vh;
        const floorY = (mobile ? 0.78 : 0.76) * vh;
        const footerBaselineY = (mobile ? 0.88 : 0.86) * vh;
        const rollTargetX = hoopX - (mobile ? 25 : 50);

        hoopEl.style.transform = `translate(${hoopX - 50}px, ${hoopY - 50}px)`;

        // === PHASE A : LE SWISH (0.00 -> 0.08) ===
        if (p < 0.08) {
            const t = p / 0.08;
            const x = hoopX;
            const y = lerp(hoopY, hoopY + 68, easeIn(t));

            animateNetStrands(t);
            animateShockwave(t, hoopX, hoopY);

            if (!swishTriggered && t > 0.25) {
                swishTriggered = true;
                playSwishSound();
                triggerCtaPulse();
            }

            flashEl.style.opacity = `${Math.sin(t * Math.PI) * 0.10}`;
            return { x, y, rot: t * 120, sx: 0.96, sy: 1.05, opacity: 1, shadowY: floorY, floorDist: floorY - y };
        }

        resetNetStrands();
        flashEl.style.opacity = '0';
        if (p > 0.15) swishTriggered = false;

        // === PHASE B : REBONDS AMORTIS DANS LE COULOIR DROIT (0.08 -> 0.45) ===
        if (p < 0.45) {
            const t = (p - 0.08) / 0.37;
            const fallY = lerp(hoopY + 68, floorY, clamp(t * 2.2, 0, 1));

            let bounceOffset = 0;
            if (t > 0.38) {
                const bt = (t - 0.38) / 0.62;
                bounceOffset = Math.abs(Math.sin(bt * 2 * Math.PI)) * (mobile ? 35 : 55) * Math.exp(-bt * 2.8);
                if (bounceOffset < 3 && bt > 0.1) playBounceThud(0.16);
            }

            const y = fallY - bounceOffset;
            const rot = 120 + t * 300;
            return { x: hoopX, y, rot, sx: 1, sy: 1, opacity: 1, shadowY: floorY, floorDist: floorY - y };
        }

        // === PHASE C : ROULEMENT DOUX EN BAS DE PAGE DANS L'ESPACE LIBRE (0.45 -> 1.0) ===
        const t = (p - 0.45) / 0.55;
        const x = lerp(hoopX, rollTargetX, easeInOut(t));
        const y = lerp(floorY, footerBaselineY, clamp(t * 2, 0, 1));
        const rot = 420 + t * 400;

        return { x, y, rot, sx: 1, sy: 1, opacity: 1, shadowY: footerBaselineY, floorDist: 0 };
    }

    function animateNetStrands(t) {
        const strands = hoopEl.querySelectorAll('.net-strand');
        const splay = Math.sin(t * Math.PI) * 16;
        strands.forEach((s, idx) => {
            const dir = idx < 2 ? -1 : (idx > 2 ? 1 : 0);
            s.style.transform = `skewX(${dir * splay}deg) scaleY(${1 - splay * 0.015})`;
        });
    }

    function resetNetStrands() {
        const strands = hoopEl.querySelectorAll('.net-strand');
        strands.forEach(s => { s.style.transform = ''; });
    }

    function animateShockwave(t, hx, hy) {
        const ring = hoopEl.querySelector('.swish-ring');
        if (!ring) return;
        const radius = lerp(18, 55, t);
        ring.style.width = `${radius * 2}px`;
        ring.style.height = `${radius * 2}px`;
        ring.style.top = `${53 - radius}px`;
        ring.style.left = `${50 - radius}px`;
        ring.style.opacity = `${(1 - t) * 0.8}`;
    }

    function triggerCtaPulse() {
        const cta = document.querySelector('.survey-btn, #newsletterSubmitBtn, .hero-actions .btn-primary');
        if (cta) {
            cta.classList.add('cta-swish-pulse');
            setTimeout(() => { cta.classList.remove('cta-swish-pulse'); }, 650);
        }
    }

    /* ============================================================
       MASTER RENDER ENGINE
       ============================================================ */
    function render(p) {
        const bSize = getBallSize();
        const halfSize = bSize / 2;

        const currentActIndex = getCurrentAct(p);
        const localP = getLocalProgress(p, currentActIndex);

        // Mise à jour stricte de la visibilité des dessins (aucun résidu hors de son acte)
        updateDrawingsVisibility(currentActIndex, localP);

        let state;
        switch (currentActIndex) {
            case 0: state = computeAct1(localP); break;
            case 1: state = computeAct2(localP); break;
            case 2: state = computeAct3(localP); break;
            case 3: state = computeAct4(localP); break;
            case 4: state = computeAct5(localP); break;
            default: state = computeAct1(0);
        }

        const finalOpacity = state.opacity;

        // Positionnement précis du ballon
        ballEl.style.transform = `translate3d(${(state.x - halfSize).toFixed(1)}px, ${(state.y - halfSize).toFixed(1)}px, 0) ` +
                                 `rotate(${state.rot.toFixed(1)}deg) ` +
                                 `scale(${state.sx.toFixed(2)}, ${state.sy.toFixed(2)})`;
        ballEl.style.opacity = `${finalOpacity}`;

        // Ombre dynamique au sol
        const floorDist = Math.max(0, state.floorDist || 0);
        const normDist = clamp(floorDist / 120, 0, 1);
        const shadowScale = lerp(1, 0.45, normDist);
        const shadowOpacity = lerp(0.35, 0.04, normDist) * finalOpacity;
        const shW = bSize * 0.75 * shadowScale;

        shadowEl.style.transform = `translate3d(${(state.x - shW / 2).toFixed(1)}px, ${(state.shadowY + halfSize * 0.75).toFixed(1)}px, 0)`;
        shadowEl.style.width = `${shW.toFixed(1)}px`;
        shadowEl.style.opacity = `${shadowOpacity}`;

        // Historique pour ghost trail (Act 2 crossover uniquement)
        history.push({ x: state.x, y: state.y, rot: state.rot, opacity: finalOpacity });
        if (history.length > HISTORY_MAX) history.shift();

        if (!isMobile() && currentActIndex === 1 && Math.abs(scrollSpeed) > 350) {
            ghosts.forEach((g, i) => {
                const histIdx = history.length - 1 - (i + 1) * 4;
                if (histIdx >= 0 && histIdx < history.length) {
                    const h = history[histIdx];
                    g.style.transform = `translate3d(${(h.x - halfSize).toFixed(1)}px, ${(h.y - halfSize).toFixed(1)}px, 0) rotate(${h.rot.toFixed(1)}deg)`;
                    g.style.opacity = `${[0.22, 0.12, 0.06][i] || 0.05}`;
                } else {
                    g.style.opacity = '0';
                }
            });
        } else {
            ghosts.forEach(g => { g.style.opacity = '0'; });
        }

        html.style.setProperty('--ball-story-progress', p.toFixed(4));
    }

    /* === SCROLL LISTENER & RAF ENGINE === */
    function onScroll() {
        const now = performance.now();
        const dt = Math.max(now - prevTime, 1);
        scrollSpeed = (window.scrollY - prevY) / dt * 1000;
        prevY = window.scrollY;
        prevTime = now;

        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        targetProgress = clamp(window.scrollY / maxScroll, 0, 1);
    }

    let rafId = null;
    function tick() {
        displayProgress += (targetProgress - displayProgress) * CONFIG.lerpFactor;
        if (Math.abs(targetProgress - displayProgress) < 0.0001) {
            displayProgress = targetProgress;
        }

        render(displayProgress);
        rafId = requestAnimationFrame(tick);
    }

    function onResize() {
        boundaries = calcBoundaries();
        render(displayProgress);
    }

    /* === INITIALISATION === */
    function init() {
        boundaries = calcBoundaries();
        window.addEventListener('load', () => { boundaries = calcBoundaries(); });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });

        onScroll();
        displayProgress = targetProgress;
        render(displayProgress);
        rafId = requestAnimationFrame(tick);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
