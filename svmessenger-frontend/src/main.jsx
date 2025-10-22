import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/svmessenger.css';

// Монтирай React app само ако root element съществува
const rootElement = document.getElementById('svmessenger-root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.warn('SVMessenger: Root element #svmessenger-root not found');
}
