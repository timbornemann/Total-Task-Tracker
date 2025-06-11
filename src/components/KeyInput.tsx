import React, { useState } from 'react';
import { Input } from '@/components/ui/input';

interface KeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const KeyInput: React.FC<KeyInputProps> = ({ value, onChange, placeholder }) => {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const keys: string[] = [];
    if (e.ctrlKey || e.metaKey) keys.push('ctrl');
    if (e.altKey) keys.push('alt');
    if (e.shiftKey) keys.push('shift');
    const key = e.key.toLowerCase();
    if (['control', 'shift', 'alt', 'meta'].includes(key)) return;
    keys.push(key);
    onChange(keys.join('+'));
    setRecording(false);
  };

  return (
    <Input
      value={value}
      placeholder={placeholder}
      readOnly
      onFocus={() => setRecording(true)}
      onBlur={() => setRecording(false)}
      onKeyDown={recording ? handleKeyDown : undefined}
    />
  );
};

export default KeyInput;
