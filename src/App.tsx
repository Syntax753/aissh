import { useState } from "react";
import HomeScreen from "./homeScreen/HomeScreen";
import TerminalLogin from "./pages/HomeScreen"; // your login screen
import TerminalScreen from "./pages/TerminalScreen"; // your shell

function App() {
  const [page, setPage] = useState<'chat' | 'login' | 'terminal'>('login');

  // Pass navigation as props
  if (page === 'login') {
    return <TerminalLogin onLogin={() => setPage('terminal')} />;
  }
  if (page === 'terminal') {
    return <TerminalScreen onExit={() => setPage('chat')} />;
  }
  return <HomeScreen />;
}

export default App;