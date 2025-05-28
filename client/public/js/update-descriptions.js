// Update service descriptions with Saudi Bedouin dialect
document.addEventListener('DOMContentLoaded', function() {
    // Find all service cards
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        // Get service category and type
        const categorySection = card.closest('.service-category');
        let category = '';
        
        if (categorySection.id === 'architectural') {
            category = 'architectural';
        } else if (categorySection.id === 'infrastructure') {
            category = 'infrastructure';
        } else if (categorySection.id === 'surveying') {
            category = 'surveying';
        }
        
        if (category) {
            // Get service title to determine type
            const titleElement = card.querySelector('.service-title');
            const title = titleElement ? titleElement.textContent.trim() : '';
            let type = '';
            
            // Match title to type
            if (category === 'architectural') {
                if (title.includes('معماري')) type = 'design';
                else if (title.includes('إنشائي')) type = 'structural';
                else if (title.includes('MEP')) type = 'mep';
                else if (title.includes('شامل')) type = 'comprehensive';
            } else if (category === 'infrastructure') {
                if (title.includes('طرق')) type = 'roads';
                else if (title.includes('شبكات')) type = 'networks';
                else if (title.includes('محطات')) type = 'stations';
                else if (title.includes('السلامة')) type = 'safety';
                else if (title.includes('عبارات')) type = 'culverts';
                else if (title.includes('جسور')) type = 'bridges';
            } else if (category === 'surveying') {
                if (title.includes('للأراضي')) type = 'land';
                else if (title.includes('غير ممهد')) type = 'unpaved';
                else if (title.includes('قائم')) type = 'existing';
                else if (title.includes('للخدمات')) type = 'services';
            }
            
            // Update description if we have a match
            if (type && serviceDescriptions[category] && serviceDescriptions[category][type]) {
                const descElement = card.querySelector('.service-description');
                if (descElement) {
                    descElement.textContent = serviceDescriptions[category][type];
                }
            }
        }
    });
});
