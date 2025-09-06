document.addEventListener('DOMContentLoaded', function() {
  const copyBtn = document.getElementById('copyBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const rootlifyBtn = document.getElementById('rootlifyBtn');
  const driggsmanRootBtn = document.getElementById('driggsmanRootBtn');
  const driggsmanSubBtn = document.getElementById('driggsmanSubBtn');
  const wppusherHttpsBtn = document.getElementById('wppusherHttpsBtn');
  const wppusherHttpBtn = document.getElementById('wppusherHttpBtn');
  const filezillaPathBtn = document.getElementById('filezillaPathBtn');
  const metaTitleBtn = document.getElementById('metaTitleBtn');
  const statusDiv = document.getElementById('status');

  // Meta Title Copy button - Copy page meta title to clipboard
  metaTitleBtn.addEventListener('click', async function() {
    try {
      // Add loading state
      metaTitleBtn.classList.add('loading');
      
      // Get current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.id) {
        showStatus('Cannot access current tab', 'error');
        metaTitleBtn.classList.remove('loading');
        return;
      }
      
      try {
        // Execute script to get the page title
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            // Try to get meta title first
            const metaTitle = document.querySelector('meta[property="og:title"]')?.content ||
                            document.querySelector('meta[name="twitter:title"]')?.content ||
                            document.querySelector('meta[name="title"]')?.content;
            
            // Fall back to document title if no meta title found
            return metaTitle || document.title;
          }
        });
        
        if (results && results[0] && results[0].result) {
          const pageTitle = results[0].result;
          
          // Copy to clipboard
          await navigator.clipboard.writeText(pageTitle);
          
          // Show success message (truncate if too long)
          const displayTitle = pageTitle.length > 50 ? 
            pageTitle.substring(0, 50) + '...' : pageTitle;
          showStatus(`Title copied: ${displayTitle}`, 'success');
        } else {
          showStatus('Could not get page title', 'error');
        }
        
      } catch (scriptError) {
        // This might happen on chrome:// pages or other restricted pages
        console.error('Script execution error:', scriptError);
        
        // Try to use just the tab title as fallback
        if (activeTab.title) {
          await navigator.clipboard.writeText(activeTab.title);
          const displayTitle = activeTab.title.length > 50 ? 
            activeTab.title.substring(0, 50) + '...' : activeTab.title;
          showStatus(`Tab title copied: ${displayTitle}`, 'success');
        } else {
          showStatus('Cannot access page title on this tab', 'error');
        }
      }
      
    } catch (error) {
      console.error('Error copying meta title:', error);
      showStatus('Failed to copy page title', 'error');
    } finally {
      metaTitleBtn.classList.remove('loading');
    }
  });

  // FileZilla path for allinone - Copy path to clipboard
  filezillaPathBtn.addEventListener('click', async function() {
    try {
      // Add loading state
      filezillaPathBtn.classList.add('loading');
      
      // Get current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.url) {
        showStatus('Cannot access current tab URL', 'error');
        filezillaPathBtn.classList.remove('loading');
        return;
      }
      
      try {
        const url = new URL(activeTab.url);
        let domain = url.hostname;
        
        // Remove www. if present
        if (domain.startsWith('www.')) {
          domain = domain.substring(4);
        }
        
        // Create FileZilla path
        const filezillaPath = `/${domain}/wp-content/ai1wm-backups`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(filezillaPath);
        
        // Show success message
        showStatus(`FileZilla path copied: ${filezillaPath}`, 'success');
        
      } catch (urlError) {
        showStatus('Invalid URL in current tab', 'error');
      }
      
    } catch (error) {
      console.error('Error copying FileZilla path:', error);
      showStatus('Failed to copy FileZilla path', 'error');
    } finally {
      filezillaPathBtn.classList.remove('loading');
    }
  });

  // Copy all tab URLs to clipboard
  copyBtn.addEventListener('click', async function() {
    try {
      // Add loading state
      copyBtn.classList.add('loading');
      
      // Get all tabs in current window
      const tabs = await chrome.tabs.query({ currentWindow: true });
      
      // Extract URLs - include ALL URLs (chrome://, local, etc.)
      const urls = tabs.map(tab => tab.url).filter(url => {
        // Include all URLs, only filter out undefined/null
        return url && url.trim().length > 0;
      });
      
      if (urls.length === 0) {
        showStatus('No valid URLs to copy', 'error');
        copyBtn.classList.remove('loading');
        return;
      }
      
      // Join URLs with newlines
      const urlText = urls.join('\n');
      
      // Copy to clipboard
      await navigator.clipboard.writeText(urlText);
      
      // Show success message
      showStatus(`Copied ${urls.length} URL${urls.length !== 1 ? 's' : ''} to clipboard!`, 'success');
      
    } catch (error) {
      console.error('Error copying URLs:', error);
      showStatus('Failed to copy URLs', 'error');
    } finally {
      copyBtn.classList.remove('loading');
    }
  });

  // Paste URLs from clipboard and open in new tabs
  pasteBtn.addEventListener('click', async function() {
    try {
      // Add loading state
      pasteBtn.classList.add('loading');
      
      // Read from clipboard
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText.trim()) {
        showStatus('Clipboard is empty', 'error');
        pasteBtn.classList.remove('loading');
        return;
      }
      
      // Parse URLs from clipboard (split by newlines, spaces, or commas)
      const urls = clipboardText
        .split(/[\n,\s]+/)
        .map(url => url.trim())
        .filter(url => {
          // Basic URL validation
          if (!url) return false;
          
          // Add protocol if missing
          if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
          }
          
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        })
        .map(url => {
          // Ensure URLs have protocol
          if (!url.match(/^https?:\/\//i)) {
            return 'https://' + url;
          }
          return url;
        });
      
      if (urls.length === 0) {
        showStatus('No valid URLs found in clipboard', 'error');
        pasteBtn.classList.remove('loading');
        return;
      }
      
      // Limit to 20 tabs to prevent browser overload
      const maxTabs = 20;
      const urlsToOpen = urls.slice(0, maxTabs);
      const skipped = urls.length - urlsToOpen.length;
      
      // Open each URL in a new tab
      for (const url of urlsToOpen) {
        chrome.tabs.create({ url: url, active: false });
      }
      
      // Show success message
      let message = `Opened ${urlsToOpen.length} tab${urlsToOpen.length !== 1 ? 's' : ''}`;
      if (skipped > 0) {
        message += ` (${skipped} skipped - max ${maxTabs})`;
      }
      showStatus(message, 'success');
      
      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (error) {
      console.error('Error pasting URLs:', error);
      
      // Check if it's a permissions issue
      if (error.message && error.message.includes('clipboard')) {
        showStatus('Please allow clipboard access', 'error');
      } else {
        showStatus('Failed to paste URLs', 'error');
      }
    } finally {
      pasteBtn.classList.remove('loading');
    }
  });

  // Rootlify - Remove URL parameters from current tab
  rootlifyBtn.addEventListener('click', async function() {
    try {
      // Add loading state
      rootlifyBtn.classList.add('loading');
      
      // Get current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.url) {
        showStatus('Cannot access current tab URL', 'error');
        rootlifyBtn.classList.remove('loading');
        return;
      }
      
      const currentUrl = activeTab.url;
      
      // Check if URL has parameters (contains ?)
      if (!currentUrl.includes('?')) {
        showStatus('No URL params to remove', 'info');
        rootlifyBtn.classList.remove('loading');
        return;
      }
      
      // Remove everything from ? onwards
      const rootUrl = currentUrl.split('?')[0];
      
      // Navigate to the root URL (this will refresh the page)
      await chrome.tabs.update(activeTab.id, { url: rootUrl });
      
      // Show success message
      showStatus('URL parameters removed and page refreshed!', 'success');
      
      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (error) {
      console.error('Error rootlifying URL:', error);
      showStatus('Failed to remove URL parameters', 'error');
    } finally {
      rootlifyBtn.classList.remove('loading');
    }
  });

  // Driggsman - Open root domain only
  driggsmanRootBtn.addEventListener('click', async function() {
    try {
      // Add loading state
      driggsmanRootBtn.classList.add('loading');
      
      // Get current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.url) {
        showStatus('Cannot access current tab URL', 'error');
        driggsmanRootBtn.classList.remove('loading');
        return;
      }
      
      try {
        const url = new URL(activeTab.url);
        
        // Extract root domain (remove subdomains)
        const hostname = url.hostname;
        const parts = hostname.split('.');
        let rootDomain;
        
        if (parts.length >= 2) {
          // Take last 2 parts for root domain (e.g., moldremovalstars.com)
          rootDomain = parts.slice(-2).join('.');
        } else {
          rootDomain = hostname;
        }
        
        // Create driggsman URL
        const driggsmanUrl = `http://localhost:3000/driggsman?activefilterchamber=daylight&sitesentered=${encodeURIComponent(rootDomain)}`;
        
        // Open in new tab
        await chrome.tabs.create({ url: driggsmanUrl, active: true });
        
        showStatus(`Opened driggsman with root domain: ${rootDomain}`, 'success');
        
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
        
      } catch (urlError) {
        showStatus('Invalid URL in current tab', 'error');
      }
      
    } catch (error) {
      console.error('Error opening driggsman root:', error);
      showStatus('Failed to open driggsman', 'error');
    } finally {
      driggsmanRootBtn.classList.remove('loading');
    }
  });

  // Driggsman - Open with all subdomains
  driggsmanSubBtn.addEventListener('click', async function() {
    try {
      // Add loading state
      driggsmanSubBtn.classList.add('loading');
      
      // Get current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.url) {
        showStatus('Cannot access current tab URL', 'error');
        driggsmanSubBtn.classList.remove('loading');
        return;
      }
      
      try {
        const url = new URL(activeTab.url);
        
        // Use full hostname including subdomains
        const fullDomain = url.hostname;
        
        // Create driggsman URL
        const driggsmanUrl = `http://localhost:3000/driggsman?activefilterchamber=daylight&sitesentered=${encodeURIComponent(fullDomain)}`;
        
        // Open in new tab
        await chrome.tabs.create({ url: driggsmanUrl, active: true });
        
        showStatus(`Opened driggsman with full domain: ${fullDomain}`, 'success');
        
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
        
      } catch (urlError) {
        showStatus('Invalid URL in current tab', 'error');
      }
      
    } catch (error) {
      console.error('Error opening driggsman with subdomains:', error);
      showStatus('Failed to open driggsman', 'error');
    } finally {
      driggsmanSubBtn.classList.remove('loading');
    }
  });

  // WP Pusher HTTPS button - Links to https version
  wppusherHttpsBtn.addEventListener('click', async function() {
    try {
      // Add loading state
      wppusherHttpsBtn.classList.add('loading');
      
      // Get current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.url) {
        showStatus('Cannot access current tab URL', 'error');
        wppusherHttpsBtn.classList.remove('loading');
        return;
      }
      
      try {
        const url = new URL(activeTab.url);
        const domain = url.hostname;
        
        // Create HTTPS WP Pusher URL
        const wppusherUrl = `https://${domain}/wp-admin/admin.php?page=wppusher-plugins`;
        
        // Open in new tab
        await chrome.tabs.create({ url: wppusherUrl, active: true });
        
        showStatus(`Opened WP Pusher plugins page (HTTPS)`, 'success');
        
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
        
      } catch (urlError) {
        showStatus('Invalid URL in current tab', 'error');
      }
      
    } catch (error) {
      console.error('Error opening WP Pusher HTTPS:', error);
      showStatus('Failed to open WP Pusher page', 'error');
    } finally {
      wppusherHttpsBtn.classList.remove('loading');
    }
  });

  // WP Pusher HTTP button - Links to http version
  wppusherHttpBtn.addEventListener('click', async function() {
    try {
      // Add loading state
      wppusherHttpBtn.classList.add('loading');
      
      // Get current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.url) {
        showStatus('Cannot access current tab URL', 'error');
        wppusherHttpBtn.classList.remove('loading');
        return;
      }
      
      try {
        const url = new URL(activeTab.url);
        const domain = url.hostname;
        
        // Create HTTP WP Pusher URL
        const wppusherUrl = `http://${domain}/wp-admin/admin.php?page=wppusher-plugins`;
        
        // Open in new tab
        await chrome.tabs.create({ url: wppusherUrl, active: true });
        
        showStatus(`Opened WP Pusher plugins page (HTTP)`, 'success');
        
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
        
      } catch (urlError) {
        showStatus('Invalid URL in current tab', 'error');
      }
      
    } catch (error) {
      console.error('Error opening WP Pusher HTTP:', error);
      showStatus('Failed to open WP Pusher page', 'error');
    } finally {
      wppusherHttpBtn.classList.remove('loading');
    }
  });

  // Helper function to show status messages
  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type} show`;
    
    // Hide message after 3 seconds
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 3000);
  }

  // Environment toggle functionality
  let currentEnvironment = 'localhost'; // Default to localhost
  
  const localhostBtn = document.getElementById('localhostBtn');
  const cloudBtn = document.getElementById('cloudBtn');
  
  function updateEnvironment(env) {
    currentEnvironment = env;
    
    // Update button states
    if (env === 'localhost') {
      localhostBtn.classList.add('env-btn-active');
      cloudBtn.classList.remove('env-btn-active');
    } else {
      cloudBtn.classList.add('env-btn-active');
      localhostBtn.classList.remove('env-btn-active');
    }
  }
  
  localhostBtn.addEventListener('click', () => updateEnvironment('localhost'));
  cloudBtn.addEventListener('click', () => updateEnvironment('cloud'));
  
  // Dromdori functionality
  async function getCurrentDomain() {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.url) {
        return null;
      }
      const url = new URL(activeTab.url);
      return url.hostname;
    } catch (error) {
      console.error('Error getting current domain:', error);
      return null;
    }
  }
  
  function getAppBaseUrl() {
    return currentEnvironment === 'cloud' ? 'https://snef.me' : 'http://localhost:3000';
  }

  // Direct button handlers
  document.getElementById('dromdoriDromBtn').addEventListener('click', async function() {
    const domain = await getCurrentDomain();
    if (domain) {
      const baseUrl = getAppBaseUrl();
      const dromUrl = `${baseUrl}/drom?sitesentered=${encodeURIComponent(domain)}&activefilterchamber=daylight&showmainchamberboxes=no&showtundrachamber=yes&sitesperview=1&speccolumnpage=1`;
      chrome.tabs.create({ url: dromUrl });
    }
  });

  document.getElementById('dromdoriRupBtn').addEventListener('click', async function() {
    const domain = await getCurrentDomain();
    if (domain) {
      const rupUrl = `http://${domain}/wp-admin/admin.php?page=rup_driggs_mar`;
      chrome.tabs.create({ url: rupUrl });
    }
  });

  document.getElementById('dromdoriGroveBtn').addEventListener('click', async function() {
    const domain = await getCurrentDomain();
    if (domain) {
      const groveUrl = `http://${domain}/wp-admin/admin.php?page=grove_driggs_mar`;
      chrome.tabs.create({ url: groveUrl });
    }
  });

  document.getElementById('dromdoriBeaconBtn').addEventListener('click', async function() {
    const domain = await getCurrentDomain();
    if (domain) {
      const beaconUrl = `http://${domain}/wp-admin/admin.php?page=beacon_driggs_mar`;
      chrome.tabs.create({ url: beaconUrl });
    }
  });

  // Dropdown functionality
  const klocDropdownBtn = document.getElementById('klocDropdownBtn');
  const klocDropdownMenu = document.getElementById('klocDropdownMenu');
  const kservDropdownBtn = document.getElementById('kservDropdownBtn');
  const kservDropdownMenu = document.getElementById('kservDropdownMenu');

  klocDropdownBtn.addEventListener('click', function() {
    klocDropdownMenu.classList.toggle('show');
    kservDropdownMenu.classList.remove('show'); // Close other dropdown
  });

  kservDropdownBtn.addEventListener('click', function() {
    kservDropdownMenu.classList.toggle('show');
    klocDropdownMenu.classList.remove('show'); // Close other dropdown
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', function(event) {
    if (!klocDropdownBtn.contains(event.target) && !klocDropdownMenu.contains(event.target)) {
      klocDropdownMenu.classList.remove('show');
    }
    if (!kservDropdownBtn.contains(event.target) && !kservDropdownMenu.contains(event.target)) {
      kservDropdownMenu.classList.remove('show');
    }
  });

  // Kloc dropdown items
  document.getElementById('klocRupBtn').addEventListener('click', async function() {
    const domain = await getCurrentDomain();
    if (domain) {
      const url = `http://${domain}/wp-admin/admin.php?page=rup_locations_mar`;
      chrome.tabs.create({ url: url });
    }
  });

  document.getElementById('klocGroveBtn').addEventListener('click', async function() {
    const domain = await getCurrentDomain();
    if (domain) {
      const url = `http://${domain}/wp-admin/admin.php?page=grove_locations_mar`;
      chrome.tabs.create({ url: url });
    }
  });

  document.getElementById('klocBeaconBtn').addEventListener('click', async function() {
    const domain = await getCurrentDomain();
    if (domain) {
      const url = `http://${domain}/wp-admin/admin.php?page=beacon_locations_mar`;
      chrome.tabs.create({ url: url });
    }
  });

  // Kserv dropdown items
  document.getElementById('kservRupBtn').addEventListener('click', async function() {
    const domain = await getCurrentDomain();
    if (domain) {
      const url = `http://${domain}/wp-admin/admin.php?page=rup_services_mar`;
      chrome.tabs.create({ url: url });
    }
  });

  document.getElementById('kservGroveBtn').addEventListener('click', async function() {
    const domain = await getCurrentDomain();
    if (domain) {
      const url = `http://${domain}/wp-admin/admin.php?page=grove_services_mar`;
      chrome.tabs.create({ url: url });
    }
  });

  document.getElementById('kservBeaconBtn').addEventListener('click', async function() {
    const domain = await getCurrentDomain();
    if (domain) {
      const url = `http://${domain}/wp-admin/admin.php?page=beacon_services_mar`;
      chrome.tabs.create({ url: url });
    }
  });
});