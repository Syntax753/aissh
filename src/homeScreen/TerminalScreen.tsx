import React, { useState, useRef, useEffect } from 'react';
import './TerminalLogin.css'; // This file will be created
import { init } from '@/homeScreen/interactions/initialization';
import LoadScreen from '@/loadScreen/LoadScreen';
import { submitPrompt } from '@/homeScreen/interactions/prompt';

let personalityHash = '';
let fullPersonaPrompt = '';
type FsNode = {
  [key: string]: FsNode;
};

type LoginStep = 'username' | 'password' | 'loggedIn';

const FILE_GENERATION_SYSTEM_PROMPT =
`Your persona is determined by the following traits:
 - Your personality is {personality}
 - Your favorite food is {food}
 - Your favorite colour is {colour}
 - Your age is {age}
 - Your childhood was {childhood}

Your filesystem is where you live your life.
Given the name of a folder, imagine what files you store in there as part of your life, and tell me the filenames.
--- 
When you give examples of files that are common in a folder, take into account the type of person you are.
- Only give a list of files, one per line, that are likely to be in the given folder
- Do not provide any other information apart from the list
- Limit the number of files in a folder to between 5 and 15 file names.`;

const CAT_SYSTEM_PROMPT = 
`Given the filename {filename}, generate content that the file might contain. Limit yourself to between 5-30 lines.
`;


const PERSONALITY_TRAITS = [
  'adventurous', 'amiable', 'analytical', 'artistic', 'brave', 'calm', 'charismatic', 'charming', 'cheerful', 'clever',
  'compassionate', 'confident', 'conscientious', 'considerate', 'courageous', 'creative', 'curious', 'daring', 'decisive', 'dedicated',
  'determined', 'diligent', 'disciplined', 'dynamic', 'easygoing', 'eloquent', 'empathetic', 'energetic', 'enthusiastic', 'exuberant'
];

const FOODS = [
  'pizza', 'sushi', 'tacos', 'burgers', 'pasta', 'ramen', 'steak', 'ice cream', 'salad', 'curry',
  'dumplings', 'pho', 'pancakes', 'waffles', 'fried chicken', 'bbq ribs', 'chocolate', 'donuts', 'bagels', 'soup'
];

const COLOURS = [
  'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black', 'white', 'pink', 'brown'
];

const CHILDHOOD_ADJECTIVES = [
  'happy', 'carefree', 'adventurous', 'quiet', 'studious', 'lonely', 'difficult', 'structured', 'nomadic', 'sheltered'
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

      // {personality}: 3-5 traits from a list of 30
      const personalityTraits: string[] = [];
      const numPersonalityTraits = 3 + (parseInt(personalityHash.substring(0, 1), 16) % 3); // 3, 4, or 5
      for (let i = 0; i < numPersonalityTraits; i++) {
        const index = parseInt(personalityHash.substring(i + 1, i + 2), 16) % PERSONALITY_TRAITS.length;
        if (!personalityTraits.includes(PERSONALITY_TRAITS[index])) {
          personalityTraits.push(PERSONALITY_TRAITS[index]);
        }
      }

      // {food}: 1-2 foods from a list of 20
      const favoriteFoods: string[] = [];
      const numFoods = 1 + (parseInt(personalityHash.substring(4, 5), 16) % 2); // 1 or 2
      for (let i = 0; i < numFoods; i++) {
        const index = parseInt(personalityHash.substring(i + 5, i + 6), 16) % FOODS.length;
        if (!favoriteFoods.includes(FOODS[index])) {
          favoriteFoods.push(FOODS[index]);
        }
      }

      // {colour}: 1 colour from a list of 10
      const favoriteColour = COLOURS[parseInt(personalityHash.substring(7, 8), 16) % COLOURS.length];

      // {age}: a number between 18 and 90
      const age = 18 + (parseInt(personalityHash.substring(8, 10), 16) % (90 - 18 + 1));

      // {childhood}: 1 adjective from a list of 10
      const childhood = CHILDHOOD_ADJECTIVES[parseInt(personalityHash.substring(10, 11), 16) % CHILDHOOD_ADJECTIVES.length];

      const finalPrompt = FILE_GENERATION_SYSTEM_PROMPT
        .replace('{personality}', personalityTraits.join(', '))
        .replace('{food}', favoriteFoods.join(' and '))
        .replace('{colour}', favoriteColour)
        .replace('{age}', age.toString())
        .replace('{childhood}', childhood);

      fullPersonaPrompt = finalPrompt;
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
        fullPersonaPrompt,
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
        'cat <file>  Display file contents',
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
          fullPersonaPrompt,
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
    } else if (command.startsWith('cat ')) {
      const filename = command.substring(4).trim();
      if (!filename) {
        output = 'cat: missing file operand';
      } else {
        const { node } = resolvePath(filename);
        if (node) {
          // It's a directory
          if (Object.keys(node).length > 0) {
            output = `cat: ${filename}: Is a directory`;
          } else {
            // For now, we treat empty objects as files.
            setLines([
              ...lines,
              commandLine,
              `...generating content for ${filename}...`
            ]);
            const systemPrompt = `${fullPersonaPrompt}\n\n---\n\n${
              CAT_SYSTEM_PROMPT.replace('{filename}', filename)
            }`;
            submitPrompt(systemPrompt, filename, () => {
              setInput('');
              setIsLlmStreaming(true);
            }, (response, isFinal) => {
              setLines(prev => {
                const newLines = [...prev];
                newLines[newLines.length - 1] = response;
                return newLines;
              });
              if (isFinal) {
                setLlmResponse(response + '\n');
                setIsLlmStreaming(false);
              }
            });
            return;
          }
        } else {
          output = `cat: ${filename}: No such file or directory`;
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