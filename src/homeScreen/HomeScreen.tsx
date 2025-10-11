import { useState } from "react";

import LoadScreen from '@/loadScreen/LoadScreen';
import TerminalScreen from "./TerminalScreen";

function HomeScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  if (isLoading) return <LoadScreen onComplete={() => setIsLoading(false)} />;

  return <TerminalScreen />;
}

export default HomeScreen;