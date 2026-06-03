import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('[LearnProof] #root element not found');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
