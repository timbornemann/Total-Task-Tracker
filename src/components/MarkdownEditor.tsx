import React, { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, rows = 5 }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + prefix.length;
      textarea.selectionStart = cursor;
      textarea.selectionEnd = cursor + selected.length;
    });
  };

  const insertPrefix = (prefix: string) => {
    wrapSelection(prefix);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('**', '**')}>B</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('*', '*')}>I</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertPrefix('# ')}>H1</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertPrefix('## ')}>H2</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertPrefix('### ')}>H3</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('[', '](url)')}>Link</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertPrefix('- ')}>•</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertPrefix('1. ')}>1.</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('`', '`')}>Code</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertPrefix('> ')}>&gt;</Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
      />
    </div>
  );
};

export default MarkdownEditor;
