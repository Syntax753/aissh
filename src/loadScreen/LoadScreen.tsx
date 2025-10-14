import {useState, useEffect, useRef} from "react";
import { ModelDeviceProblemsDialog, ModelDeviceProblem } from "decent-portal";
import ProgressBar from "@/components/progressBar/ProgressBar";

import '../homeScreen/TerminalLogin.css';
import { init } from "./interactions/initialization";
import TopBar from '@/components/topBar/TopBar';
import ContentButton from "@/components/contentButton/ContentButton";
import { runBootSequence } from "@/homeScreen/boot/mbr";
import { connect } from "@/llm/llmUtil";

type Props = {
  onComplete: () => void;
  onError: (message: string) => void;
}

function LoadScreen(props:Props) {
  const terminalWindowRef = useRef<HTMLDivElement>(null);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [isReadyToLoad, setIsReadyToLoad] = useState<boolean>(false);
  const [wasLoadCancelled, setWasLoadCancelled] = useState<boolean>(false);
  const [modalDialogName, setModalDialogName] = useState<string|null>(null);
  const [modelId, setModelId] = useState<string>('');
  const [percentComplete, setPercentComplete] = useState<number>(0);
  const [problems, setProblems] = useState<ModelDeviceProblem[]|null>(null);
  const {onComplete, onError} = props;
  
  useEffect(() => {
    if (!isReadyToLoad) {
      init(setModelId, setProblems, setModalDialogName)
        .then(setIsReadyToLoad)
        .catch(e => {
          console.error("Initialization failed", e);
          onError(e.message || 'An unknown error occurred during initialization.');
        });
      return;
    }

    const onProgress = (text: string, progress: number) => {
      const percentMatch = text.match(/\[(\d+)\/(\d+)\]/);
      const percent = percentMatch ? parseInt(percentMatch[1], 10) / parseInt(percentMatch[2], 10) : progress;
      setPercentComplete(percent);
    };
    const llmLoadPromise = connect(modelId, onProgress);
    llmLoadPromise
      .catch(e => {
          onError(e.message || 'An unknown error occurred while loading the model.');
      });
    runBootSequence(setBootLines, llmLoadPromise, onComplete);
  }, [isReadyToLoad, modelId, onComplete, onError]);

  useEffect(() => {
    if (terminalWindowRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalWindowRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 20) { // 20px tolerance
        terminalWindowRef.current.scrollTop = terminalWindowRef.current.scrollHeight;
      }
    }
  }, [bootLines]);

  const statusContent = wasLoadCancelled ? (
      <div className="terminal-bg">
        <div className="terminal-window">
          <p>Model loading was cancelled.</p>
          <p><ContentButton text='Try Again' onClick={() => window.location.reload()} /></p>
        </div>
      </div>
    ) : (
      <div className="terminal-bg">
        <div style={{ padding: '1rem 2rem' }}>
          <ProgressBar
            percentComplete={percentComplete}
            text="Loading LLM"
          />
        </div>
        <div ref={terminalWindowRef} className="terminal-window" style={{ paddingTop: '1rem' }}>
          {bootLines.map((line, index) => <div key={index}>{line}</div>)}
        </div>
      </div>
    );
  
  return (
    <>
      <TopBar/>
      {statusContent}
      <ModelDeviceProblemsDialog
        isOpen={modalDialogName === ModelDeviceProblemsDialog.name}
        modelId={modelId}
        problems={problems}
        onConfirm={() => {setModalDialogName(null); setIsReadyToLoad(true); }}
        onCancel={() => {setModalDialogName(null); setWasLoadCancelled(true); }}
      />
    </>
  );
}

export default LoadScreen;