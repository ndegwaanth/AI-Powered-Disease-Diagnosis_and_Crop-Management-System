document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background change on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(40, 167, 69, 0.95)';
            navbar.style.padding = '10px 0';
        } else {
            navbar.style.backgroundColor = 'var(--primary)';
            navbar.style.padding = '15px 0';
        }
    });

    // Initialize testimonial carousel
    const testimonialCarousel = new bootstrap.Carousel('#testimonialCarousel', {
        interval: 5000,
        ride: 'carousel'
    });
});