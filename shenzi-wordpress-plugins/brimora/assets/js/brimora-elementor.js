/**
 * Brimora Elementor Frontend Script
 * 
 * Handles dynamic background image loading for zen services
 */

(function($) {
    'use strict';
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        initBrimoraBackgrounds();
    });
    
    /**
     * Initialize all Brimora background containers
     */
    function initBrimoraBackgrounds() {
        const containers = document.querySelectorAll('[data-brimora-bg-enabled="true"]');
        
        if (containers.length === 0) {
            return;
        }
        
        containers.forEach(function(container) {
            const serviceId = container.getAttribute('data-brimora-service-id');
            const serviceCode = container.getAttribute('data-brimora-service-code');
            
            if (serviceId && serviceId !== '0') {
                loadServiceBackground(container, serviceId, serviceCode);
            }
        });
    }
    
    /**
     * Load background image for a service
     */
    function loadServiceBackground(container, serviceId, serviceCode) {
        // Add loading class
        container.classList.add('brimora-loading');
        
        // Prepare AJAX data
        const ajaxData = {
            action: 'brimora_get_service_background',
            service_id: serviceId,
            nonce: brimoraAjax.nonce
        };
        
        // Make AJAX request
        $.ajax({
            url: brimoraAjax.ajaxUrl,
            type: 'POST',
            data: ajaxData,
            success: function(response) {
                if (response.success && response.data.image_url) {
                    applyBackground(container, response.data);
                } else {
                    handleBackgroundError(container, response.data?.message || 'Unknown error');
                }
            },
            error: function(xhr, status, error) {
                handleBackgroundError(container, 'AJAX request failed: ' + error);
            },
            complete: function() {
                container.classList.remove('brimora-loading');
            }
        });
    }
    
    /**
     * Apply background image and settings to container
     */
    function applyBackground(container, data) {
        const bgSize = container.getAttribute('data-brimora-bg-size') || 'cover';
        const bgPosition = container.getAttribute('data-brimora-bg-position') || 'center center';
        const bgRepeat = container.getAttribute('data-brimora-bg-repeat') || 'no-repeat';
        const overlayEnabled = container.getAttribute('data-brimora-overlay') === 'yes';
        const overlayColor = container.getAttribute('data-brimora-overlay-color') || 'rgba(0,0,0,0.5)';
        
        // Apply background image
        container.style.backgroundImage = `url('${data.image_url}')`;
        container.style.backgroundSize = bgSize;
        container.style.backgroundPosition = bgPosition;
        container.style.backgroundRepeat = bgRepeat;
        
        // Add success class
        container.classList.add('brimora-bg-loaded');
        
        // Apply overlay if enabled
        if (overlayEnabled && overlayColor) {
            applyOverlay(container, overlayColor);
        }
        
        // Add responsive handling for different screen sizes
        setupResponsiveBackground(container, data);
        
        // Trigger custom event
        const event = new CustomEvent('brimoraBackgroundLoaded', {
            detail: {
                container: container,
                imageData: data
            }
        });
        container.dispatchEvent(event);
        
        // Debug logging if enabled
        if (window.brimoraDebug) {
            console.log('Brimora: Background loaded for service', data.service_name, data);
        }
    }
    
    /**
     * Apply overlay to container
     */
    function applyOverlay(container, overlayColor) {
        // Remove existing overlay
        const existingOverlay = container.querySelector('.brimora-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create new overlay
        const overlay = document.createElement('div');
        overlay.className = 'brimora-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: ${overlayColor};
            pointer-events: none;
            z-index: 1;
        `;
        
        // Ensure container is positioned
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        
        // Insert overlay as first child
        container.insertBefore(overlay, container.firstChild);
        
        // Ensure content appears above overlay
        const children = container.children;
        for (let i = 1; i < children.length; i++) {
            const child = children[i];
            if (getComputedStyle(child).position === 'static') {
                child.style.position = 'relative';
                child.style.zIndex = '2';
            }
        }
    }
    
    /**
     * Setup responsive background handling
     */
    function setupResponsiveBackground(container, data) {
        if (!data.image_sizes || Object.keys(data.image_sizes).length <= 1) {
            return;
        }
        
        // Create media queries for different image sizes
        const mediaQueries = {
            'thumbnail': '(max-width: 480px)',
            'medium': '(max-width: 768px)',
            'large': '(max-width: 1200px)',
            'full': '(min-width: 1201px)'
        };
        
        // Apply appropriate image based on screen size
        function updateBackgroundImage() {
            for (const [size, query] of Object.entries(mediaQueries)) {
                if (window.matchMedia(query).matches && data.image_sizes[size]) {
                    container.style.backgroundImage = `url('${data.image_sizes[size]}')`;
                    break;
                }
            }
        }
        
        // Initial update
        updateBackgroundImage();
        
        // Listen for resize events
        window.addEventListener('resize', debounce(updateBackgroundImage, 250));
    }
    
    /**
     * Handle background loading errors
     */
    function handleBackgroundError(container, message) {
        container.classList.add('brimora-bg-error');
        
        // Add error attribute for CSS targeting
        container.setAttribute('data-brimora-error', message);
        
        // Trigger error event
        const event = new CustomEvent('brimoraBackgroundError', {
            detail: {
                container: container,
                error: message
            }
        });
        container.dispatchEvent(event);
        
        // Console log for debugging
        console.warn('Brimora background error:', message, container);
    }
    
    /**
     * Debounce utility function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Refresh all backgrounds (utility function)
     */
    window.brimoraRefreshBackgrounds = function() {
        // Remove existing backgrounds
        const containers = document.querySelectorAll('.brimora-bg-loaded');
        containers.forEach(function(container) {
            container.classList.remove('brimora-bg-loaded', 'brimora-bg-error');
            container.style.backgroundImage = '';
            
            // Remove overlays
            const overlay = container.querySelector('.brimora-overlay');
            if (overlay) {
                overlay.remove();
            }
        });
        
        // Reinitialize
        initBrimoraBackgrounds();
    };
    
    /**
     * Enable debug mode (utility function)
     */
    window.brimoraDebugMode = function(enable) {
        window.brimoraDebug = enable;
        console.log('Brimora debug mode:', enable ? 'enabled' : 'disabled');
    };
    
})(jQuery);