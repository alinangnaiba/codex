import React from 'react';
import { 
  ArrowsOutLineHorizontalIcon,
  AsteriskIcon,
  BookOpenTextIcon,
  CodeBlockIcon,
  CodeIcon,
  HighlighterIcon,
  LinkIcon,
  ListBulletsIcon,
  ListChecksIcon,
  ListNumbersIcon,
  QuestionIcon,
  QuotesIcon,
  TextAlignLeftIcon,
  TextBIcon,
  TextHOneIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextSubscriptIcon,
  TextSuperscriptIcon
} from '@phosphor-icons/react';

interface EditorToolbarProps {
  insertMarkdown: (prefix: string, suffix?: string) => void;
  wordWrapEnabled: boolean;
  setWordWrapEnabled: (enabled: boolean) => void;
  setShowHelp: (show: boolean) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  insertMarkdown,
  wordWrapEnabled,
  setWordWrapEnabled,
  setShowHelp
}) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
      {/* Toolbar */}
      <div className="flex items-center gap-1">
        {/* Headers */}
        <button
          onClick={() => insertMarkdown('# ')}
          className="p-2 rounded-md hover-bg"
          title="Heading 1 (Ctrl+1)"
        >
          <TextHOneIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('## ')}
          className="p-2 rounded-md hover-bg"
          title="Heading 2 (Ctrl+2)"
        >
          <TextHTwoIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('### ')}
          className="p-2 rounded-md hover-bg"
          title="Heading 3 (Ctrl+3)"
        >
          <TextHThreeIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        
        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* Text Formatting */}
        <button
          onClick={() => insertMarkdown('**', '**')}
          className="p-2 rounded-md hover-bg"
          title="Bold (Ctrl+B)"
        >
          <TextBIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('*', '*')}
          className="p-2 rounded-md hover-bg"
          title="Italic (Ctrl+I)"
        >
          <TextItalicIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('~~', '~~')}
          className="p-2 rounded-md hover-bg"
          title="Strikethrough (Ctrl+Shift+S)"
        >
          <TextStrikethroughIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('`', '`')}
          className="p-2 rounded-md hover-bg"
          title="Inline Code (Ctrl+`)"
        >
          <CodeIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('\n```\n', '\n```\n')}
          className="p-2 rounded-md hover-bg"
          title="Code Block (Ctrl+Shift+C)"
        >
          <CodeBlockIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        
        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* Lists and Links */}
        <button
          onClick={() => insertMarkdown('- ')}
          className="p-2 rounded-md hover-bg"
          title="Bullet List (Ctrl+Shift+L)"
        >
          <ListBulletsIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('1. ')}
          className="p-2 rounded-md hover-bg"
          title="Numbered List (Ctrl+Shift+O)"
        >
          <ListNumbersIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('- [ ] ')}
          className="p-2 rounded-md hover-bg"
          title="Task List (Ctrl+Shift+T)"
        >
          <ListChecksIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('[', '](url)')}
          className="p-2 rounded-md hover-bg"
          title="Insert Link (Ctrl+K)"
        >
          <LinkIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('> ')}
          className="p-2 rounded-md hover-bg"
          title="Quote (Ctrl+/)"
        >
          <QuotesIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        
        {/* Extended Syntax Buttons */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          onClick={() => insertMarkdown('[^1]: ')}
          className="p-2 rounded-md hover-bg"
          title="Footnote (Ctrl+Shift+F)"
        >
          <AsteriskIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('==', '==')}
          className="p-2 rounded-md hover-bg"
          title="Highlight (Ctrl+Shift+H)"
        >
          <HighlighterIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('~', '~')}
          className="p-2 rounded-md hover-bg"
          title="Subscript (Ctrl+,)"
        >
          <TextSubscriptIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('^', '^')}
          className="p-2 rounded-md hover-bg"
          title="Superscript (Ctrl+.)"
        >
          <TextSuperscriptIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => insertMarkdown('\nTerm\n:   Definition\n')}
          className="p-2 rounded-md hover-bg"
          title="Definition List (Ctrl+Shift+D)"
        >
          <BookOpenTextIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      
      {/* Right Side Controls */}
      <div className="flex items-center gap-2">
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          onClick={() => setWordWrapEnabled(!wordWrapEnabled)}
          className={`p-2 rounded-md hover-bg ${
            wordWrapEnabled ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
          title={wordWrapEnabled ? 'Disable word wrap (Alt+Z)' : 'Enable word wrap (Alt+Z)'}
        >
          {wordWrapEnabled ? (
            <TextAlignLeftIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
          ) : (
            <ArrowsOutLineHorizontalIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
          )}
        </button>
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 rounded-md hover-bg"
          title="Show help (F1)"
        >
          <QuestionIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};