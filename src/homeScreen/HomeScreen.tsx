import { useState } from "react";

import LoadScreen from '@/loadScreen/LoadScreen';
import TerminalScreen from './TerminalScreen';

type ScreenStatus = 'loading' | 'ready' | 'error';

function HomeScreen() {
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLoadError = (message: string) => {
    setErrorMessage(message);
    setStatus('error');
  };

  if (status === 'loading') return <LoadScreen onComplete={() => setStatus('ready')} onError={handleLoadError} />;
  if (status === 'error') return <div className="error-screen">Error: {errorMessage}</div>;
  return <TerminalScreen />; // status === 'ready'
}

export default HomeScreen;