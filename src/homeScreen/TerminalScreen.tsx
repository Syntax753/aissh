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

const PERSONALITY_PROMPT_TEMPLATE = `Your persona is determined by the following traits:
 - Your personality is {personality}
 - Your job is {job}
 - Your favorite food is {food}
 - Your favorite colour is {colour}
 - Your age is {age}
 - Your childhood was {childhood}
 - Your favourite animal is {animal}`;

const FILE_GENERATION_SYSTEM_PROMPT = `When you give examples of files that are common in a folder, take into account the type of person you are.
- Only give a list of files, one per line, that are likely to be in the given folder
- Do not provide any other information apart from the list
- Limit the number of files in a folder to between 5 and 15 file names.`;

const CAT_SYSTEM_PROMPT = `Given the filename {filename}, generate content that the file might contain. Limit yourself to between 5-30 lines.`;

let persona = '';

const PERSONALITY_TRAITS = [
  'adventurous', 'amiable', 'analytical', 'artistic', 'brave', 'calm', 'charismatic', 'charming', 'cheerful', 'clever',
  'compassionate', 'confident', 'conscientious', 'considerate', 'courageous', 'creative', 'curious', 'daring', 'decisive', 'dedicated',
  'determined', 'diligent', 'disciplined', 'dynamic', 'easygoing', 'eloquent', 'empathetic', 'energetic', 'enthusiastic', 'exuberant'
];

const ANIMALS = [
  'lion', 'tiger', 'bear', 'wolf', 'fox', 'elephant', 'giraffe', 'zebra', 'monkey', 'gorilla',
  'hippopotamus', 'rhinoceros', 'crocodile', 'snake', 'lizard', 'turtle', 'eagle', 'hawk', 'owl', 'penguin',
  'dolphin', 'whale', 'shark', 'octopus', 'jellyfish', 'starfish', 'crab', 'lobster', 'shrimp', 'ant'
];

const JOBS = [
  'software developer', 'artist', 'writer', 'musician', 'chef', 'photographer', 'streamer', 'historian', 'scientist', 'teacher',
  'doctor', 'lawyer', 'architect', 'engineer', 'designer', 'accountant', 'consultant', 'entrepreneur', 'journalist', 'mechanic',
  'plumber', 'electrician', 'carpenter', 'farmer', 'veterinarian', 'police officer', 'firefighter', 'paramedic', 'pilot', 'sailor'
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
  const [inMysql, setInMysql] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [loginStep, setLoginStep] = useState<LoginStep>('username');
  const [username, setUsername] = useState<string>('');

  const promptSymbol = inMysql ? 'mysql> ' : loginStep === 'loggedIn' ? `${username}@santyx : ${cwd}$` : loginStep === 'username' ? 'Username:' : 'Password:';

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

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (inputRef.current && !isLlmStreaming) {
        inputRef.current.focus();
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isLlmStreaming]);

  useEffect(() => {
    if (!isLlmStreaming) {
      inputRef.current?.focus();
    }
  }, [isLlmStreaming]);

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
      var: {
        'password.txt': {},
      },
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
      const favoriteFoods: string[] = [FOODS[parseInt(personalityHash.substring(3, 4), 16) % FOODS.length]];
      const numFoods = 1 + (parseInt(personalityHash.substring(4, 5), 16) % 2); // 1 or 2
      if (numFoods === 2) {
        const secondFood = FOODS[parseInt(personalityHash.substring(5, 6), 16) % FOODS.length];
        if (!favoriteFoods.includes(secondFood)) {
          favoriteFoods.push(secondFood);
        }
      }

      // {colour}: 1 colour from a list of 10
      const favoriteColour = COLOURS[parseInt(personalityHash.substring(6, 7), 16) % COLOURS.length];

      // {age}: a number between 18 and 90
      const age = 18 + (parseInt(personalityHash.substring(6, 8), 16) % (90 - 18 + 1));

      // {childhood}: 1 adjective from a list of 10
      const childhood = CHILDHOOD_ADJECTIVES[parseInt(personalityHash.substring(0, 1), 16) % CHILDHOOD_ADJECTIVES.length];

      // {job}: 1 job from a list of 30
      const job = JOBS[parseInt(personalityHash.substring(2, 4), 16) % JOBS.length];

      // {animal}: 1 animal from a list of 30
      const animal = ANIMALS[parseInt(personalityHash.substring(2, 4), 16) % ANIMALS.length];

      const personaDetails = PERSONALITY_PROMPT_TEMPLATE
        .replace('{personality}', personalityTraits.join(', '))
        .replace('{food}', favoriteFoods.join(' and '))
        .replace('{colour}', favoriteColour)
        .replace('{job}', job)
        .replace('{age}', age.toString())
        .replace('{childhood}', childhood)
        .replace('{animal}', animal);

      persona = personaDetails;
      setLines([
        ...lines,
        `${promptSymbol} *****`
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
    e.preventDefault();
    const command = input.trim();

    if (inMysql) {
      const commandLine = `${promptSymbol} ${command}`;
      if (command === 'exit' || command === 'quit') {
        setLines([...lines, commandLine, 'Bye']);
        setInMysql(false);
      } else if (command) {
        setLines([
          ...lines,
          commandLine,
          `ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '${command}'`
        ]);
      } else {
        setLines([...lines, commandLine]);
      }
      setInput('');
      return;
    }

    if (loginStep !== 'loggedIn') {
      handleLogin(e);
      return;
    }

    if (!command) return;

    setCommandHistory(prev => [command, ...prev]);
    setHistoryIndex(-1);

    const commandLine = `${promptSymbol} ${command}`;

    if (command.startsWith('hello')) {
      setLines([
        ...lines,
        commandLine,
        '...waiting for OS response...'
      ]);
      submitPrompt(
        persona,
        command.substring('hello'.length).trim(), // The user's prompt
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
        'id          Display your persona',
        'mysql       Emulate a mysql login',
        'exit        Log out and return to the login prompt',
      ].join('\n');
    } else if (command.startsWith('ls')) {
      const parts = command.split(' ').filter(p => p);
      const pathArg = parts.length > 1 ? parts[1] : null;
      let targetPath;

      if (pathArg) {
        if (pathArg === '..') {
          targetPath = cwd === '/' ? '/' : cwd.substring(0, cwd.lastIndexOf('/')) || '/';
        } else {
          targetPath = resolvePath(pathArg).fullPath;
        }
      } else {
        targetPath = cwd;
      }

      const { node } = resolvePath(targetPath);

      if (node && Object.keys(node).length === 0) {
        setLines([
          ...lines,
          commandLine,
          // '...generating directory contents...'
          '...fetching files...'
        ]);
        submitPrompt(
          `${persona}\n\n---\n\n${FILE_GENERATION_SYSTEM_PROMPT}`,
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
      output = node ? Object.keys(node).join('\n') : `ls: cannot access '${targetPath}': No such file or directory`;
    } else if (command === 'exit') {
      setLines(['Welcome to Santyx OS v0.1']);
      setLoginStep('username');
      setUsername('');
      createInitialFs(''); // Reset FS, will be recreated with user on login
      setCwd('/');
      setCommandHistory([]);
      setHistoryIndex(-1);
      persona = '';
      personalityHash = '';
      setInput('');
      return;
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
    } else if (command === 'id') {
      output = persona;
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
              `...opening ${filename}...`
            ]);
            const systemPrompt = `${persona}\n\n---\n\n${CAT_SYSTEM_PROMPT.replace('{filename}', filename)}`;
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
            const isImage = imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
            submitPrompt(systemPrompt, filename, () => {
              setInput('');
              setIsLlmStreaming(true);
            }, (response, isFinal) => {
              let finalResponse = response;
              if (isFinal && isImage) {
                const imageDescription = response.trim();
                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageDescription)}`;
                const imageElement = `<br/><img src="${imageUrl}" alt="${imageDescription}" style="max-width: 300px; max-height: 300px;" />`;
                finalResponse = imageDescription + imageElement;
              }

              setLines(prev => {
                const newLines = [...prev];
                newLines[newLines.length - 1] = finalResponse;
                return newLines;
              });

              if (isFinal) {
                setIsLlmStreaming(false);
              }
            });
            return;
          }
        } else {
          output = `cat: ${filename}: No such file or directory`;
        }
      }
    } else if (command === 'mysql') {
      setLines([
        ...lines,
        commandLine,
        'Welcome to the MySQL monitor.  Commands end with ; or \\g.',
        'Your MySQL connection id is 8',
        'Server version: 8.0.23 MySQL Community Server - GPL',
        '',
        'Copyright (c) 2000, 2021, Oracle and/or its affiliates. All rights reserved.',
        '',
        'Oracle is a registered trademark of Oracle Corporation and/or its',
        'affiliates. Other names may be trademarks of their respective',
        'owners.',
        '',
        'Type \'help;\' or \'\\h\' for help. Type \'\\c\' to clear the current input statement.',
      ]);
      setInMysql(true);
      setInput('');
      return;
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
    if (e.key === 'Tab') {
      e.preventDefault();
      if (loginStep !== 'loggedIn' || !fs) return;

      const currentInput = input;
      const parts = currentInput.split(' ').filter(p => p);
      const lastPart = parts.length > 0 ? parts[parts.length - 1] : '';

      let basePath = cwd;
      let partialName = lastPart;
      const lastSlashIndex = lastPart.lastIndexOf('/');

      if (lastSlashIndex !== -1) {
        const dirPart = lastPart.substring(0, lastSlashIndex + 1);
        partialName = lastPart.substring(lastSlashIndex + 1);
        const resolvedDir = resolvePath(dirPart);
        if (resolvedDir.node) {
          basePath = resolvedDir.fullPath;
        } else {
          return; // Invalid path, no completions
        }
      }

      const { node: dirNode } = resolvePath(basePath);
      if (!dirNode) return;

      const completions = Object.keys(dirNode).filter(child => child.startsWith(partialName));

      if (completions.length === 1) {
        const completion = completions[0];
        const completionText = lastSlashIndex !== -1 ? lastPart.substring(0, lastSlashIndex + 1) + completion : completion;
        const newInput = parts.slice(0, -1).concat(completionText).join(' ');
        setInput(newInput);
      } else if (completions.length > 1) {
        let commonPrefix = completions[0];
        for (let i = 1; i < completions.length; i++) {
          while (completions[i].substring(0, commonPrefix.length) !== commonPrefix) {
            commonPrefix = commonPrefix.substring(0, commonPrefix.length - 1);
          }
        }
        const completionText = lastSlashIndex !== -1 ? lastPart.substring(0, lastSlashIndex + 1) + commonPrefix : commonPrefix;
        const newInput = parts.slice(0, -1).concat(completionText).join(' ');
        setInput(newInput);

        setLines([...lines, `${promptSymbol} ${currentInput}`, completions.join('  ')]);
      }
      return;
    }
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
    <div className="terminal-bg">
      <div className="terminal-window">
        {lines.map((line, idx) => (
          <div key={idx} dangerouslySetInnerHTML={{ __html: line.includes('<img') ? line : line.replace(/</g, '&lt;').replace(/>/g, '&gt;') }} />
        ))}
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