/**
 * Tregnar SaaS Theme JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Smooth scrolling for CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-primary, .cta-secondary');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const buttonText = this.textContent.trim();
            
            if (buttonText === 'Watch Demo' || buttonText === 'Schedule Demo') {
                // Handle demo requests
                handleDemoRequest();
            } else if (buttonText === 'Start Free Trial') {
                // Handle trial signups
                handleTrialSignup();
            }
        });
    });
    
    // Video player functionality
    const videoPlaceholder = document.querySelector('.video-placeholder');
    const playButton = document.querySelector('.play-button');
    
    if (playButton) {
        playButton.addEventListener('click', function() {
            // This will be replaced with actual video embed
            handleVideoPlay();
        });
    }
    
    // Animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards and use case cards
    const animatedElements = document.querySelectorAll('.feature-card, .use-case-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Floating animation for hero elements
    function createFloatingAnimation() {
        const heroVideo = document.querySelector('.hero-video');
        if (heroVideo) {
            let start = Date.now();
            
            function animate() {
                const elapsed = Date.now() - start;
                const yOffset = Math.sin(elapsed / 2000) * 10;
                heroVideo.style.transform = `translateY(${yOffset}px)`;
                requestAnimationFrame(animate);
            }
            
            animate();
        }
    }
    
    createFloatingAnimation();
    
    // Newsletter/Contact form handling (if forms are added)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission(this);
        });
    });
    
});

/**
 * Handle demo request button clicks
 */
function handleDemoRequest() {
    // For now, show an alert. Later this can be integrated with a booking system
    alert('Demo booking functionality will be integrated here. For now, please contact us directly!');
    
    // You can integrate with calendly, hubspot, or other booking systems
    // Example: window.open('https://calendly.com/tregnar/demo', '_blank');
}

/**
 * Handle trial signup button clicks
 */
function handleTrialSignup() {
    // For now, show an alert. Later this can redirect to signup page
    alert('Trial signup will be integrated here. Coming soon!');
    
    // You can redirect to a signup page or open a modal
    // Example: window.location.href = '/signup';
}

/**
 * Handle video play functionality
 */
function handleVideoPlay() {
    const videoContainer = document.querySelector('.video-container');
    
    // For now, show a placeholder message
    // Later you can embed the actual video
    if (videoContainer) {
        videoContainer.innerHTML = `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100%; 
                background: #111827; 
                color: white; 
                font-size: 18px;
                text-align: center;
                padding: 40px;
            ">
                <div>
                    <h3>Video Coming Soon!</h3>
                    <p>Your demo video will be embedded here.</p>
                    <p style="font-size: 14px; opacity: 0.7; margin-top: 20px;">
                        Replace this placeholder with your actual video embed code.
                    </p>
                </div>
            </div>
        `;
    }
    
    // Example of how to embed a YouTube video:
    // videoContainer.innerHTML = `
    //     <iframe 
    //         width="100%" 
    //         height="100%" 
    //         src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1" 
    //         frameborder="0" 
    //         allowfullscreen>
    //     </iframe>
    // `;
}

/**
 * Handle form submissions
 */
function handleFormSubmission(form) {
    const formData = new FormData(form);
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    
    // Here you would normally send the form data to your server
    // For now, we'll just simulate a successful submission
    setTimeout(() => {
        alert('Thank you for your interest! We\'ll be in touch soon.');
        form.reset();
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }, 2000);
}

/**
 * Utility function for smooth scrolling to elements
 */
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Add some interactive hover effects
 */
function addInteractiveEffects() {
    // Add tilt effect to feature cards
    const cards = document.querySelectorAll('.feature-card, .use-case-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) rotateX(5deg)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotateX(0)';
        });
    });
}

// Initialize interactive effects when DOM is loaded
document.addEventListener('DOMContentLoaded', addInteractiveEffects);

/**
 * Handle responsive navigation (if you add a navigation menu)
 */
function initMobileNav() {
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navigation = document.querySelector('.navigation');
    
    if (mobileToggle && navigation) {
        mobileToggle.addEventListener('click', function() {
            navigation.classList.toggle('nav-open');
            this.classList.toggle('toggle-active');
        });
    }
}

document.addEventListener('DOMContentLoaded', initMobileNav);