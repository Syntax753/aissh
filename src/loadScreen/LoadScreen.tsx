import {useState, useEffect} from "react";
import { ModelDeviceProblemsDialog, ModelDeviceProblem } from "decent-portal";

import styles from './LoadScreen.module.css';
import '../homeScreen/TerminalLogin.css';
import { init } from "./interactions/initialization";
import TopBar from '@/components/topBar/TopBar';
import ContentButton from "@/components/contentButton/ContentButton";
import { connect } from "@/llm/llmUtil";

const bootSequenceLines = [
  '[    0.000000] Linux version 6.5.0-santyx (dev@santyx) (gcc (Ubuntu 11.2.0-19ubuntu1) 11.2.0, GNU ld (GNU Binutils for Ubuntu) 2.38)',
  '[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.5.0-santyx root=UUID=... ro quiet splash',
  '[    0.000000] KERNEL supported cpus:',
  '[    0.000000]   Intel GenuineIntel',
  '[    0.000000]   AMD AuthenticAMD',
  '[    0.084441] BIOS-provided physical RAM map:',
  '[    0.084442] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable',
  '[    0.084443] BIOS-e820: [mem 0x000000000009fc00-0x00000000000fffff] reserved',
  '[    0.100000] DMI: Santyx Virtual/VirtualBox, BIOS VirtualBox 1.2',
  '[    0.200000] smp: Bringing up secondary CPUs...',
  '[    0.300000] Mount-cache hash table entries: 2048 (order: 1, 8192 bytes)',
  '[    0.400000] Mountpoint-cache hash table entries: 2048 (order: 1, 8192 bytes)',
  '[    0.500000] Initializing CPU#1',
  '[    0.600000] pid_max: default: 32768 minimum: 301',
  '[    0.700000] ACPI: Core revision 20210730',
  '[    0.800000] RTC-CMSG: 14 bytes reserved',
  '[    0.900000] VFS: Disk quotas dquot_6.6.0',
  '[    1.000000] TCP: Hash tables configured (established 131072 bind 65536)',
  '[    1.100000] workingset: timestamp_bits=62 max_order=21 bucket_order=0',
  '[    1.200000] Block layer SCSI generic (bsg) driver version 2.00',
  '[    1.300000] io scheduler mq-deadline registered',
  '[    1.400000] pci 0000:00:04.0: IDE controller: Intel Corporation 82371SB PIIX3 IDE [Natoma/Triton II]',
  '[    1.500000] ata1: PATA max UDMA/33 cmd 0x1f0 ctl 0x3f6 bmdma 0xc000 irq 14',
  '[    1.600000] ata2: PATA max UDMA/33 cmd 0x170 ctl 0x376 bmdma 0xc008 irq 15',
  '[    2.000000] scsi host0: ata_piix',
  '[    2.100000] scsi host1: ata_piix',
  '[    2.200000] scsi 0:0:0:0: CD-ROM            VBOX     CD-ROM           1.0  PQ: 0 ANSI: 5',
  '[    2.300000] scsi 1:0:0:0: Direct-Access     VBOX     HARDDISK         1.0  PQ: 0 ANSI: 5',
  '[    2.500000] Freeing unused kernel memory: 2048K',
  '[    2.600000] Run /sbin/init as init process',
  '[    3.000000] systemd[1]: Santyx OS v0.1 starting up.',
  '[    3.500000] systemd[1]: Reached target Basic System.',
  '[    4.000000] systemd[1]: Reached target Network.',
  '[    4.500000] systemd[1]: Reached target Sockets.',
  '[    5.000000] systemd[1]: Reached target Timers.',
  '[    5.500000] systemd[1]: Starting Login Service...',
  '[    6.000000] systemd[1]: Started Login Service.',
];

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

    let llmLoaded = false;
    const llmLoadPromise = connect(modelId, () => {}); // Status updates are handled by the boot sequence text
    llmLoadPromise
      .then(() => { llmLoaded = true; })
      .catch(e => {
          onError(e.message || 'An unknown error occurred while loading the model.');
      });

    let i = 0;
    const interval = setInterval(() => {
      if (llmLoaded) {
        clearInterval(interval);
        onComplete();
      } else {
        setBootLines(prev => [...prev, bootSequenceLines[i % bootSequenceLines.length]].slice(-100));
        i++;
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isReadyToLoad, modelId, onComplete, onError]);

  const statusContent = wasLoadCancelled ? (
      <div className={styles.cancelledMessage}>
        <p>Model loading was cancelled.</p>
        <p><ContentButton text='Try Again' onClick={() => window.location.reload()} /></p> 
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