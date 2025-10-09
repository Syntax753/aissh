import { useState } from 'react';
import styles from './HomeScreen.module.css';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // For now, any username/password will work
    if (username) {
      onLogin(username);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className={styles.loginContainer}>
      <pre className={styles.loginText}>Santyx OS v0.1</pre>
      <p className={styles.loginText}>Username: <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={styles.loginInput} autoFocus /></p>
      <p className={styles.loginText}>Password: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} className={styles.loginInput} /></p>
    </div>
  );
}

export default LoginScreen;