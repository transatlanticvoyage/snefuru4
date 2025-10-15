import React from 'react';
import ReactDOM from 'react-dom/client';
import FilegunPage from './components/filegun/FilegunPageSimple';
import './styles/tailwind.css';

// Global function to mount React components in Electron
window.mountReactComponent = (componentName, elementId, props = {}) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const root = ReactDOM.createRoot(element);
  
  switch (componentName) {
    case 'FilegunPage':
      root.render(<FilegunPage {...props} />);
      break;
    default:
      console.error(`Component "${componentName}" not found`);
  }
};

// Export for use in renderer
export { FilegunPage };