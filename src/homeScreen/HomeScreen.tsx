import { useEffect, useState } from "react";

import styles from './HomeScreen.module.css';
import { init } from "./interactions/initialization";
import LoadScreen from '@/loadScreen/LoadScreen';
import TopBar from '@/components/topBar/TopBar';
import TerminalScreen from "./TerminalScreen";

function HomeScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (isLoading) return;

    init().then(isLlmConnected => {
      if (!isLlmConnected) setIsLoading(true);
    });
  }, [isLoading]);

  if (isLoading) return <LoadScreen onComplete={() => setIsLoading(false)} />;
  
  return (
    <div className={styles.container}>
      <TopBar />
      <div className={styles.content}>
        <TerminalScreen />
      </div>
    </div>
  );
}

export default HomeScreen;