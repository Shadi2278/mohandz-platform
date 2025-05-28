// Intro Animation JavaScript
document.addEventListener("DOMContentLoaded", function() {
    const introContainer = document.getElementById('intro-animation');
    const enterSiteBtn = document.getElementById('enter-site');
    
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisitedMohandz');
    
    if (hasVisited) {
        // If user has visited before, hide intro immediately
        introContainer.classList.add('hidden');
        setTimeout(() => {
            introContainer.style.display = 'none';
        }, 500);
    } else {
        // Show loader animation
        const loaderBar = document.querySelector('.intro-loader-bar');
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                // Enable enter button after loading completes
                document.getElementById('enter-site').classList.add('active');
            } else {
                width += 1;
                loaderBar.style.width = width + '%';
            }
        }, 30);
        
        // Set auto-hide after 8 seconds if user doesn't click the button
        setTimeout(() => {
            hideIntro();
        }, 8000);
        
        // Add click event to enter site button
        enterSiteBtn.addEventListener('click', hideIntro);
        
        // Set flag that user has visited
        localStorage.setItem('hasVisitedMohandz', 'true');
    }
    
    function hideIntro() {
        introContainer.classList.add('hidden');
        setTimeout(() => {
            introContainer.style.display = 'none';
        }, 500);
    }
});
