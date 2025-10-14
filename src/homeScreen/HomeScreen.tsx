import { useState, useRef, useEffect } from "react";

import LoadScreen from '@/loadScreen/LoadScreen';
import TerminalScreen from './TerminalScreen';

type ScreenStatus = 'loading' | 'ready' | 'error';

function HomeScreen() {
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const terminalWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalWindowRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalWindowRef.current;
      // Only auto-scroll if user is near the bottom
      if (scrollHeight - scrollTop <= clientHeight + 20) { // 20px tolerance
        terminalWindowRef.current.scrollTop = terminalWindowRef.current.scrollHeight;
      }
    }
  }); // Re-run on every render to catch all updates

  const handleLoadError = (message: string) => {
    setErrorMessage(message);
    setStatus('error');
  };

  if (status === 'loading') return <LoadScreen onComplete={() => setStatus('ready')} onError={handleLoadError} />;
  if (status === 'error') {
    return (
      <div className="terminal-bg">
        <div className="terminal-window">Error: {errorMessage}</div>
      </div>
    );
  }
  return (
    <div ref={terminalWindowRef} style={{ height: '100%', overflowY: 'auto' }}>
      <TerminalScreen />
    </div>
  ); // status === 'ready'
}

export default HomeScreen;