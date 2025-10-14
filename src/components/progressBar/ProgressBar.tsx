type Props = {
  percentComplete: number;
  text: string;
}

function ProgressBar(props: Props) {
  const { percentComplete, text } = props;

  if (percentComplete < 0 || percentComplete >= 1) return null;

  return (
    <div style={{ width: '100%', border: '1px solid white', color: 'white', fontFamily: 'monospace', fontSize: '1rem' }}>
      <div style={{ width: `${percentComplete * 100}%`, backgroundColor: '#c57431', height: '1.2rem', textAlign: 'center', lineHeight: '1.2rem' }}>
        {percentComplete >= 0.1 && `${text}: ${(percentComplete * 100).toFixed(0)}%`}
      </div>
    </div>
  );
}

export default ProgressBar;