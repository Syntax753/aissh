import React, { useState } from 'react';
import './TerminalLogin.css';

interface Props {
  onLogin: () => void;
}

export default function TerminalLogin({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="terminal-bg">
      <div className="terminal-window">
        <pre className="terminal-header">Santyx OS v0.1</pre>
        <form className="login-form" autoComplete="off" onSubmit={handleSubmit}>
          <label className="terminal-label">
            login: <input
              type="text"
              className="terminal-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </label>
          <br />
          <label className="terminal-label">
            password: <input
              type="password"
              className="terminal-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          <br />
          <button type="submit" style={{display: 'none'}} />
        </form>
      </div>
    </div>
  );
}