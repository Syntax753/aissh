import React, { useState, useRef, useEffect } from 'react';
import './TerminalLogin.css';

const initialFS = {
  '/': ['home', 'tmp', 'etc', 'var'],
  '/home': ['user'],
  '/tmp': [],
  '/etc': [],
  '/var': [],
  '/home/user': [],
};

export default function TerminalScreen() {
  const [lines, setLines] = useState([
    'Welcome to Santyx OS v0.1',
    'Type "help" to see available commands.',
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('/home/user');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInput = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const command = input.trim();
    if (!command) return;

    let output = '';
    if (command === 'help') {
      output = [
        'Available commands:',
        'help        Show this help message',
        'ls          List directory contents',
        'clear       Clear the terminal',
        'cd <dir>    Change directory',
      ].join('\n');
    } else if (command === 'ls') {
      output = initialFS[cwd]?.join('  ') || '';
    } else if (command === 'clear') {
      setLines([]);
      setInput('');
      return;
    } else if (command.startsWith('cd ')) {
      const target = command.slice(3).trim();
      let newPath = '';
      if (target === '..') {
        if (cwd === '/') {
          newPath = '/';
        } else {
          newPath = cwd.substring(0, cwd.lastIndexOf('/')) || '/';
        }
      } else if (target.startsWith('/')) {
        newPath = initialFS[target] ? target : cwd;
      } else {
        newPath = initialFS[`${cwd}/${target}`] ? `${cwd}/${target}` : cwd;
      }
      setCwd(newPath);
      output = '';
    } else {
      output = `Command not found: ${command}`;
    }

    setLines([
      ...lines,
      `$ user@santyx:${cwd}$ ${command}`,
      ...(output ? [output] : []),
    ]);
    setInput('');
  };

  return (
    <div className="terminal-bg">
      <div className="terminal-window" style={{ minHeight: 400 }}>
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1em' }}>
          {lines.map((line, idx) => <div key={idx}>{line}</div>)}
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <span style={{ color: '#00ff00' }}>$ user@santyx:{cwd}$ </span>
          <input
            ref={inputRef}
            className="terminal-input"
            style={{ width: '70%' }}
            value={input}
            onChange={handleInput}
            autoFocus
          />
          <button type="submit" style={{ display: 'none' }} />
        </form>
      </div>
    </div>
  );
}