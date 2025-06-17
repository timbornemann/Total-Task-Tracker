import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
}

// Global styles for the markdown editor
const editorStyles = `
  .active-line-editor {
    position: relative;
    font-family: monospace;
    white-space: pre-wrap;
  }
  .cursor-indicator {
    display: inline-block;
    width: 2px;
    height: 1.2em;
    background-color: #000;
    animation: blink 1s step-end infinite;
    vertical-align: middle;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .empty-line {
    height: 1.5em;
    display: block;
    position: relative;
  }
  .empty-line::after {
    content: '\\00a0'; /* Non-breaking space */
    visibility: visible;
  }
`;

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  rows = 5,
  className,
}) => {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [cursorColumn, setCursorColumn] = useState<number>(0);
  
  // Calculate which line and column the cursor is in
  useEffect(() => {
    if (cursorPosition === null) return;
    
    // Find line number based on cursor position
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lineNumber = (textBeforeCursor.match(/\n/g) || []).length;
    setActiveLine(lineNumber);
    
    // Find column position in current line
    const lastNewlinePos = textBeforeCursor.lastIndexOf('\n');
    const columnPos = lastNewlinePos === -1 ? cursorPosition : cursorPosition - lastNewlinePos - 1;
    setCursorColumn(columnPos);
  }, [cursorPosition, value]);

  // Process text to preserve empty lines
  const processTextForDisplay = (text: string): string => {
    // Replace consecutive newlines with special markers
    return text.replace(/\n\n+/g, (match) => {
      // For each newline create a special empty line marker
      const emptyLines = match.split('').map(() => '<span class="empty-line"></span>').join('');
      return '\n' + emptyLines;
    });
  };

  // Split text into lines for rendering hybrid view
  const getHybridContent = () => {
    if (activeLine === null) return processTextForDisplay(value);
    
    const lines = value.split('\n');
    
    // Create hybrid content where each line is either rendered as markdown or shown as plain text
    return lines.map((line, index) => {
      if (index === activeLine) {
        // Return a special marker for the active line with cursor position
        if (cursorColumn <= line.length) {
          const before = line.substring(0, cursorColumn);
          const after = line.substring(cursorColumn);
          return `<div class="active-line-marker">${before}<span class="cursor-position"></span>${after}</div>`;
        }
        return `<div class="active-line-marker">${line}<span class="cursor-position"></span></div>`;
      }
      // Handle empty lines
      if (line.trim() === '') {
        return `<div class="empty-line-marker"></div>`;
      }
      return line;
    }).join('\n');
  };

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
      setCursorPosition(cursor);
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
      setCursorPosition(cursor);
    });
  };

  const insertPrefix = (prefix: string) => {
    wrapSelection(prefix);
  };

  // Handle key press events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }

    // Special handling for Enter key to ensure we properly handle empty lines
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert a newline character
      const newValue = value.slice(0, start) + '\n' + value.slice(end);
      onChange(newValue);
      
      // Set cursor position after the inserted newline
      requestAnimationFrame(() => {
        textarea.focus();
        const newPosition = start + 1;
        textarea.selectionStart = newPosition;
        textarea.selectionEnd = newPosition;
        setCursorPosition(newPosition);
      });
      
      e.preventDefault(); // Prevent the default Enter behavior
    }
  };

  // Custom component to handle the active line rendering
  const MarkdownWithActiveLine = (props: { children: string }) => {
    const content = props.children;
    
    if (!content.includes('<div class="active-line-marker">') && 
        !content.includes('<div class="empty-line-marker">')) {
      return (
        <ReactMarkdown rehypePlugins={[rehypeRaw]} skipHtml={false}>
          {content}
        </ReactMarkdown>
      );
    }
    
    // Handle empty line markers
    const processedContent = content.replace(
      /<div class="empty-line-marker"><\/div>/g,
      '<div class="empty-line"></div>'
    );
    
    // Split by the special marker
    const parts = processedContent.split(/<div class="active-line-marker">(.*?)<\/div>/);
    
    if (parts.length < 3) {
      // If there's no active line marker but possibly empty lines
      return (
        <ReactMarkdown rehypePlugins={[rehypeRaw]} skipHtml={false}>
          {processedContent}
        </ReactMarkdown>
      );
    }
    
    // Process the active line to include the cursor indicator
    const activeLine = parts[1];
    const cursorParts = activeLine.split('<span class="cursor-position"></span>');
    
    return (
      <>
        {parts[0] && (
          <ReactMarkdown rehypePlugins={[rehypeRaw]} skipHtml={false}>
            {parts[0]}
          </ReactMarkdown>
        )}
        <div className="active-line-editor bg-primary/10 -mx-2 px-2 py-1 border-l-2 border-primary relative">
          {cursorParts.length > 1 ? (
            <>
              {cursorParts[0]}
              <span className="cursor-indicator"></span>
              {cursorParts[1]}
            </>
          ) : (
            activeLine
          )}
        </div>
        {parts[2] && (
          <ReactMarkdown rehypePlugins={[rehypeRaw]} skipHtml={false}>
            {parts[2]}
          </ReactMarkdown>
        )}
      </>
    );
  };
  
  // Update cursor visibility when cursor moves
  useEffect(() => {
    const updateCursorVisibility = () => {
      if (textareaRef.current && cursorPosition !== null) {
        // Force the cursor to be visible by focusing and setting the selection
        const textarea = textareaRef.current;
        textarea.focus();
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition;
      }
    };
    
    updateCursorVisibility();
  }, [cursorPosition]);

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
          <TooltipContent>{t('markdownEditor.bold')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.italic')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.strikethrough')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.heading1')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.heading2')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.heading3')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.link')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.image')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.bulletList')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.numberedList')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.quote')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.inlineCode')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.codeBlock')}</TooltipContent>
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
          <TooltipContent>{t('markdownEditor.horizontalRule')}</TooltipContent>
        </Tooltip>
      </div>
      <div className="relative">
        <div
          ref={previewRef}
          className={cn(
            'prose max-w-none p-8 min-h-[80px] border rounded-sm bg-background shadow-sm overflow-auto',
            className
          )}
        >
          <MarkdownWithActiveLine>{getHybridContent()}</MarkdownWithActiveLine>
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          onSelect={() => {
            if (textareaRef.current) {
              setCursorPosition(textareaRef.current.selectionStart);
            }
          }}
          onClick={() => {
            if (textareaRef.current) {
              setCursorPosition(textareaRef.current.selectionStart);
            }
          }}
          onKeyUp={() => {
            if (textareaRef.current) {
              setCursorPosition(textareaRef.current.selectionStart);
            }
          }}
          onKeyDown={handleKeyDown}
          onScroll={() => {
            if (previewRef.current && textareaRef.current) {
              previewRef.current.scrollTop = textareaRef.current.scrollTop;
            }
          }}
          className={cn(
            'absolute inset-0 p-8 min-h-[80px] opacity-0 border rounded-sm shadow-sm focus-visible:ring-0 focus-visible:outline-none resize-none',
            className
          )}
          style={{ caretColor: 'transparent' }}
        />
      </div>
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
    </div>
  );
};

export default MarkdownEditor;
