// Port switcher functionality
document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab.url;
  
  // Check if we're on a localhost URL and extract the port
  const currentPort = extractPort(currentUrl);
  
  // Highlight the active port
  if (currentPort) {
    const activeItem = document.querySelector(`[data-port="${currentPort}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }
  
  // Add click handlers to all port items
  const portItems = document.querySelectorAll('.port-item');
  portItems.forEach(item => {
    item.addEventListener('click', handlePortClick);
  });
});

// Extract port number from URL
function extractPort(url) {
  if (!url) return null;
  
  // Match localhost URLs with ports
  const patterns = [
    /^https?:\/\/localhost:(\d+)/,
    /^https?:\/\/127\.0\.0\.1:(\d+)/,
    /^https?:\/\/192\.168\.\d+\.\d+:(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Check for localhost without explicit port (defaults to 3000 in Next.js context)
  if (url.includes('localhost') && !url.includes('localhost:')) {
    return '3000';
  }
  
  return null;
}

// Handle port item clicks
async function handlePortClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const portItem = event.currentTarget;
  const newPort = portItem.dataset.port;
  
  console.log('Port clicked:', newPort);
  console.log('Modifier keys - Ctrl:', event.ctrlKey, 'Meta:', event.metaKey);
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tab.url;
    
    console.log('Current URL:', currentUrl);
    
    // Build new URL with the selected port
    const newUrl = buildNewUrl(currentUrl, newPort);
    
    console.log('New URL:', newUrl);
    
    if (!newUrl) {
      // If not on localhost, navigate to localhost with selected port
      const defaultUrl = `http://localhost:${newPort}/`;
      
      console.log('Using default URL:', defaultUrl);
      
      if (event.ctrlKey || event.metaKey) {
        // Open in new tab
        console.log('Opening in new tab (default URL)');
        await chrome.tabs.create({ url: defaultUrl });
      } else {
        // Open in current tab
        console.log('Updating current tab (default URL)');
        await chrome.tabs.update(tab.id, { url: defaultUrl });
      }
      
      // Close popup after action
      window.close();
      return;
    }
    
    // Check if Ctrl/Cmd is pressed for new tab
    if (event.ctrlKey || event.metaKey) {
      // Open in new tab
      console.log('Opening in new tab:', newUrl);
      await chrome.tabs.create({ url: newUrl });
    } else {
      // Update current tab
      console.log('Updating current tab:', newUrl);
      await chrome.tabs.update(tab.id, { url: newUrl });
    }
    
    // Close popup after action
    window.close();
    
  } catch (error) {
    console.error('Error in handlePortClick:', error);
  }
}

// Build new URL with different port
function buildNewUrl(currentUrl, newPort) {
  if (!currentUrl) return null;
  
  try {
    const url = new URL(currentUrl);
    
    // Check if it's a localhost-type URL
    const localhostHosts = ['localhost', '127.0.0.1'];
    const isLocalhost = localhostHosts.includes(url.hostname) || 
                       url.hostname.startsWith('192.168.');
    
    if (!isLocalhost) {
      return null;
    }
    
    // Set the new port
    url.port = newPort;
    
    return url.toString();
  } catch (e) {
    console.error('Error building new URL:', e);
    return null;
  }
}

// Add visual feedback for keyboard modifiers
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey) {
    document.body.classList.add('new-tab-mode');
    updateHint('Ctrl+Click to open in new tab');
  }
});

document.addEventListener('keyup', (event) => {
  if (!event.ctrlKey && !event.metaKey) {
    document.body.classList.remove('new-tab-mode');
    updateHint('Click to switch • Ctrl+Click for new tab');
  }
});

// Update hint text
function updateHint(text) {
  const hint = document.querySelector('.hint');
  if (hint) {
    hint.textContent = text;
  }
}

// Handle clicking outside modifier keys
document.addEventListener('blur', () => {
  document.body.classList.remove('new-tab-mode');
  updateHint('Click to switch • Ctrl+Click for new tab');
});