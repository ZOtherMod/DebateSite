// About page functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeAboutPage();
});

function initializeAboutPage() {
    checkAuthentication();
    setupScrollAnimations();
    setupSmoothScrolling();
}

function setupScrollAnimations() {
    // Create intersection observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe all sections for animation
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('fade-in-section');
        observer.observe(section);
    });
    
    // Observe feature cards and steps for staggered animation
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in-card');
        observer.observe(card);
    });
    
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.style.animationDelay = `${index * 0.2}s`;
        step.classList.add('fade-in-step');
        observer.observe(step);
    });
    
    const rankItems = document.querySelectorAll('.rank-item');
    rankItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('fade-in-rank');
        observer.observe(item);
    });
}

function setupSmoothScrolling() {
    // Add smooth scrolling to anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add parallax effect to hero section
function setupParallaxEffect() {
    const hero = document.querySelector('.about-hero');
    if (!hero) return;
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.5;
        
        hero.style.transform = `translateY(${parallax}px)`;
    });
}

// Add hover effects to interactive elements
function setupHoverEffects() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    const rankItems = document.querySelectorAll('.rank-item');
    
    rankItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.querySelector('.rank-icon').style.transform = 'scale(1.1) rotate(5deg)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.querySelector('.rank-icon').style.transform = 'scale(1) rotate(0deg)';
        });
    });
}

// Initialize all effects
setTimeout(() => {
    setupParallaxEffect();
    setupHoverEffects();
}, 100);

// Add CSS for animations and effects
const style = document.createElement('style');
style.textContent = `
    .fade-in-section {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .fade-in-section.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .fade-in-card {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .fade-in-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .fade-in-step {
        opacity: 0;
        transform: translateX(-30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .fade-in-step.animate-in {
        opacity: 1;
        transform: translateX(0);
    }
    
    .fade-in-rank {
        opacity: 0;
        transform: scale(0.8);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .fade-in-rank.animate-in {
        opacity: 1;
        transform: scale(1);
    }
    
    .feature-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
    }
    
    .feature-card:hover {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    
    .rank-icon {
        transition: transform 0.3s ease;
    }
    
    .step {
        position: relative;
    }
    
    .step::before {
        content: '';
        position: absolute;
        left: 25px;
        top: 60px;
        bottom: -20px;
        width: 2px;
        background: linear-gradient(to bottom, #007bff, transparent);
    }
    
    .step:last-child::before {
        display: none;
    }
    
    .guideline-item {
        transition: transform 0.2s ease;
    }
    
    .guideline-item:hover {
        transform: translateX(5px);
    }
    
    @media (max-width: 768px) {
        .fade-in-step {
            transform: translateY(20px);
        }
        
        .step::before {
            display: none;
        }
        
        .parallax-hero {
            transform: none !important;
        }
    }
    
    /* Smooth scroll behavior */
    html {
        scroll-behavior: smooth;
    }
    
    /* Active navigation highlight */
    .nav-link.active {
        color: #007bff;
        font-weight: 600;
    }
`;

document.head.appendChild(style);
