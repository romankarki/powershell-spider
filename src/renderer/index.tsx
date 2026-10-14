import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useTerminalStore } from './state/terminal-store';
import { startSessionPersistence } from './state/session';
import './styles/global.css';
import './styles/terminal.css';

startSessionPersistence(useTerminalStore);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
