import { useEffect, useRef, useState } from 'react';

interface HRDisplayProps {
  value: number;
}

export function HRDisplay({ value }: HRDisplayProps) {
  const [displayed, setDisplayed] = useState(value);
  const [animClass, setAnimClass] = useState('');
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;

    setAnimClass('hr-fade-out');

    const fadeOutTimer = setTimeout(() => {
      setDisplayed(value);
      setAnimClass('hr-fade-in');
    }, 100);

    const clearTimer = setTimeout(() => {
      setAnimClass('');
    }, 250);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(clearTimer);
    };
  }, [value]);

  return (
    <div className="hr-display">
      <span className="hr-display__label">Current HR</span>
      <span className={`hr-display__value ${animClass}`}>
        {displayed}
        <span className="hr-display__unit">bpm</span>
      </span>
    </div>
  );
}
