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
      setLines([...lines, `${promptSymbol} *****`, 'Type "help" to see available commands.', '']);
      setLoginStep('loggedIn');
    }
    setInput('');
  };

  const resolvePath = (path: string): { node: FsNode | null, fullPath: string } => {
    if (!fs) return { node: null, fullPath: '' };

    const fullPath = path.startsWith('/') ? path : (cwd === '/' ? `/${path}` : `${cwd}/${path}`);
    const parts = fullPath.split('/').filter(p => p);

    let currentNode: FsNode | null = fs;
    for (const part of parts) {
      if (currentNode && currentNode[part]) {
        currentNode = currentNode[part];
      } else {
        return { node: null, fullPath };
      }
    }

    // Handle resolving to root '/'
    return { node: currentNode, fullPath: fullPath === '' ? '/' : fullPath };
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

    if (command.startsWith('hello')) {
      const prompt = command.substring('hello'.length).trim();
      setLines([
        ...lines,
        commandLine,
        '...waiting for OS response...'
      ]);
      submitPrompt(
        "You are a helpful OS and your duty is to answer the user",
        prompt,
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

      const pathArg = parts.length > 1 ? parts[1] : null;

      if (pathArg) {
        if (pathArg === '..') {
          targetPath = cwd === '/' ? '/' : cwd.substring(0, cwd.lastIndexOf('/')) || '/';
        } else {
          const { node } = resolvePath(pathArg);
          if (node) {
            output = Object.keys(node).join('  ');
          } else {
            output = `ls: cannot access '${pathArg}': No such file or directory`;
          }
        }
      }

      if (!output) { // For 'ls' without args, or 'ls ..'
        const { node } = resolvePath(targetPath);
        output = node ? Object.keys(node).join('  ') : `ls: cannot access '${targetPath}': No such file or directory`;
      }
    } else if (command === 'clear') {
      setLines([]);
      setInput('');
      return;
    } else if (command.startsWith('cd ')) {
      const target = command.slice(3).trim();
      if (target === '..') {
        setCwd(cwd === '/' ? '/' : cwd.substring(0, cwd.lastIndexOf('/')) || '/');
      } else {
        const { node, fullPath } = resolvePath(target);
        if (node) {
          setCwd(fullPath);
        } else {
          output = `cd: no such file or directory: ${target}`;
        }
      }
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