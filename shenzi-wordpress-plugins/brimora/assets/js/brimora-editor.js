/**
 * Brimora Elementor Editor Script
 * 
 * Handles background image display inside Elementor editor
 */

(function($) {
    'use strict';
    
    console.log('Brimora: Editor script loaded');
    
    // Wait for Elementor to fully load
    $(window).on('elementor:init', function() {
        console.log('Brimora: Elementor editor initialized');
        
        // Hook into Elementor's preview refresh
        elementor.hooks.addAction('panel/open_editor/widget', function(panel, model, view) {
            // Refresh backgrounds when panel opens
            setTimeout(function() {
                refreshEditorBackgrounds();
            }, 500);
        });
        
        // Hook into Elementor's panel changes
        elementor.hooks.addAction('panel/state/change', function() {
            setTimeout(function() {
                refreshEditorBackgrounds();
            }, 100);
        });
        
        // Initial load
        setTimeout(function() {
            refreshEditorBackgrounds();
        }, 1000);
    });
    
    /**
     * Refresh backgrounds in editor preview
     */
    function refreshEditorBackgrounds() {
        // Get the preview iframe
        const previewFrame = $('#elementor-preview-iframe')[0];
        
        if (!previewFrame || !previewFrame.contentWindow) {
            console.log('Brimora: No preview iframe found');
            return;
        }
        
        const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        const previewWindow = previewFrame.contentWindow;
        
        // Check if our frontend script is available in the preview
        if (typeof previewWindow.brimoraForceInit === 'function') {
            console.log('Brimora: Running frontend script in preview');
            previewWindow.brimoraForceInit();
        } else {
            // Manual background application for editor
            console.log('Brimora: Manually applying backgrounds in editor');
            applyEditorBackgrounds(previewDoc, previewWindow);
        }
    }
    
    /**
     * Manually apply backgrounds in editor preview
     */
    function applyEditorBackgrounds(doc, win) {
        const containers = doc.querySelectorAll('[data-brimora-bg-enabled="true"]');
        
        console.log('Brimora: Found containers in editor:', containers.length);
        
        containers.forEach(function(container) {
            const serviceId = container.getAttribute('data-brimora-service-id');
            
            if (serviceId && serviceId !== '0') {
                loadEditorBackground(container, serviceId);
            }
        });
    }
    
    /**
     * Load background for editor preview
     */
    function loadEditorBackground(container, serviceId) {
        console.log('Brimora: Loading background for service in editor:', serviceId);
        
        // Add loading indicator
        container.style.position = 'relative';
        container.style.minHeight = '100px';
        
        // AJAX request to get image URL
        $.ajax({
            url: brimoraEditorAjax.ajaxUrl,
            type: 'POST',
            data: {
                action: 'brimora_get_service_background',
                service_id: serviceId,
                nonce: brimoraEditorAjax.nonce
            },
            success: function(response) {
                if (response.success && response.data && response.data.image_url) {
                    applyEditorBackground(container, response.data);
                } else {
                    console.error('Brimora: Failed to get image for editor:', response);
                }
            },
            error: function(xhr, status, error) {
                console.error('Brimora: Editor AJAX error:', error);
            }
        });
    }
    
    /**
     * Apply background in editor with high priority CSS
     */
    function applyEditorBackground(container, data) {
        const bgSize = container.getAttribute('data-brimora-bg-size') || 'cover';
        const bgPosition = container.getAttribute('data-brimora-bg-position') || 'center center';
        const bgRepeat = container.getAttribute('data-brimora-bg-repeat') || 'no-repeat';
        
        console.log('Brimora: Applying editor background:', data.image_url);
        
        // Create unique ID for this container
        const containerId = container.id || 'brimora-editor-' + Math.random().toString(36).substr(2, 9);
        if (!container.id) {
            container.id = containerId;
        }
        
        // Create high-priority CSS for editor
        const styleId = 'brimora-editor-style-' + containerId;
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        
        // Very high specificity CSS that works in editor
        styleElement.textContent = `
            /* Editor-specific high priority styles */
            #${containerId}.brimora-zen-service,
            #${containerId}[data-brimora-bg-enabled="true"],
            .elementor-element#${containerId},
            .elementor-container#${containerId},
            body .elementor-element#${containerId} {
                background-image: url('${data.image_url}') !important;
                background-size: ${bgSize} !important;
                background-position: ${bgPosition} !important;
                background-repeat: ${bgRepeat} !important;
                background-color: transparent !important;
                background-attachment: scroll !important;
            }
            
            /* Ensure it shows even over Elementor's editor styles */
            .elementor-editor-active #${containerId}[data-brimora-bg-enabled="true"] {
                background-image: url('${data.image_url}') !important;
                background-color: transparent !important;
            }
        `;
        
        // Add success class
        container.classList.add('brimora-bg-loaded');
        container.classList.add('brimora-editor-loaded');
        
        console.log('Brimora: Editor background applied successfully');
    }
    
    /**
     * Auto-refresh when Elementor content changes
     */
    if (typeof elementor !== 'undefined') {
        // Listen for Elementor updates
        elementor.channels.data.on('change', function() {
            setTimeout(function() {
                refreshEditorBackgrounds();
            }, 200);
        });
        
        // Listen for preview updates
        elementor.channels.editor.on('change', function() {
            setTimeout(function() {
                refreshEditorBackgrounds();
            }, 300);
        });
    }
    
    // Fallback: Periodic refresh for editor
    setInterval(function() {
        if (window.location.href.includes('elementor')) {
            refreshEditorBackgrounds();
        }
    }, 5000); // Every 5 seconds
    
})(jQuery);