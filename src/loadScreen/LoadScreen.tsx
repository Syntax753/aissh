import {useState, useEffect} from "react";
import { ModelDeviceProblemsDialog, ModelDeviceProblem } from "decent-portal";

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
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [isReadyToLoad, setIsReadyToLoad] = useState<boolean>(false);
  const [wasLoadCancelled, setWasLoadCancelled] = useState<boolean>(false);
  const [modalDialogName, setModalDialogName] = useState<string|null>(null);
  const [modelId, setModelId] = useState<string>('');
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

    const llmLoadPromise = connect(modelId, () => {}); // Status updates are handled by the boot sequence text
    llmLoadPromise
      .catch(e => {
          onError(e.message || 'An unknown error occurred while loading the model.');
      });
    runBootSequence(setBootLines, llmLoadPromise, onComplete);
  }, [isReadyToLoad, modelId, onComplete, onError]);

  const statusContent = wasLoadCancelled ? (
      <div className="terminal-bg">
        <div className="terminal-window">
          <p>Model loading was cancelled.</p>
          <p><ContentButton text='Try Again' onClick={() => window.location.reload()} /></p>
        </div>
      </div>
    ) : (
      <div className="terminal-bg">
        <div className="terminal-window">
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