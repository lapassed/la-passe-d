document.addEventListener('DOMContentLoaded', () => {
    // Scroll animations using Intersection Observer
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
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
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Mobile menu toggle (simple visual effect)
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', () => {
        // Toggle animation classes on hamburger
        menuToggle.classList.toggle('active');
        
        // Very basic toggle, normally you'd animate height or slide-in
        if (navLinks.style.display === 'flex') {
            navLinks.style.display = 'none';
        } else {
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '80px';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.background = 'rgba(255, 255, 255, 0.98)';
            navLinks.style.padding = '20px 0';
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (window.innerWidth <= 900) {
                    navLinks.style.display = 'none';
                }
            }
        });
    });

    // Handle past events automatically
    const eventCards = document.querySelectorAll('.tournament-card[data-date]');
    const now = new Date();

    eventCards.forEach(card => {
        const eventDate = new Date(card.getAttribute('data-date'));
        if (now > eventDate) {
            card.classList.add('passed');
            const badge = card.querySelector('.badge, .event-btn');
            if (badge) {
                badge.className = 'badge passed';
                badge.textContent = 'Passé';
                badge.style.pointerEvents = 'none'; // Disable link if needed
                badge.removeAttribute('href');
            }
        }
    });

});
