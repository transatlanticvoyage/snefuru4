let streamData = {};
let currentStream = null;
let selectedFolder = null;
let finderHistory = [];
let finderHistoryIndex = -1;
let finderColumns = [];
let finderSelectedFiles = new Set();
let finderCurrentPath = '';
let finderSortBy = 'name';
let finderViewMode = 'column';
let finderSearchTerm = '';
let recentPaths = [];
let currentSelectedFolderPath = null;

document.addEventListener('DOMContentLoaded', async () => {
  initializeTabs();
  initializeAddFolderButton();
  initializeDragAndDrop();
  initializeContextMenu();
  initializeFinderView();
  initializeStreamManagement();
  initializeFinderResize();
  await initializeCloudStorage();
  await loadConfiguration();
});

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const groupId = button.dataset.group;
      
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      document.querySelectorAll('.stream-group').forEach(group => {
        group.classList.remove('active');
      });
      document.getElementById(`group-${groupId}`).classList.add('active');
      
      const addFolderBtn = document.getElementById('add-folder-btn');
      const streamManagement = document.getElementById('stream-management');
      
      if (groupId === 'finder') {
        addFolderBtn.style.display = 'none';
        streamManagement.style.display = 'flex';
        if (finderColumns.length === 0) {
          const downloadsPath = await window.electronAPI.getDownloadsPath();
          navigateToFolder(downloadsPath);
        }
      } else {
        addFolderBtn.style.display = 'block';
        streamManagement.style.display = 'none';
      }
    });
  });
}

function initializeAddFolderButton() {
  const addFolderBtn = document.getElementById('add-folder-btn');
  addFolderBtn.addEventListener('click', async () => {
    const folders = await window.electronAPI.selectFolder();
    if (folders) {
      const activeStream = getActiveStream();
      if (activeStream) {
        folders.forEach(folderPath => {
          addFolderToStream(activeStream, folderPath);
        });
        await saveConfiguration();
      }
    }
  });
}

function getActiveStream() {
  const activeGroup = document.querySelector('.stream-group.active');
  const firstEmptyStream = activeGroup.querySelector('.stream:has(.folder-list:empty)');
  if (firstEmptyStream) {
    return firstEmptyStream.dataset.streamId;
  }
  return activeGroup.querySelector('.stream').dataset.streamId;
}

function initializeDragAndDrop() {
  document.querySelectorAll('.stream').forEach(stream => {
    const dropZone = stream.querySelector('.drop-zone');
    const streamContent = stream.querySelector('.stream-content');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      streamContent.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
      streamContent.addEventListener(eventName, () => {
        dropZone.classList.add('drag-over');
      }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      streamContent.addEventListener(eventName, () => {
        dropZone.classList.remove('drag-over');
      }, false);
    });
    
    streamContent.addEventListener('drop', async (e) => {
      const files = Array.from(e.dataTransfer.files);
      const streamId = stream.dataset.streamId;
      
      for (const file of files) {
        if (file.path && file.type === '') {
          addFolderToStream(streamId, file.path);
        }
      }
      await saveConfiguration();
    }, false);
  });
}

function addFolderToStream(streamId, folderPath) {
  if (!streamData[streamId]) {
    streamData[streamId] = [];
  }
  
  if (!streamData[streamId].includes(folderPath)) {
    streamData[streamId].push(folderPath);
    renderStream(streamId);
  }
}

function renderStream(streamId) {
  const stream = document.querySelector(`[data-stream-id="${streamId}"]`);
  const folderList = stream.querySelector('.folder-list');
  
  folderList.innerHTML = '';
  
  if (!streamData[streamId] || streamData[streamId].length === 0) {
    return;
  }
  
  streamData[streamId].forEach(folderPath => {
    const folderName = folderPath.split('/').pop() || folderPath;
    const li = document.createElement('li');
    li.className = 'folder-item';
    li.dataset.path = folderPath;
    li.innerHTML = `
      <span class="folder-icon"></span>
      <span class="folder-name">${folderName}</span>
    `;
    
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      selectFolder(li, folderPath);
    });
    
    li.addEventListener('dblclick', async (e) => {
      e.stopPropagation();
      await window.electronAPI.openFolder(folderPath);
    });
    
    li.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, streamId, folderPath);
    });
    
    folderList.appendChild(li);
    
    loadSubfolders(li, folderPath);
  });
}

async function loadSubfolders(parentElement, folderPath) {
  const subfolders = await window.electronAPI.getFolderContents(folderPath);
  
  if (subfolders.length > 0) {
    parentElement.classList.add('expandable');
    
    const subList = document.createElement('ul');
    subList.className = 'subfolder-list';
    
    subfolders.slice(0, 10).forEach(subfolder => {
      const li = document.createElement('li');
      li.className = 'folder-item';
      li.dataset.path = subfolder.path;
      li.innerHTML = `
        <span class="folder-icon"></span>
        <span class="folder-name">${subfolder.name}</span>
      `;
      
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        selectFolder(li, subfolder.path);
      });
      
      li.addEventListener('dblclick', async (e) => {
        e.stopPropagation();
        await window.electronAPI.openFolder(subfolder.path);
      });
      
      subList.appendChild(li);
    });
    
    parentElement.appendChild(subList);
    
    parentElement.addEventListener('click', (e) => {
      if (e.target === parentElement || e.target.parentElement === parentElement) {
        parentElement.classList.toggle('expanded');
        subList.classList.toggle('expanded');
      }
    });
  }
}

function selectFolder(element, folderPath) {
  document.querySelectorAll('.folder-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  element.classList.add('selected');
  selectedFolder = folderPath;
}

function initializeContextMenu() {
  const contextMenu = document.getElementById('folder-context-menu');
  
  document.addEventListener('click', () => {
    contextMenu.classList.remove('visible');
  });
  
  contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', async () => {
      const action = item.dataset.action;
      
      if (action === 'open' && selectedFolder) {
        await window.electronAPI.openFolder(selectedFolder);
      } else if (action === 'reveal' && selectedFolder) {
        await window.electronAPI.openInFinder(selectedFolder);
      } else if (action === 'remove' && currentStream && selectedFolder) {
        removeFolderFromStream(currentStream, selectedFolder);
        await saveConfiguration();
      }
      
      contextMenu.classList.remove('visible');
    });
  });
}

function showContextMenu(x, y, streamId, folderPath) {
  const contextMenu = document.getElementById('folder-context-menu');
  currentStream = streamId;
  selectedFolder = folderPath;
  
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add('visible');
}

function removeFolderFromStream(streamId, folderPath) {
  if (streamData[streamId]) {
    const index = streamData[streamId].indexOf(folderPath);
    if (index > -1) {
      streamData[streamId].splice(index, 1);
      renderStream(streamId);
    }
  }
}

async function saveConfiguration() {
  await window.electronAPI.saveConfig(streamData);
}

async function loadConfiguration() {
  const config = await window.electronAPI.loadConfig();
  if (config) {
    streamData = config;
    Object.keys(streamData).forEach(streamId => {
      renderStream(streamId);
    });
  }
}

function initializeFinderView() {
  const backBtn = document.getElementById('finder-back');
  const forwardBtn = document.getElementById('finder-forward');
  
  backBtn.addEventListener('click', () => {
    if (finderHistoryIndex > 0) {
      finderHistoryIndex--;
      navigateToFolder(finderHistory[finderHistoryIndex], false);
    }
  });
  
  forwardBtn.addEventListener('click', () => {
    if (finderHistoryIndex < finderHistory.length - 1) {
      finderHistoryIndex++;
      navigateToFolder(finderHistory[finderHistoryIndex], false);
    }
  });
  
  // Quick access buttons
  document.querySelectorAll('.finder-quick-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pathType = btn.dataset.path;
      const path = await window.electronAPI.getSpecialPath(pathType);
      navigateToFolder(path);
    });
  });
  
  // Sidebar items
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', async () => {
      const pathType = item.dataset.path;
      const path = await window.electronAPI.getSpecialPath(pathType);
      document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      navigateToFolder(path);
    });
  });
  
  // Search functionality
  const searchInput = document.getElementById('finder-search');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      finderSearchTerm = e.target.value;
      if (finderCurrentPath) {
        renderFinderColumns();
      }
    }, 300);
  });
  
  // Sort functionality
  const sortSelect = document.getElementById('finder-sort');
  sortSelect.addEventListener('change', (e) => {
    finderSortBy = e.target.value;
    if (finderColumns.length > 0) {
      sortFinderContents();
      renderFinderColumns();
    }
  });
  
  // View mode buttons
  const viewButtons = document.querySelectorAll('.finder-view-btn');
  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      viewButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      finderViewMode = btn.dataset.view;
      renderFinderColumns();
    });
  });
  
  // New folder button
  document.getElementById('finder-new-folder').addEventListener('click', async () => {
    if (finderCurrentPath) {
      const folderName = prompt('Enter folder name:');
      if (folderName) {
        await window.electronAPI.createFolder(finderCurrentPath, folderName);
        navigateToFolder(finderCurrentPath);
      }
    }
  });
  
  // Delete button
  document.getElementById('finder-delete').addEventListener('click', async () => {
    if (finderSelectedFiles.size > 0) {
      const confirm = await window.electronAPI.confirmDelete(finderSelectedFiles.size);
      if (confirm) {
        for (const file of finderSelectedFiles) {
          await window.electronAPI.deleteFile(file);
        }
        finderSelectedFiles.clear();
        navigateToFolder(finderCurrentPath);
      }
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('group-finder').classList.contains('active')) {
      if (e.metaKey && e.key === 'a') {
        e.preventDefault();
        selectAllFiles();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (finderSelectedFiles.size > 0 && e.metaKey) {
          document.getElementById('finder-delete').click();
        }
      }
    }
  });
}

async function navigateToFolder(folderPath, addToHistory = true) {
  if (addToHistory) {
    if (finderHistoryIndex < finderHistory.length - 1) {
      finderHistory = finderHistory.slice(0, finderHistoryIndex + 1);
    }
    finderHistory.push(folderPath);
    finderHistoryIndex++;
    
    // Add to recent paths
    if (!recentPaths.includes(folderPath)) {
      recentPaths.unshift(folderPath);
      recentPaths = recentPaths.slice(0, 5);
      updateRecentPaths();
    }
  }
  
  finderCurrentPath = folderPath;
  finderSelectedFiles.clear();
  updateNavigationButtons();
  updateBreadcrumb(folderPath);
  
  const pathParts = folderPath.split('/').filter(p => p);
  const columnsToKeep = [];
  let currentPath = '';
  
  for (let i = 0; i < pathParts.length; i++) {
    currentPath += '/' + pathParts[i];
    if (i < finderColumns.length && finderColumns[i].path === currentPath) {
      columnsToKeep.push(finderColumns[i]);
    } else {
      break;
    }
  }
  
  finderColumns = columnsToKeep;
  
  await addFinderColumn(folderPath);
  
  renderFinderColumns();
}

async function addFinderColumn(folderPath) {
  let contents = await window.electronAPI.getDirectoryContents(folderPath);
  
  // Apply search filter
  if (finderSearchTerm) {
    contents = contents.filter(item => 
      item.name.toLowerCase().includes(finderSearchTerm.toLowerCase())
    );
  }
  
  // Sort contents
  contents = sortContents(contents, finderSortBy);
  
  const pathDepth = folderPath.split('/').filter(p => p).length;
  finderColumns = finderColumns.slice(0, pathDepth);
  
  finderColumns.push({
    path: folderPath,
    contents: contents,
    selectedItem: null
  });
}

function sortContents(contents, sortBy) {
  return contents.sort((a, b) => {
    // Folders always come first
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    
    switch(sortBy) {
      case 'date':
        return new Date(b.modified) - new Date(a.modified);
      case 'size':
        return b.size - a.size;
      case 'kind':
        const aExt = a.name.split('.').pop().toLowerCase();
        const bExt = b.name.split('.').pop().toLowerCase();
        return aExt.localeCompare(bExt);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

function sortFinderContents() {
  finderColumns.forEach(column => {
    column.contents = sortContents(column.contents, finderSortBy);
  });
}

function updateBreadcrumb(path) {
  const breadcrumb = document.getElementById('finder-breadcrumb');
  const parts = path.split('/').filter(p => p);
  
  breadcrumb.innerHTML = '';
  
  // Add home
  const homeItem = document.createElement('span');
  homeItem.className = 'breadcrumb-item';
  homeItem.textContent = '🏠';
  homeItem.onclick = async () => {
    const homePath = await window.electronAPI.getSpecialPath('home');
    navigateToFolder(homePath);
  };
  breadcrumb.appendChild(homeItem);
  
  let currentPath = '';
  parts.forEach((part, index) => {
    currentPath += '/' + part;
    
    const separator = document.createElement('span');
    separator.className = 'breadcrumb-separator';
    separator.textContent = ' › ';
    breadcrumb.appendChild(separator);
    
    const item = document.createElement('span');
    item.className = 'breadcrumb-item';
    item.textContent = part;
    const pathCopy = currentPath;
    item.onclick = () => navigateToFolder(pathCopy);
    breadcrumb.appendChild(item);
  });
}

function updateRecentPaths() {
  const recentsContainer = document.getElementById('sidebar-recents');
  recentsContainer.innerHTML = '';
  
  recentPaths.forEach(path => {
    const item = document.createElement('div');
    item.className = 'sidebar-item';
    const name = path.split('/').pop() || 'Root';
    item.textContent = '🕒 ' + name;
    item.onclick = () => navigateToFolder(path);
    recentsContainer.appendChild(item);
  });
}

function selectAllFiles() {
  const lastColumn = finderColumns[finderColumns.length - 1];
  if (lastColumn) {
    finderSelectedFiles.clear();
    lastColumn.contents.forEach(item => {
      finderSelectedFiles.add(lastColumn.path + '/' + item.name);
    });
    renderFinderColumns();
    updateDeleteButton();
  }
}

function updateDeleteButton() {
  const deleteBtn = document.getElementById('finder-delete');
  deleteBtn.disabled = finderSelectedFiles.size === 0;
}

function renderFinderColumns() {
  const columnsContainer = document.getElementById('finder-columns');
  columnsContainer.innerHTML = '';
  
  finderColumns.forEach((column, columnIndex) => {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'finder-column';
    
    column.contents.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = `finder-item ${item.isDirectory ? 'folder' : 'file'}`;
      if (column.selectedItem === item.name) {
        itemDiv.classList.add('selected');
      }
      
      itemDiv.innerHTML = `
        <span class="finder-item-icon"></span>
        <span class="finder-item-name">${item.name}</span>
      `;
      
      itemDiv.addEventListener('click', async (e) => {
        const itemPath = column.path + '/' + item.name;
        
        if (e.metaKey || e.ctrlKey) {
          // Multi-select
          if (finderSelectedFiles.has(itemPath)) {
            finderSelectedFiles.delete(itemPath);
            itemDiv.classList.remove('selected');
          } else {
            finderSelectedFiles.add(itemPath);
            itemDiv.classList.add('selected');
          }
        } else {
          // Single select
          finderSelectedFiles.clear();
          columnDiv.querySelectorAll('.finder-item').forEach(el => {
            el.classList.remove('selected');
          });
          
          column.selectedItem = item.name;
          itemDiv.classList.add('selected');
          finderSelectedFiles.add(itemPath);
          
          finderColumns = finderColumns.slice(0, columnIndex + 1);
          
          if (item.isDirectory) {
            const newPath = column.path + '/' + item.name;
            await addFinderColumn(newPath);
            renderFinderColumns();
            
            if (finderHistoryIndex < finderHistory.length - 1) {
              finderHistory = finderHistory.slice(0, finderHistoryIndex + 1);
            }
            finderHistory.push(newPath);
            finderHistoryIndex++;
            updateNavigationButtons();
            updateBreadcrumb(newPath);
            finderCurrentPath = newPath;
          } else {
            showPreview(item, column.path);
          }
        }
        updateDeleteButton();
        updateStreamManagementButton();
      });
      
      itemDiv.addEventListener('dblclick', async () => {
        if (!item.isDirectory) {
          await window.electronAPI.openFile(column.path + '/' + item.name);
        }
      });
      
      columnDiv.appendChild(itemDiv);
    });
    
    columnsContainer.appendChild(columnDiv);
  });
  
  setTimeout(() => {
    columnsContainer.scrollLeft = columnsContainer.scrollWidth;
  }, 10);
}

function updateNavigationButtons() {
  const backBtn = document.getElementById('finder-back');
  const forwardBtn = document.getElementById('finder-forward');
  
  backBtn.disabled = finderHistoryIndex <= 0;
  forwardBtn.disabled = finderHistoryIndex >= finderHistory.length - 1;
}

async function showPreview(item, parentPath) {
  const preview = document.getElementById('finder-preview');
  const fullPath = parentPath + '/' + item.name;
  const fileInfo = await window.electronAPI.getFileInfo(fullPath);
  
  preview.innerHTML = `
    <div class="preview-content">
      <div class="preview-icon ${item.isDirectory ? '' : 'file'}"></div>
      <div class="preview-name">${item.name}</div>
      <div class="preview-details">
        <div><strong>Kind:</strong> ${item.isDirectory ? 'Folder' : getFileType(item.name)}</div>
        <div><strong>Size:</strong> ${formatFileSize(fileInfo.size)}</div>
        <div><strong>Modified:</strong> ${new Date(fileInfo.modified).toLocaleDateString()}</div>
        <div><strong>Created:</strong> ${new Date(fileInfo.created).toLocaleDateString()}</div>
        <div><strong>Path:</strong> ${fullPath}</div>
      </div>
    </div>
  `;
  
  preview.classList.add('show');
}

function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const types = {
    'js': 'JavaScript File',
    'json': 'JSON File',
    'html': 'HTML File',
    'css': 'CSS File',
    'png': 'PNG Image',
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image',
    'pdf': 'PDF Document',
    'txt': 'Text File',
    'md': 'Markdown File'
  };
  return types[ext] || ext.toUpperCase() + ' File';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function initializeCloudStorage() {
  try {
    const cloudServices = await window.electronAPI.getAvailableCloudStorage();
    const cloudStorageContainer = document.getElementById('sidebar-cloud-storage');
    const cloudStorageSection = document.getElementById('cloud-storage-section');
    
    if (cloudServices.length === 0) {
      cloudStorageSection.style.display = 'none';
      return;
    }
    
    cloudStorageContainer.innerHTML = '';
    
    cloudServices.forEach(service => {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      item.textContent = service.name;
      item.dataset.path = service.id;
      
      item.addEventListener('click', async () => {
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        try {
          const path = await window.electronAPI.getSpecialPath(service.id);
          navigateToFolder(path);
        } catch (error) {
          console.error('Error accessing cloud storage:', error);
          alert(`Could not access ${service.name}. It may not be available or configured.`);
        }
      });
      
      cloudStorageContainer.appendChild(item);
    });
    
    cloudStorageSection.style.display = 'block';
  } catch (error) {
    console.error('Error initializing cloud storage:', error);
    document.getElementById('cloud-storage-section').style.display = 'none';
  }
}

function initializeStreamManagement() {
  const streamSelect = document.getElementById('stream-select');
  const addToStreamBtn = document.getElementById('add-to-stream-btn');
  
  // Enable/disable button based on selection
  streamSelect.addEventListener('change', () => {
    updateStreamManagementButton();
  });
  
  // Handle add to stream button click
  addToStreamBtn.addEventListener('click', async () => {
    const selectedStreamId = streamSelect.value;
    
    if (!selectedStreamId || finderSelectedFiles.size === 0) return;
    
    // Get the first selected item and check if it's a directory
    const firstSelectedPath = Array.from(finderSelectedFiles)[0];
    
    // Check if the selected item is a directory
    const isDirectory = await window.electronAPI.checkPathExists(firstSelectedPath);
    if (!isDirectory) return;
    
    // Add the folder to the chosen stream
    addFolderToStream(selectedStreamId, firstSelectedPath);
    await saveConfiguration();
    
    // Show success feedback
    const originalText = addToStreamBtn.textContent;
    addToStreamBtn.textContent = 'Added!';
    addToStreamBtn.style.background = '#28a745';
    
    setTimeout(() => {
      addToStreamBtn.textContent = originalText;
      addToStreamBtn.style.background = '#007AFF';
    }, 1500);
    
    // Reset selection
    streamSelect.value = '';
    updateStreamManagementButton();
  });
}

function updateStreamManagementButton() {
  const streamSelect = document.getElementById('stream-select');
  const addToStreamBtn = document.getElementById('add-to-stream-btn');
  
  // Check if we have a stream selected and at least one item selected
  const hasSelectedStream = streamSelect.value !== '';
  const hasSelectedItems = finderSelectedFiles.size > 0;
  
  const shouldEnable = hasSelectedStream && hasSelectedItems;
  addToStreamBtn.disabled = !shouldEnable;
  
  // Update button text based on selection count
  if (hasSelectedItems) {
    const itemCount = finderSelectedFiles.size;
    addToStreamBtn.textContent = `Add Selected ${itemCount > 1 ? 'Items' : 'Item'} To Stream`;
  } else {
    addToStreamBtn.textContent = 'Add Selected Folder To Stream';
  }
}

function initializeFinderResize() {
  const resizeHandle = document.getElementById('finder-resize-handle');
  const finderPreview = document.getElementById('finder-preview');
  const finderColumns = document.getElementById('finder-columns');
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;
  
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = finderPreview.offsetWidth;
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const deltaX = startX - e.clientX; // Reverse direction since we're resizing from the right
    const newWidth = Math.max(200, Math.min(500, startWidth + deltaX));
    
    finderPreview.style.width = newWidth + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
  
  // Handle double-click to auto-resize
  resizeHandle.addEventListener('dblclick', () => {
    finderPreview.style.width = '300px'; // Reset to default width
  });
}