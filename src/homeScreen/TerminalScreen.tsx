import React, { useState, useRef, useEffect } from 'react';
import './TerminalLogin.css'; // This file will be created
import { init } from '@/homeScreen/interactions/initialization';
import LoadScreen from '@/loadScreen/LoadScreen';
import { submitPrompt } from '@/homeScreen/interactions/prompt';

type FsNode = {
  [key: string]: FsNode;
};

type LoginStep = 'username' | 'password' | 'loggedIn';

export default function TerminalScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fs, setFs] = useState<FsNode | null>(null);
  const [lines, setLines] = useState<string[]>([
    'Welcome to Santyx OS v0.1',
  ]);
  const [input, setInput] = useState<string>('');
  const [cwd, setCwd] = useState<string>('/');
  const [llmResponse, setLlmResponse] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [loginStep, setLoginStep] = useState<LoginStep>('username');
  const [username, setUsername] = useState<string>('');

  const promptSymbol = loginStep === 'loggedIn' ? `$ ${username}@santyx:${cwd}$` : loginStep === 'username' ? 'Username:' : 'Password:';

  useEffect(() => {
    init().then(isLlmConnected => {
      if (!isLlmConnected) {
        setIsLoading(true);
      }
    });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  useEffect(() => {
    if (llmResponse) {
      setLines(prev => {
        const newLines = [...prev];
        newLines[newLines.length - 1] = llmResponse;
        return newLines;
      });
      setLlmResponse('');
    }
  }, [llmResponse]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (isLoading) return <LoadScreen onComplete={() => setIsLoading(false)} />;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const createInitialFs = (user: string) => {
    const root: FsNode = {
      home: {
        [user]: {},
      },
      tmp: {},
      etc: {},
      var: {},
    };
    setFs(root);
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;

    if (loginStep === 'username') {
      // Create the FS first, so username is available for cwd
      createInitialFs(value);
      setUsername(value);
      setLines([...lines, `${promptSymbol} ${value}`]);
      setLoginStep('password');
      // We set cwd here so the prompt in the password step shows the future path
      setCwd(`/home/${value}`);
    } else { // password step
      // Any password works for now
      setLines([...lines, `${promptSymbol} *****`, 'Type "help" to see available commands.']);
      setLoginStep('loggedIn');
    }
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (loginStep !== 'loggedIn') {
      handleLogin(e);
      return;
    }

    e.preventDefault();
    const command = input.trim();
    if (!command) return;

    const commandLine = `${promptSymbol} ${command}`;

    if (command === 'hello') {
      setLines([
        ...lines,
        commandLine,
        '...waiting for OS response...'
      ]);
      submitPrompt(
        "You are an OS. You should respond with a welcome message when addressed",
        () => setInput(''),
        (response: string) => setLlmResponse(response)
      );
      return;
    }
    
    let output = '';
    if (command === 'help') {
      output = [
        'Available commands:',
        'help        Show this help message',
        'ls          List directory contents',
        'clear       Clear the terminal',
        'cd <dir>    Change directory',
        'hello       Get a welcome message from the OS',
      ].join('\n');
    } else if (command.startsWith('ls')) {
      const parts = command.split(' ').filter(p => p);
      let targetPath = cwd;

      if (parts.length > 1) {
        if (parts[1] === '..') {
          targetPath = cwd === '/' ? '/' : cwd.substring(0, cwd.lastIndexOf('/')) || '/';
        } else {
          output = `ls: cannot access '${parts[1]}': No such file or directory`;
        }
      }

      if (!output && fs) { // Ensure fs is not null
        const pathParts = targetPath.split('/').filter(p => p);
        let currentNode: FsNode | null = fs;
        for (const part of pathParts) {
          if (currentNode && currentNode[part]) {
            currentNode = currentNode[part];
          } else {
            currentNode = null;
            break;
          }
        }
        output = currentNode ? Object.keys(currentNode).join('  ') : `ls: cannot access '${targetPath}': No such file or directory`;
      }
    } else if (command === 'clear') {
      setLines([]);
      setInput('');
      return;
    } else if (command.startsWith('cd ')) {
      const target = command.slice(3).trim();
      let newPath = cwd;
      if (target === '..') {
        newPath = cwd === '/' ? '/' : cwd.substring(0, cwd.lastIndexOf('/')) || '/';
      } else if (fs) { // Ensure fs is not null
        const tempPath = target.startsWith('/') ? target : (cwd === '/' ? `/${target}` : `${cwd}/${target}`);
        const pathParts = tempPath.split('/').filter(p => p);
        let currentNode: FsNode | null = fs;
        let isValid = true;
        for (const part of pathParts) {
          if (currentNode && currentNode[part]) {
            currentNode = currentNode[part];
          } else {
            isValid = false;
            break;
          }
        }
        if (isValid) {
          newPath = tempPath === '' ? '/' : tempPath;
        } else {
          output = `cd: no such file or directory: ${target}`;
        }
      }
      setCwd(newPath);
      output = '';
    } else {
      output = `Command not found: ${command}`;
    }

    setLines([
      ...lines,
      commandLine,
      ...(output ? [output] : []),
    ]);
    setInput('');
  };

  return (
    <div className="terminal-bg" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-window">
        {lines.map((line, idx) => <div key={idx}>{line}</div>)}
        <div ref={terminalEndRef} />
      </div>
      <div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <span className="terminal-prompt">{promptSymbol} </span>
          <input
            ref={inputRef}
            className="terminal-input"
            value={input}
            onChange={handleInput}
            type={loginStep === 'password' ? 'password' : 'text'}
            autoFocus
          />
          <button type="submit" style={{ display: 'none' }} />
        </form>
      </div>
    </div>
  );
}