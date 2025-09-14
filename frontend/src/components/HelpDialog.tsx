import React from 'react';
import { XIcon, CommandIcon, KeyboardIcon } from '@phosphor-icons/react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const keyboardShortcuts = [
    {
      category: 'File Operations',
      shortcuts: [
        { keys: ['Ctrl', 'S'], description: 'Save section' },
        { keys: ['Alt', 'Z'], description: 'Toggle word wrap' },
      ],
    },
    {
      category: 'Text Formatting',
      shortcuts: [
        { keys: ['Ctrl', 'B'], description: 'Bold text' },
        { keys: ['Ctrl', 'I'], description: 'Italic text' },
        { keys: ['Ctrl', 'Shift', 'S'], description: 'Strikethrough text' },
        { keys: ['Ctrl', '`'], description: 'Inline code' },
        { keys: ['Ctrl', 'Shift', 'C'], description: 'Code block' },
        { keys: ['Ctrl', 'Shift', 'H'], description: 'Highlight text' },
      ],
    },
    {
      category: 'Headers',
      shortcuts: [
        { keys: ['Ctrl', '1'], description: 'Heading 1 (# )' },
        { keys: ['Ctrl', '2'], description: 'Heading 2 (## )' },
        { keys: ['Ctrl', '3'], description: 'Heading 3 (### )' },
        { keys: ['Ctrl', '4'], description: 'Heading 4 (#### )' },
        { keys: ['Ctrl', '5'], description: 'Heading 5 (##### )' },
        { keys: ['Ctrl', '6'], description: 'Heading 6 (###### )' },
      ],
    },
    {
      category: 'Lists and Links',
      shortcuts: [
        { keys: ['Ctrl', 'Shift', 'L'], description: 'Bullet list' },
        { keys: ['Ctrl', 'Shift', 'O'], description: 'Numbered list' },
        { keys: ['Ctrl', 'Shift', 'T'], description: 'Task list' },
        { keys: ['Ctrl', 'K'], description: 'Insert link' },
        { keys: ['Ctrl', '/'], description: 'Quote (> )' },
      ],
    },
    {
      category: 'Extended Syntax',
      shortcuts: [
        { keys: ['Ctrl', 'Shift', 'F'], description: 'Footnote' },
        { keys: ['Ctrl', 'Shift', 'D'], description: 'Definition list' },
        { keys: ['Ctrl', ','], description: 'Subscript' },
        { keys: ['Ctrl', '.'], description: 'Superscript' },
      ],
    },
    {
      category: 'Indentation',
      shortcuts: [
        { keys: ['Tab'], description: 'Indent line(s) or insert 4 spaces' },
        { keys: ['Shift', 'Tab'], description: 'Un-indent line(s)' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="w-full max-w-4xl max-h-[90vh] m-4 rounded-lg border overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <KeyboardIcon size={24} className="text-gray-500" />
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover-bg"
            aria-label="Close help dialog"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              CodeX supports VS Code-style keyboard shortcuts for efficient
              markdown editing. Use these shortcuts to format text, create
              headers, lists, and more without lifting your hands from the
              keyboard.
            </p>
          </div>

          {/* Keyboard Shortcuts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {keyboardShortcuts.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-lg font-semibold mb-4 text-gray-600 dark:text-blue-400">
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.shortcuts.map((shortcut, shortcutIndex) => (
                    <div
                      key={shortcutIndex}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--color-hover)' }}
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-gray-400 mx-1">+</span>
                            )}
                            <kbd
                              className="px-2 py-1 text-xs font-mono rounded border"
                              style={{
                                backgroundColor: 'var(--color-bg)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                              }}
                            >
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Tips */}
          <div
            className="mt-8 p-4 rounded-lg"
            style={{ backgroundColor: 'var(--color-card)' }}
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CommandIcon size={20} className="text-green-500" />
              Pro Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                • <strong>Tab Indentation:</strong> Use Tab to indent lines or
                code blocks, just like in VS Code
              </li>
              <li>
                • <strong>Multi-line Selection:</strong> Select multiple lines
                and use Tab/Shift+Tab to indent/unindent all at once
              </li>
              <li>
                • <strong>Extended Syntax:</strong> Support for task lists,
                footnotes, definition lists, subscript/superscript, and
                highlighting
              </li>
              <li>
                • <strong>Auto-save:</strong> Enable auto-save in Settings to
                automatically save your work every 30 seconds
              </li>
              <li>
                • <strong>Preview Toggle:</strong> Click the eye icon or use
                toolbar buttons to toggle between editor and preview modes
              </li>
              <li>
                • <strong>Word Wrap:</strong> Toggle word wrap to handle long
                lines (Alt+Z)
              </li>
            </ul>
          </div>

          {/* Markdown Quick Reference */}
          <div
            className="mt-8 p-4 rounded-lg"
            style={{ backgroundColor: 'var(--color-card)' }}
          >
            <h3 className="text-lg font-semibold mb-3">
              Markdown Quick Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Headers</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  {`# Heading 1
## Heading 2
### Heading 3`}
                </pre>

                <h4 className="font-medium mb-2">Emphasis</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400">
                  {`**bold text**
*italic text*
\`inline code\``}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Lists</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  {`- Bullet item
- Another item

1. Numbered item
2. Second item`}
                </pre>

                <h4 className="font-medium mb-2">Links & Quotes</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400">
                  {`[Link text](https://example.com)
> Blockquote text`}
                </pre>

                <h4 className="font-medium mb-2 mt-3">Extended Syntax</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400">
                  {`- [x] Task completed
- [ ] Task pending

H~2~O (subscript)

E=mc^2^ (superscript)

==highlighted text==

Here's a sentence with a footnote. [^1]

[^1]: Footnote text`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
