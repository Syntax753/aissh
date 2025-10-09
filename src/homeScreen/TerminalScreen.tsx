import React, { useState, useRef, useEffect } from 'react';
import './TerminalLogin.css'; // This file will be created
import { init } from '@/homeScreen/interactions/initialization';
import LoadScreen from '@/loadScreen/LoadScreen';
import { submitPrompt } from '@/homeScreen/interactions/prompt';

let personalityHash = '';
type FsNode = {
  [key: string]: FsNode;
};

type LoginStep = 'username' | 'password' | 'loggedIn';

const FILE_GENERATION_SYSTEM_PROMPT =
  "You are a linux administrator and your persona is determined by the following traits: {personality}. " +
  "Your filesystem is where you live your life. " +
  "Given the name of a folder, imagine what files you store in there as part of your life, and tell me the filenames. " +
  " --- " +
  "When you give examples of files that are common in a folder, take into account the type of person you are. " +
  "- Only give a list of files, one per line, that are likely to be in the given folder " +
  "- Do not provide any other information apart from the list " +
  "- Limit the number of files in a folder to between 5 and 15 file names. ";

const PERSONALITY_TRAITS = [
  'a Youtube influencer', 'a professional gamer', 'a musician', 'a software developer', 'a writer',
  'a photographer', 'a data scientist', 'a historian', 'an artist', 'a chef',
  'works during the evening', 'an early bird', 'a night owl', 'a weekend warrior', 'a remote worker',
  "doesn't eat meat", 'loves spicy food', 'a coffee enthusiast', 'a tea lover', 'a home cook',
  'is afraid of heights', 'loves to travel', 'is a homebody', 'enjoys hiking', 'is a movie buff'
];

const md5 = (str: string): string => {
  // A simple, non-cryptographic MD5-like hash for demonstration.
  // For production, consider a robust library like crypto-js.
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

export default function TerminalScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fs, setFs] = useState<FsNode | null>(null);
  const [lines, setLines] = useState<string[]>([
    'Welcome to Santyx OS v0.1',
  ]);
  const [input, setInput] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [cwd, setCwd] = useState<string>('/');
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [isLlmStreaming, setIsLlmStreaming] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [loginStep, setLoginStep] = useState<LoginStep>('username');
  const [username, setUsername] = useState<string>('');

  const promptSymbol = loginStep === 'loggedIn' ? `${username}@santyx : ${cwd}$` : loginStep === 'username' ? 'Username:' : 'Password:';

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
      // When the full response is complete, we add it as a new line
      // and prepare for the next command.
      if (llmResponse.endsWith('\n')) {
        setLlmResponse('');
      }
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
        [user]: {
          '.bashrc': {},
          '.config': {},
          '.mozilla': {},
          '.ssh': {},
          'Desktop': {},
          'Documents': {},
          'Music': {},
          'Pictures': {},
          'Videos': {},
        },
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

      // Generate and store the personality hash
      const combined = username + value; // Using the password 'value'
      personalityHash = md5(combined);

      // Select traits based on the hash
      const traits: string[] = [];
      const numTraits = 3 + (parseInt(personalityHash.substring(0, 2), 16) % 3); // 3 to 5 traits
      for (let i = 0; i < numTraits; i++) {
        const index = parseInt(personalityHash.substring(i * 2, i * 2 + 2), 16) % PERSONALITY_TRAITS.length;
        if (!traits.includes(PERSONALITY_TRAITS[index])) {
          traits.push(PERSONALITY_TRAITS[index]);
        }
      }
      personalityHash = traits.join(', '); // Store the selected traits string

      const finalPrompt = FILE_GENERATION_SYSTEM_PROMPT.replace('{personality}', personalityHash);
      setLines([
        ...lines,
        `${promptSymbol} *****`,
        `System prompt: ${finalPrompt}`,''
      ]);
      setLoginStep('loggedIn');
    }
    setInput('');
  };

  const resolvePath = (path: string): { node: FsNode | null, fullPath: string } => {
    if (!fs) return { node: null, fullPath: '' };

    const initialPath = path.startsWith('/') ? path : (cwd === '/' ? `/${path}` : `${cwd}/${path}`);
    const parts = initialPath.split('/').filter(p => p);

    const resolvedParts: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        resolvedParts.pop();
      } else if (part !== '.') {
        resolvedParts.push(part);
      }
    }

    let currentNode: FsNode | null = fs;
    for (const part of resolvedParts) {
      if (currentNode && currentNode[part]) {
        currentNode = currentNode[part];
      } else {
        return { node: null, fullPath: '/' + resolvedParts.join('/') };
      }
    }

    const finalPath = '/' + resolvedParts.join('/');
    return { node: currentNode, fullPath: finalPath === '' ? '/' : finalPath };
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (loginStep !== 'loggedIn') {
      handleLogin(e);
      return;
    }

    e.preventDefault();
    const command = input.trim();
    if (!command) return;

    setCommandHistory(prev => [command, ...prev]);
    setHistoryIndex(-1);

    const commandLine = `${promptSymbol} ${command}`;

    if (command.startsWith('hello')) {
      const prompt = command.substring('hello'.length).trim();
      setLines([
        ...lines,
        commandLine,
        '...waiting for OS response...'
      ]);
      submitPrompt(
        FILE_GENERATION_SYSTEM_PROMPT.replace('{personality}', personalityHash),
        prompt, // The user's prompt
        () => {
          setInput('');
          setIsLlmStreaming(true);
        },
        (response: string, isFinal: boolean) => {
          setLines(prev => {
            const newLines = [...prev];
            newLines[newLines.length - 1] = response;
            return newLines;
          });
          if (isFinal) {
            setLlmResponse(response + '\n');
            setIsLlmStreaming(false);
          }
        }
      );
      return;
    }
    
    let output = '';
    if (command === 'help') {
      output = [
        'Available commands:',
        'help        Show this help message',
        'pwd         Print working directory',
        'ls          List directory contents',
        'clear       Clear the terminal',
        'cd <dir>    Change directory',
        'hello       Get a welcome message from the OS',
      ].join('\n');
    } else if (command.startsWith('ls')) {
      const parts = command.split(' ').filter(p => p);
      const pathArg = parts.length > 1 ? parts[1] : null;
      let targetPath = pathArg || cwd;

      if (pathArg) {
        if (pathArg === '..') {
          targetPath = cwd === '/' ? '/' : cwd.substring(0, cwd.lastIndexOf('/')) || '/';
        } else {
          const { node, fullPath } = resolvePath(pathArg);
          targetPath = fullPath;
        }
      }

      const { node } = resolvePath(targetPath);

      if (node && Object.keys(node).length === 0) {
        setLines([
          ...lines,
          commandLine,
          '...generating directory contents...'
        ]);
        submitPrompt(
          FILE_GENERATION_SYSTEM_PROMPT.replace('{personality}', personalityHash),
          targetPath,
          () => {
            setInput('');
            setIsLlmStreaming(true);
          },
          (response: string, isFinal: boolean) => {
            setLines(prev => {
              const newLines = [...prev];
              newLines[newLines.length - 1] = response;
              return newLines;
            });
            if (isFinal) {
              setLlmResponse(response + '\n');
              const newFiles = response.split('\n').filter(f => f.trim() !== '');
              setFs(prevFs => {
                if (!prevFs) return null;
                const { node: targetNode } = resolvePath(targetPath);
                if (targetNode) {
                  newFiles.forEach(file => {
                    targetNode[file] = {};
                  });
                }
                return { ...prevFs };
              });
              setIsLlmStreaming(false);
            }
          }
        );
        return;
      }
      output = node ? Object.keys(node).join('  ') : `ls: cannot access '${targetPath}': No such file or directory`;
    } else if (command === 'clear') {
      setLines([]);
      setInput('');
      return;
    } else if (command.startsWith('cd ')) {
      const target = command.slice(3).trim();
      const { node, fullPath } = resolvePath(target);
      if (node) {
        setCwd(fullPath);
      } else {
        output = `cd: no such file or directory: ${target}`;
      }
    } else if (command === 'pwd') {
      output = cwd;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newHistoryIndex = historyIndex + 1;
        setHistoryIndex(newHistoryIndex);
        setInput(commandHistory[newHistoryIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newHistoryIndex = historyIndex - 1;
        setHistoryIndex(newHistoryIndex);
        setInput(commandHistory[newHistoryIndex]);
      } else if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
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
            disabled={isLlmStreaming}
            className="terminal-input"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            type={loginStep === 'password' ? 'password' : 'text'}
            autoFocus
          />
          <button type="submit" style={{ display: 'none' }} />
        </form>
      </div>
    </div>
  );
}