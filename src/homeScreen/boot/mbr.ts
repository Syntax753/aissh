const bootSequenceLines: string[] = [
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
  '[    5.100000] systemd[1]: Starting Login Service...',
  '[    5.200000] systemd[1]: Started Login Service.',
  '[    5.300000] systemd[1]: Listening on D-Bus System Message Bus Socket.',
  '[    5.400000] systemd[1]: Reached target System Initialization.',
  '[    5.500000] systemd[1]: Started Daily apt download activities.',
  '[    5.600000] systemd[1]: Started Daily apt upgrade and clean activities.',
  '[    5.700000] systemd[1]: Reached target Timers.',
  '[    5.800000] systemd[1]: Listening on ACPID Listen Socket.',
  '[    5.900000] systemd[1]: Listening on Avahi mDNS/DNS-SD Stack Activation Socket.',
  '[    6.000000] systemd[1]: Listening on CUPS Scheduler.',
  '[    6.100000] systemd[1]: Listening on Open-iSCSI iscsid DEPRECATED internal socket.',
  '[    6.200000] systemd[1]: Starting Detect the available GPUs and deal with any system changes...',
  '[    6.300000] systemd[1]: Starting Dispatcher daemon for systemd-networkd...',
  '[    6.400000] systemd[1]: Starting Network Name Resolution...',
  '[    6.500000] systemd[1]: Starting User Login Management...',
  '[    6.600000] systemd[1]: Started Dispatcher daemon for systemd-networkd.',
  '[    6.700000] systemd[1]: Started Network Name Resolution.',
  '[    6.800000] systemd[1]: Started User Login Management.',
  '[    6.900000] systemd[1]: Reached target User and Group Name Lookups.',
  '[    7.000000] systemd[1]: Started Detect the available GPUs and deal with any system changes.',
  '[    7.100000] systemd[1]: Starting Load/Save Screen Backlight Brightness of backlight:acpi_video0...',
  '[    7.200000] systemd[1]: Starting Load/Save Screen Backlight Brightness of backlight:intel_backlight...',
  '[    7.300000] systemd[1]: Finished Load/Save Screen Backlight Brightness of backlight:acpi_video0.',
  '[    7.400000] systemd[1]: Finished Load/Save Screen Backlight Brightness of backlight:intel_backlight.',
  '[    7.500000] systemd[1]: Reached target Local Graphics.',
  '[    7.600000] systemd[1]: Starting Record Runlevel Change in UTMP...',
  '[    7.70000g ] systemd[1]: Finished Record Runlevel Change in UTMP.',
  '[    7.800000] systemd[1]: Starting Accounts Service...',
  '[    7.900000] systemd[1]: Starting Avahi mDNS/DNS-SD Stack...',
  '[    8.000000] systemd[1]: Starting Bluetooth service...',
  '[    8.100000] systemd[1]: Starting CUPS Scheduler...',
  '[    8.200000] systemd[1]: Starting regular background program processing daemon...',
  '[    8.300000] systemd[1]: Starting Modem Manager...',
  '[    8.400000] systemd[1]: Starting Network Manager...',
  '[    8.500000] systemd[1]: Starting Power Profiles daemon...',
  '[    8.600000] systemd[1]: Starting Switcheroo Control Proxy service...',
  '[    8.700000] systemd[1]: Started Accounts Service.',
  '[    8.800000] systemd[1]: Started Avahi mDNS/DNS-SD Stack.',
  '[    8.900000] systemd[1]: Started Bluetooth service.',
  '[    9.000000] systemd[1]: Started CUPS Scheduler.',
  '[    9.100000] systemd[1]: Started regular background program processing daemon.',
  '[    9.200000] systemd[1]: Started Modem Manager.',
  '[    9.300000] systemd[1]: Started Network Manager.',
  '[    9.400000] systemd[1]: Started Power Profiles daemon.',
  '[    9.500000] systemd[1]: Started Switcheroo Control Proxy service.',
  '[    9.600000] systemd[1]: Reached target Network.',
  '[    9.700000] systemd[1]: Starting GNOME Display Manager...',
  '[    9.800000] systemd[1]: Starting Hold until boot process finishes up...',
  '[    9.900000] systemd[1]: Starting User Manager for UID 125...',
  '[   10.000000] systemd[1]: Started User Manager for UID 125.',
  '[   10.100000] systemd[1]: Started GNOME Display Manager.',
  '[   10.200000] systemd[1]: Started Hold until boot process finishes up.',
  '[   10.300000] systemd[1]: Reached target Multi-User System.',
  '[   10.400000] systemd[1]: Reached target Graphical Interface.',
  '[   10.500000] systemd[1]: Starting Santyx OS... aissh v2.4.1',
  '[   10.600000] aissh[1]: Loading LLM...',
  '[   10.700000] aissh[1]: Checking device compatibility...',
  '[   10.800000] aissh[1]: WebGPU found.',
  '[   10.900000] aissh[1]: Initializing model: Llama-3-8B-Instruct-q4f32_1-1k...',
  '[   11.000000] aissh[1]: Fetching model weights from cache...',
  '[   12.500000] aissh[1]: Model weights loaded.',
  '[   12.600000] aissh[1]: Compiling shaders...',
  '[   14.200000] aissh[1]: Shaders compiled.',
  '[   14.300000] aissh[1]: Creating pipeline...',
  '[   15.000000] aissh[1]: Pipeline created.',
  '[   15.100000] aissh[1]: LLM ready.',
  '[   15.200000] aissh[1]: Starting UI services...',
  '[   15.300000] aissh[1]: Santyx OS started successfully.',
];

const parseTimestamp = (line: string): number => {
  const match = line.match(/\[\s*(\d+\.\d+)]/);
  if (match && match[1]) {
    return parseFloat(match[1]) * 1000; // Convert to milliseconds
  }
  return -1; // Return -1 if no timestamp is found
};

export const runBootSequence = async (
  setLines: React.Dispatch<React.SetStateAction<string[]>>,
  getPercentComplete: () => number,
  llmLoadPromise: Promise<any>,
  onComplete: () => void
) => {
  let llmLoaded = false;
  llmLoadPromise.then(() => {
    llmLoaded = true;
  });
  let startTime = 0;
  let lineIndex = 0;

  const processNextLine = () => {
    if (llmLoaded) {
      onComplete();
      return;
    }
    
    if (lineIndex >= bootSequenceLines.length) {
      // End of sequence, wait for LLM if it's not loaded yet
      const bootConsoleLine = 'Booting console...';
      setLines(prev => [...prev, '']);
      const bootConsoleLineIndex = bootSequenceLines.length;
      const sequenceStartTime = performance.now();

      const intervalId = setInterval(() => {
        if (llmLoaded) {
          clearInterval(intervalId);
          onComplete();
          return;
        }

        const percent = getPercentComplete();
        const timeElapsed = performance.now() - sequenceStartTime;
        let timeRemainingStr = 'calculating...';
        if (percent > 0.01) {
          const totalTime = timeElapsed / percent;
          const timeRemainingSeconds = Math.round((totalTime - timeElapsed) / 1000);
          if (timeRemainingSeconds > 60) {
            const minutes = Math.floor(timeRemainingSeconds / 60);
            const seconds = timeRemainingSeconds % 60;
            timeRemainingStr = `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
          } else {
            timeRemainingStr = `${timeRemainingSeconds}s remaining`;
          }
        }

        setLines(prev => {
          const newLines = [...prev];
          newLines[bootConsoleLineIndex] = `${bootConsoleLine} ${timeRemainingStr}`;
          return newLines;
        });
      }, 1000);
      return;
    }

    const line = bootSequenceLines[lineIndex];
    setLines(prev => [...prev, line].slice(-100));

    const currentTime = parseTimestamp(line);
    if (startTime === 0 && currentTime > 0) {
      startTime = performance.now() - currentTime;
    }
    lineIndex++;
    const nextLine = bootSequenceLines[lineIndex];
    const nextTime = nextLine ? parseTimestamp(nextLine) : -1;
    const delay = nextTime > 0 ? (startTime + nextTime) - performance.now() : 20;
    setTimeout(processNextLine, Math.max(0, delay));
  };

  processNextLine();
};
