// Service Icon Animation
document.addEventListener('DOMContentLoaded', function() {
    // Get all service icons
    const serviceIcons = document.querySelectorAll('.service-icon');
    
    // Add animation effects to each icon
    serviceIcons.forEach(icon => {
        // Add mouseover event
        icon.addEventListener('mouseover', function() {
            // Add rotation and pulse animation
            this.style.transform = 'scale(1.1) rotate(10deg)';
            this.style.boxShadow = '0 10px 25px rgba(0, 86, 179, 0.2)';
            
            // Change background color with transition
            this.style.backgroundColor = '#0056b3';
            
            // Change icon color to white
            const iconElement = this.querySelector('i');
            if (iconElement) {
                iconElement.style.color = 'white';
                iconElement.style.transform = 'scale(1.2)';
            }
        });
        
        // Add mouseout event to reset
        icon.addEventListener('mouseout', function() {
            // Reset all styles
            this.style.transform = '';
            this.style.boxShadow = '';
            this.style.backgroundColor = '';
            
            // Reset icon color
            const iconElement = this.querySelector('i');
            if (iconElement) {
                iconElement.style.color = '';
                iconElement.style.transform = '';
            }
        });
    });
    
    // Add animation to service categories
    const serviceCategories = document.querySelectorAll('.service-category');
    
    serviceCategories.forEach(category => {
        // Add subtle background effect on hover
        category.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(0, 86, 179, 0.03)';
            this.style.borderRadius = '20px';
            
            // Enhance category title
            const title = this.querySelector('.category-title');
            if (title) {
                title.style.color = '#003366';
                
                // Animate the underline
                const underline = title.querySelector('::after');
                if (underline) {
                    underline.style.width = '120px';
                }
            }
        });
        
        // Reset on mouse leave
        category.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
            this.style.borderRadius = '';
            
            // Reset category title
            const title = this.querySelector('.category-title');
            if (title) {
                title.style.color = '';
                
                // Reset the underline
                const underline = title.querySelector('::after');
                if (underline) {
                    underline.style.width = '';
                }
            }
        });
    });
});
