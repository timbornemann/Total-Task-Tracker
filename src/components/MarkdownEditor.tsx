import React, { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Code,
  Code2,
  Quote,
  Minus,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  rows = 5,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const wrapSelection = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const newValue =
      value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + prefix.length;
      textarea.selectionStart = cursor;
      textarea.selectionEnd = cursor + selected.length;
    });
  };

  const insertBlock = (content: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const newValue =
      value.slice(0, start) + content + value.slice(start);
    onChange(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + content.length;
      textarea.selectionStart = cursor;
      textarea.selectionEnd = cursor;
    });
  };

  const insertPrefix = (prefix: string) => {
    wrapSelection(prefix);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => wrapSelection('**', '**')}
            >
              <Bold />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => wrapSelection('*', '*')}
            >
              <Italic />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => wrapSelection('~~', '~~')}
            >
              <Strikethrough />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Strikethrough</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertPrefix('# ')}
            >
              <Heading1 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading 1</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertPrefix('## ')}
            >
              <Heading2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading 2</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertPrefix('### ')}
            >
              <Heading3 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading 3</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => wrapSelection('[', '](url)')}
            >
              <LinkIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Link</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => wrapSelection('![', '](url)')}
            >
              <ImageIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Image</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertPrefix('- ')}
            >
              <List />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bullet List</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertPrefix('1. ')}
            >
              <ListOrdered />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Numbered List</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertPrefix('> ')}
            >
              <Quote />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Quote</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => wrapSelection('`', '`')}
            >
              <Code />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Inline Code</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => wrapSelection('\n```\n', '\n```\n')}
            >
              <Code2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Code Block</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertBlock('\n---\n')}
            >
              <Minus />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Horizontal Rule</TooltipContent>
        </Tooltip>
      </div>
      <div className="relative">
        <div
          ref={previewRef}
          className={cn(
            'pointer-events-none prose max-w-none p-8 min-h-[80px] border rounded-sm bg-background shadow-sm overflow-auto',
            className
          )}
        >
          <ReactMarkdown>{value || ''}</ReactMarkdown>
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          onScroll={() => {
            if (previewRef.current && textareaRef.current) {
              previewRef.current.scrollTop = textareaRef.current.scrollTop;
            }
          }}
          className={cn(
            'absolute inset-0 p-8 min-h-[80px] bg-transparent border rounded-sm shadow-sm focus-visible:ring-0 focus-visible:outline-none resize-none',
            className
          )}
          style={{ color: 'transparent', caretColor: 'currentColor' }}
        />
      </div>
      </div>
  );
};

export default MarkdownEditor;
