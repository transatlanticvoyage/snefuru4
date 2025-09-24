document.addEventListener('DOMContentLoaded', async () => {
    const syncButton = document.getElementById('syncButton');
    const status = document.getElementById('status');
    const result = document.getElementById('result');
    const spinner = document.getElementById('spinner');
    const buttonText = document.querySelector('.button-text');
    
    // Load directory information on startup
    await loadDirectoryInfo();
    
    syncButton.addEventListener('click', async () => {
        try {
            // Update UI to show syncing state
            syncButton.disabled = true;
            spinner.style.display = 'block';
            buttonText.textContent = 'Syncing...';
            status.textContent = 'Running Blumenthal Grove Sync...';
            status.className = 'status syncing';
            result.style.display = 'none';
            
            // Run the sync
            const response = await window.electronAPI.runBlumenthalSync();
            
            // Update UI based on result
            if (response.success) {
                status.textContent = 'Sync Complete!';
                status.className = 'status success';
                result.textContent = response.details;
                result.style.display = 'block';
                
                // Reload directory info to update status
                await loadDirectoryInfo();
            } else {
                status.textContent = 'Sync Failed';
                status.className = 'status error';
                result.textContent = response.message + '\\n\\n' + response.details;
                result.style.display = 'block';
            }
            
        } catch (error) {
            status.textContent = 'Error occurred';
            status.className = 'status error';
            result.textContent = error.toString();
            result.style.display = 'block';
        } finally {
            // Reset button state
            syncButton.disabled = false;
            spinner.style.display = 'none';
            buttonText.textContent = 'Run Blumenthal Grove Sync';
            
            // Auto-reset status after 5 seconds
            setTimeout(() => {
                if (status.className.includes('success') || status.className.includes('error')) {
                    status.textContent = 'Ready';
                    status.className = 'status ready';
                    result.style.display = 'none';
                }
            }, 5000);
        }
    });
});

async function loadDirectoryInfo() {
    try {
        const info = await window.electronAPI.getDirectoryInfo();
        
        document.getElementById('sourcePath').textContent = info.source;
        document.getElementById('targetPath').textContent = info.target;
        
        const sourceStatus = document.getElementById('sourceStatus');
        const targetStatus = document.getElementById('targetStatus');
        
        if (info.sourceExists) {
            sourceStatus.textContent = '●';
            sourceStatus.className = 'status-icon exists';
            sourceStatus.title = 'Directory exists';
        } else {
            sourceStatus.textContent = '●';
            sourceStatus.className = 'status-icon missing';
            sourceStatus.title = 'Directory not found';
        }
        
        if (info.targetExists) {
            targetStatus.textContent = '●';
            targetStatus.className = 'status-icon exists';
            targetStatus.title = 'Directory exists';
        } else {
            targetStatus.textContent = '●';
            targetStatus.className = 'status-icon missing';
            targetStatus.title = 'Directory not found';
        }
        
    } catch (error) {
        console.error('Failed to load directory info:', error);
    }
}