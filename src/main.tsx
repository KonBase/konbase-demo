import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter, Link } from 'react-router-dom';
import App from './App';
import './index.css';

// Extend the Window interface to include clarity
declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

// Determine if we're running on GitHub Pages
const isGitHubPages = window.location.hostname.includes('github.io');

// Use HashRouter for GitHub Pages deployment, BrowserRouter for other environments
const Router = isGitHubPages ? HashRouter : BrowserRouter;

// Log routing mode for debugging
if (process.env.NODE_ENV !== 'production') {
  console.log(`Using ${isGitHubPages ? 'HashRouter' : 'BrowserRouter'} for routing`);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
