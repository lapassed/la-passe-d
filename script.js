const COURT_CONFIG = {
    strokeOpacity: 0.10,
    lerpFactor: 0.08,
    parallaxAmp: 3, // % of scroll
    haloEnabled: true,
    mobileBreakpoint: 1024
};

(function initCourtBackground() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < COURT_CONFIG.mobileBreakpoint) {
        return;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const paths = document.querySelectorAll('#courtLines path, #courtLines circle, #courtLines rect, #courtLines line');
        const courtLinesGroup = document.getElementById('courtLines');
        const accent = document.getElementById('court-accent');
        if (!paths.length || !courtLinesGroup) return;

        let totalLength = 0;
        const pathData = [];

        paths.forEach(p => {
            if (p.id === 'court-accent') return;
            let len = 1000;
            if (p.getTotalLength) {
                len = p.getTotalLength();
            } else {
                const bbox = p.getBBox();
                len = (bbox.width + bbox.height) * 2;
            }
            p.style.strokeDasharray = len;
            p.style.strokeDashoffset = len;
            pathData.push({ el: p, length: len });
            totalLength += len;
        });

        let currentScroll = 0;
        let targetScroll = 0;
        let isDrawing = false;

        window.addEventListener('scroll', () => {
            targetScroll = window.scrollY;
            if (!isDrawing) {
                isDrawing = true;
                requestAnimationFrame(drawLoop);
            }
        }, { passive: true });

        function drawLoop() {
            currentScroll += (targetScroll - currentScroll) * COURT_CONFIG.lerpFactor;
            
            const scrollPercent = currentScroll / (document.documentElement.scrollHeight - window.innerHeight);
            
            // Draw lines
            pathData.forEach(p => {
                const drawLength = p.length * scrollPercent * 2; // finish drawing at 50% scroll
                p.el.style.strokeDashoffset = Math.max(0, p.length - drawLength);
            });

            // Accent
            if (scrollPercent > 0.6 && accent) {
                accent.classList.add('show');
            } else if (accent) {
                accent.classList.remove('show');
            }

            // Parallax
            const parallax = scrollPercent * COURT_CONFIG.parallaxAmp;
            courtLinesGroup.style.transform = `translate3d(0, -${parallax}%, 0)`;

            if (Math.abs(targetScroll - currentScroll) > 0.5) {
                requestAnimationFrame(drawLoop);
            } else {
                isDrawing = false;
            }
        }

        // Halo
        if (COURT_CONFIG.haloEnabled) {
            const halo = document.createElement('div');
            halo.className = 'court-halo active';
            document.body.appendChild(halo);
            document.addEventListener('mousemove', (e) => {
                halo.style.setProperty('--halo-x', e.clientX + 'px');
                halo.style.setProperty('--halo-y', e.clientY + 'px');
            }, { passive: true });
        }
        
        // initial trigger
        window.dispatchEvent(new Event('scroll'));
    });
})();

window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
        }
    }, 600);
});

document.addEventListener('DOMContentLoaded', () => {
    // Scroll animations using Intersection Observer
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    const faders = document.querySelectorAll('.fade-in, .fade-in-up');
    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle (smooth slide-in effect)
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });

    // Dynamic Events Generation
    const eventsData = [
        {
            title: "Student Night Easter",
            dateStr: "Jeudi 02 Avril à 19h",
            datetime: "2026-04-02T19:00:00+02:00",
            day: "02",
            month: "Avril",
            subtitle: "En collaboration avec Le Basket Center",
            link: "http://urlr.me/pyBhdn"
        },
        {
            title: "Student Night: The Last Dance",
            dateStr: "Samedi 20 Mai à 19h",
            datetime: "2026-05-20T19:00:00+02:00",
            day: "20",
            month: "Mai",
            subtitle: "En collaboration avec Le Basket Center",
            link: "https://docs.google.com/forms/d/e/1FAIpQLScOcbDpbWzSUCGvZQ1IXZRdLRQzvQmB1XLMlHWmRmZSwjLkjQ/viewform"
        }
    ];

    const eventsContainer = document.getElementById('eventsContainer');
    const now = new Date();

    if (eventsContainer) {
        eventsData.forEach(event => {
            const eventDate = new Date(event.datetime);
            const isPassed = now > eventDate;

            const card = document.createElement('div');
            card.className = `tournament-card ${isPassed ? 'passed' : ''}`;
            card.innerHTML = `
                <div class="date-badge">
                    <span class="day">${event.day}</span>
                    <span class="month">${event.month}</span>
                </div>
                <div class="info">
                    <h3>${event.title}</h3>
                    <p>${event.dateStr}</p>
                    ${event.subtitle ? `<p style="font-size: 0.85rem; margin-top: 5px; font-style: italic;">${event.subtitle}</p>` : ''}
                </div>
                ${isPassed
                    ? `<span class="badge passed" style="display: inline-block; padding: 8px 20px;">Passé</span>`
                    : `<a href="${event.link}" target="_blank" class="btn btn-primary event-btn" style="padding: 8px 20px; font-size: 0.9rem;">S'inscrire</a>`
                }
            `;
            eventsContainer.appendChild(card);
        });
    }

    // Countdown Timer Logic
    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMinutes = document.getElementById('cd-minutes');
    const cdSeconds = document.getElementById('cd-seconds');
    const countdownContainer = document.getElementById('countdown');

    if (countdownContainer && eventsData.length > 0) {
        // Find next event
        let nextEventDate = null;
        for (let event of eventsData) {
            let d = new Date(event.datetime);
            if (d > new Date()) {
                nextEventDate = d;
                break;
            }
        }

        if (nextEventDate) {
            const updateCountdown = () => {
                const now = new Date();
                const diff = nextEventDate - now;

                if (diff <= 0) {
                    countdownContainer.style.display = 'none';
                    return;
                }

                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((diff / 1000 / 60) % 60);
                const seconds = Math.floor((diff / 1000) % 60);

                cdDays.textContent = days.toString().padStart(2, '0');
                cdHours.textContent = hours.toString().padStart(2, '0');
                cdMinutes.textContent = minutes.toString().padStart(2, '0');
                cdSeconds.textContent = seconds.toString().padStart(2, '0');
            };

            updateCountdown();
            setInterval(updateCountdown, 1000);
        } else {
            countdownContainer.style.display = 'none';
        }
    }

    // ScrollSpy Logic
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-item');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === `#${current}`) {
                a.classList.add('active');
            }
        });
    });

    // Theme Toggle (Dark Mode)
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const htmlElement = document.documentElement;

    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
        themeToggles.forEach(t => t.textContent = '☀️');
    }

    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            if (htmlElement.getAttribute('data-theme') === 'dark') {
                htmlElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeToggles.forEach(t => t.textContent = '🌙');
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeToggles.forEach(t => t.textContent = '☀️');
            }
        });
    });

    // Scroll to top button visibility
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });
    }

    // --- Ripple Effect Logic ---
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            // Get coordinates relative to the button
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Create span element
            const ripples = document.createElement('span');
            ripples.style.left = x + 'px';
            ripples.style.top = y + 'px';
            ripples.classList.add('ripple');

            // Calculate size based on button dimensions
            const size = Math.max(rect.width, rect.height);
            ripples.style.width = ripples.style.height = size + 'px';
            // Adjust left/top to center the circle on click point
            ripples.style.left = (x - size / 2) + 'px';
            ripples.style.top = (y - size / 2) + 'px';

            this.appendChild(ripples);

            setTimeout(() => {
                ripples.remove();
            }, 600);
        });
    });

});
