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
        
        // Debug logging
        console.log('Brimora: Loading background for service', {
            serviceId: serviceId,
            serviceCode: serviceCode,
            container: container,
            ajaxUrl: brimoraAjax.ajaxUrl,
            nonce: brimoraAjax.nonce
        });
        
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
            beforeSend: function() {
                console.log('Brimora: AJAX request starting', ajaxData);
            },
            success: function(response) {
                console.log('Brimora: AJAX response received', response);
                
                if (response.success && response.data && response.data.image_url) {
                    console.log('Brimora: Valid image URL received', response.data.image_url);
                    applyBackground(container, response.data);
                } else {
                    const errorMsg = response.data?.message || response.message || 'Unknown error - no image URL in response';
                    console.error('Brimora: AJAX success but no valid image', {
                        response: response,
                        hasSuccess: response.success,
                        hasData: !!response.data,
                        hasImageUrl: !!(response.data && response.data.image_url),
                        imageUrl: response.data ? response.data.image_url : 'no data'
                    });
                    handleBackgroundError(container, errorMsg);
                }
            },
            error: function(xhr, status, error) {
                console.error('Brimora: AJAX request failed', {
                    xhr: xhr,
                    status: status,
                    error: error,
                    responseText: xhr.responseText,
                    serviceId: serviceId
                });
                handleBackgroundError(container, 'AJAX request failed: ' + error + ' (Status: ' + status + ')');
            },
            complete: function() {
                container.classList.remove('brimora-loading');
                console.log('Brimora: AJAX request completed for service', serviceId);
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
        
        // Debug logging
        console.log('Brimora: Applying background to container', {
            container: container,
            imageUrl: data.image_url,
            bgSize: bgSize,
            bgPosition: bgPosition,
            bgRepeat: bgRepeat,
            serviceData: data
        });
        
        // Method 1: CSS Custom Properties (highest priority)
        container.style.setProperty('--brimora-bg-image', `url('${data.image_url}')`);
        container.style.setProperty('--brimora-bg-size', bgSize);
        container.style.setProperty('--brimora-bg-position', bgPosition);
        container.style.setProperty('--brimora-bg-repeat', bgRepeat);
        
        // Method 2: Direct inline styles with !important (fallback)
        const importantStyles = `
            background-image: url('${data.image_url}') !important;
            background-size: ${bgSize} !important;
            background-position: ${bgPosition} !important;
            background-repeat: ${bgRepeat} !important;
            background-color: transparent !important;
        `;
        
        // Create or update style attribute
        const existingStyle = container.getAttribute('style') || '';
        const brimoraStylesRegex = /background-[^;]*!important;?/g;
        const cleanedStyle = existingStyle.replace(brimoraStylesRegex, '');
        container.setAttribute('style', cleanedStyle + importantStyles);
        
        // Method 3: Add success class for CSS targeting
        container.classList.add('brimora-bg-loaded');
        
        // Clear any conflicting Elementor background classes
        clearElementorBackgrounds(container);
        
        // Apply overlay if enabled
        if (overlayEnabled && overlayColor) {
            applyOverlay(container, overlayColor);
        }
        
        // Add responsive handling for different screen sizes
        setupResponsiveBackground(container, data);
        
        // Verify background was applied
        setTimeout(() => {
            verifyBackgroundApplication(container, data.image_url);
        }, 100);
        
        // Trigger custom event
        const event = new CustomEvent('brimoraBackgroundLoaded', {
            detail: {
                container: container,
                imageData: data
            }
        });
        container.dispatchEvent(event);
        
        // Debug logging
        console.log('Brimora: Background applied successfully for service', data.service_name, {
            finalStyle: container.getAttribute('style'),
            computedBg: window.getComputedStyle(container).backgroundImage,
            classes: container.className
        });
    }
    
    /**
     * Clear conflicting Elementor background styles
     */
    function clearElementorBackgrounds(container) {
        // Remove common Elementor background classes that might interfere
        const elementorBgClasses = [
            'elementor-bg-color',
            'elementor-bg-image', 
            'elementor-bg-overlay'
        ];
        
        elementorBgClasses.forEach(className => {
            container.classList.remove(className);
        });
        
        // Force clear any existing background color
        container.style.setProperty('background-color', 'transparent', 'important');
    }
    
    /**
     * Verify background was successfully applied
     */
    function verifyBackgroundApplication(container, expectedUrl) {
        const computedStyle = window.getComputedStyle(container);
        const actualBgImage = computedStyle.backgroundImage;
        
        console.log('Brimora: Background verification', {
            expected: expectedUrl,
            actualBgImage: actualBgImage,
            hasExpectedUrl: actualBgImage.includes(expectedUrl.replace(/^https?:/, '')),
            container: container
        });
        
        if (actualBgImage === 'none' || !actualBgImage.includes(expectedUrl.replace(/^https?:/, ''))) {
            console.warn('Brimora: Background image not applied correctly!', {
                container: container,
                expectedUrl: expectedUrl,
                actualBgImage: actualBgImage,
                elementorClasses: container.className,
                inlineStyle: container.getAttribute('style')
            });
            
            // Add error class for debugging
            container.classList.add('brimora-bg-verification-failed');
            
            // Try alternative application method
            forceBackgroundApplication(container, expectedUrl);
        } else {
            console.log('Brimora: Background verification successful!');
            container.classList.add('brimora-bg-verification-success');
        }
    }
    
    /**
     * Force background application using multiple methods
     */
    function forceBackgroundApplication(container, imageUrl) {
        console.log('Brimora: Forcing background application with alternative methods');
        
        // Method: Create a CSS rule specifically for this element
        const elementId = container.id || 'brimora-' + Math.random().toString(36).substr(2, 9);
        if (!container.id) {
            container.id = elementId;
        }
        
        // Create dynamic CSS
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            #${elementId}.brimora-bg-loaded {
                background-image: url('${imageUrl}') !important;
                background-color: transparent !important;
            }
            
            #${elementId}.brimora-bg-loaded,
            #${elementId}.brimora-bg-loaded.elementor-element,
            .elementor-container#${elementId}.brimora-bg-loaded {
                background-image: url('${imageUrl}') !important;
                background-color: transparent !important;
            }
        `;
        
        document.head.appendChild(styleElement);
        
        console.log('Brimora: Applied force CSS for element', elementId);
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