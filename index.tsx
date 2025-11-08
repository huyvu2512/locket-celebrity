
import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Corrected module import path. The error "File 'file:///App.tsx' is not a module" indicates a problem resolving the App component. While this was mainly due to App.tsx having invalid content, explicitly adding the extension ensures proper resolution.
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);