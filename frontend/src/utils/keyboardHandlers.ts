// Keyboard handling utilities for the section editor
// Extracted from SectionEditor.tsx for better maintainability

import React from 'react';
import { keymap } from '@codemirror/view';

export interface KeyboardHandlerCallbacks {
  insertMarkdown: (prefix: string, suffix?: string) => void;
  handleSave: () => void;
  setContent: (content: string) => void;
  setWordWrapEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  setShowHelp: (show: boolean) => void;
}

export interface KeyStroke {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export function handleTabIndentation(
  e: React.KeyboardEvent,
  setContent: (content: string) => void
): void {
  e.preventDefault();
  const textarea = e.target as HTMLTextAreaElement;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const currentContent = textarea.value;

  if (e.shiftKey) {
    handleShiftTab(textarea, start, end, currentContent, setContent);
  } else {
    handleTab(textarea, start, end, currentContent, setContent);
  }
}

function handleShiftTab(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  currentContent: string,
  setContent: (content: string) => void
): void {
  const lines = currentContent.split('\n');
  let lineStart = 0;
  let lineEnd = 0;
  let currentPos = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1;
    if (currentPos <= start && start <= currentPos + lineLength) {
      lineStart = i;
    }
    if (currentPos <= end && end <= currentPos + lineLength) {
      lineEnd = i;
      break;
    }
    currentPos += lineLength;
  }

  let positionOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    if (i >= lineStart && i <= lineEnd) {
      if (lines[i].startsWith('    ')) {
        lines[i] = lines[i].substring(4);
        if (i === lineStart) positionOffset = -4;
      } else if (lines[i].startsWith('\t')) {
        lines[i] = lines[i].substring(1);
        if (i === lineStart) positionOffset = -1;
      }
    }
  }

  const newContent = lines.join('\n');
  setContent(newContent);

  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(
      Math.max(0, start + positionOffset),
      Math.max(0, end + positionOffset)
    );
  }, 0);
}

function handleTab(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  currentContent: string,
  setContent: (content: string) => void
): void {
  if (start !== end) {
    const beforeText = currentContent.substring(0, start);
    const selectedText = currentContent.substring(start, end);
    const afterText = currentContent.substring(end);

    const lineStart = beforeText.lastIndexOf('\n') + 1;
    const selectedLines = (
      beforeText.substring(lineStart) + selectedText
    ).split('\n');

    const indentedLines = selectedLines.map(line => '    ' + line);
    const newSelectedText = indentedLines.join('\n');

    const newContent =
      beforeText.substring(0, lineStart) + newSelectedText + afterText;
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 4, end + indentedLines.length * 4);
    }, 0);
  } else {
    const newContent =
      currentContent.substring(0, start) +
      '    ' +
      currentContent.substring(start);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 4, start + 4);
    }, 0);
  }
}

type ShortcutHandler = (callbacks: KeyboardHandlerCallbacks) => void;

interface KeyboardShortcut {
  handler: ShortcutHandler;
  description: string;
}

const KEYBOARD_SHORTCUTS: Record<string, KeyboardShortcut> = {
  // File operations
  'ctrl+s': {
    handler: callbacks => callbacks.handleSave(),
    description: 'Save section',
  },
  'cmd+s': {
    handler: callbacks => callbacks.handleSave(),
    description: 'Save section',
  },

  // Text formatting
  'ctrl+b': {
    handler: callbacks => callbacks.insertMarkdown('**', '**'),
    description: 'Bold text',
  },
  'cmd+b': {
    handler: callbacks => callbacks.insertMarkdown('**', '**'),
    description: 'Bold text',
  },
  'ctrl+i': {
    handler: callbacks => callbacks.insertMarkdown('*', '*'),
    description: 'Italic text',
  },
  'cmd+i': {
    handler: callbacks => callbacks.insertMarkdown('*', '*'),
    description: 'Italic text',
  },
  'ctrl+shift+s': {
    handler: callbacks => callbacks.insertMarkdown('~~', '~~'),
    description: 'Strikethrough text',
  },
  'cmd+shift+s': {
    handler: callbacks => callbacks.insertMarkdown('~~', '~~'),
    description: 'Strikethrough text',
  },
  'ctrl+`': {
    handler: callbacks => callbacks.insertMarkdown('`', '`'),
    description: 'Inline code',
  },
  'cmd+`': {
    handler: callbacks => callbacks.insertMarkdown('`', '`'),
    description: 'Inline code',
  },

  // Headers
  'ctrl+1': {
    handler: callbacks => callbacks.insertMarkdown('# '),
    description: 'Heading 1',
  },
  'cmd+1': {
    handler: callbacks => callbacks.insertMarkdown('# '),
    description: 'Heading 1',
  },
  'ctrl+2': {
    handler: callbacks => callbacks.insertMarkdown('## '),
    description: 'Heading 2',
  },
  'cmd+2': {
    handler: callbacks => callbacks.insertMarkdown('## '),
    description: 'Heading 2',
  },
  'ctrl+3': {
    handler: callbacks => callbacks.insertMarkdown('### '),
    description: 'Heading 3',
  },
  'cmd+3': {
    handler: callbacks => callbacks.insertMarkdown('### '),
    description: 'Heading 3',
  },
  'ctrl+4': {
    handler: callbacks => callbacks.insertMarkdown('#### '),
    description: 'Heading 4',
  },
  'cmd+4': {
    handler: callbacks => callbacks.insertMarkdown('#### '),
    description: 'Heading 4',
  },
  'ctrl+5': {
    handler: callbacks => callbacks.insertMarkdown('##### '),
    description: 'Heading 5',
  },
  'cmd+5': {
    handler: callbacks => callbacks.insertMarkdown('##### '),
    description: 'Heading 5',
  },
  'ctrl+6': {
    handler: callbacks => callbacks.insertMarkdown('###### '),
    description: 'Heading 6',
  },
  'cmd+6': {
    handler: callbacks => callbacks.insertMarkdown('###### '),
    description: 'Heading 6',
  },

  // Links and quotes
  'ctrl+k': {
    handler: callbacks => callbacks.insertMarkdown('[', '](url)'),
    description: 'Insert link',
  },
  'cmd+k': {
    handler: callbacks => callbacks.insertMarkdown('[', '](url)'),
    description: 'Insert link',
  },
  'ctrl+/': {
    handler: callbacks => callbacks.insertMarkdown('> '),
    description: 'Quote',
  },
  'cmd+/': {
    handler: callbacks => callbacks.insertMarkdown('> '),
    description: 'Quote',
  },

  // Lists and code blocks (with shift)
  'ctrl+shift+c': {
    handler: callbacks => callbacks.insertMarkdown('\n```\n', '\n```\n'),
    description: 'Code block',
  },
  'cmd+shift+c': {
    handler: callbacks => callbacks.insertMarkdown('\n```\n', '\n```\n'),
    description: 'Code block',
  },
  'ctrl+shift+l': {
    handler: callbacks => callbacks.insertMarkdown('- '),
    description: 'Bullet list',
  },
  'cmd+shift+l': {
    handler: callbacks => callbacks.insertMarkdown('- '),
    description: 'Bullet list',
  },
  'ctrl+shift+o': {
    handler: callbacks => callbacks.insertMarkdown('1. '),
    description: 'Numbered list',
  },
  'cmd+shift+o': {
    handler: callbacks => callbacks.insertMarkdown('1. '),
    description: 'Numbered list',
  },
  'ctrl+shift+t': {
    handler: callbacks => callbacks.insertMarkdown('- [ ] '),
    description: 'Task list',
  },
  'cmd+shift+t': {
    handler: callbacks => callbacks.insertMarkdown('- [ ] '),
    description: 'Task list',
  },

  // Extended syntax shortcuts
  'ctrl+shift+f': {
    handler: callbacks => callbacks.insertMarkdown('[^1]: '),
    description: 'Footnote',
  },
  'cmd+shift+f': {
    handler: callbacks => callbacks.insertMarkdown('[^1]: '),
    description: 'Footnote',
  },
  'ctrl+shift+h': {
    handler: callbacks => callbacks.insertMarkdown('==', '=='),
    description: 'Highlight text',
  },
  'cmd+shift+h': {
    handler: callbacks => callbacks.insertMarkdown('==', '=='),
    description: 'Highlight text',
  },
  'ctrl+shift+d': {
    handler: callbacks => callbacks.insertMarkdown('\nTerm\n:   Definition\n'),
    description: 'Definition list',
  },
  'cmd+shift+d': {
    handler: callbacks => callbacks.insertMarkdown('\nTerm\n:   Definition\n'),
    description: 'Definition list',
  },
  'ctrl+,': {
    handler: callbacks => callbacks.insertMarkdown('~', '~'),
    description: 'Subscript',
  },
  'cmd+,': {
    handler: callbacks => callbacks.insertMarkdown('~', '~'),
    description: 'Subscript',
  },
  'ctrl+.': {
    handler: callbacks => callbacks.insertMarkdown('^', '^'),
    description: 'Superscript',
  },
  'cmd+.': {
    handler: callbacks => callbacks.insertMarkdown('^', '^'),
    description: 'Superscript',
  },

  // Other shortcuts
  'alt+z': {
    handler: callbacks => callbacks.setWordWrapEnabled(prev => !prev),
    description: 'Toggle word wrap',
  },
  f1: {
    handler: callbacks => callbacks.setShowHelp(true),
    description: 'Show help',
  },
  'ctrl+?': {
    handler: callbacks => callbacks.setShowHelp(true),
    description: 'Show help',
  },
  'cmd+?': {
    handler: callbacks => callbacks.setShowHelp(true),
    description: 'Show help',
  },
};

function getShortcutKey(e: KeyboardEvent | React.KeyboardEvent): string {
  const parts: string[] = [];

  if (e.ctrlKey) parts.push('ctrl');
  if (e.metaKey) parts.push('cmd');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');

  parts.push(e.key.toLowerCase());

  return parts.join('+');
}

export function handleKeyboardShortcut(
  e: React.KeyboardEvent,
  callbacks: KeyboardHandlerCallbacks
): boolean {
  if (e.key === 'Tab') {
    handleTabIndentation(e, callbacks.setContent);
    return true;
  }

  const shortcutKey = getShortcutKey(e);
  const shortcut = KEYBOARD_SHORTCUTS[shortcutKey];

  if (shortcut) {
    e.preventDefault();
    shortcut.handler(callbacks);
    return true;
  }

  return false;
}

export function getKeyboardShortcuts() {
  return Object.entries(KEYBOARD_SHORTCUTS).map(([key, shortcut]) => ({
    key,
    description: shortcut.description,
  }));
}

function convertToCodeMirrorKey(shortcutKey: string): {
  key: string;
  mac?: string;
} {
  const parts = shortcutKey.split('+');
  const modifiers: string[] = [];
  let key = '';

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
        modifiers.push('Ctrl');
        break;
      case 'cmd':
        modifiers.push('Cmd');
        break;
      case 'shift':
        modifiers.push('Shift');
        break;
      case 'alt':
        modifiers.push('Alt');
        break;
      default:
        key = part === '`' ? '`' : part; // Handle backtick specially
        break;
    }
  }

  const codeMirrorKey = [...modifiers, key].join('-');

  // Handle platform-specific keys
  if (shortcutKey.includes('ctrl+') && shortcutKey.includes('cmd+')) {
    return { key: codeMirrorKey };
  } else if (shortcutKey.includes('ctrl+')) {
    const macKey = codeMirrorKey.replace('Ctrl', 'Cmd');
    return { key: codeMirrorKey, mac: macKey };
  } else if (shortcutKey.includes('cmd+')) {
    const winKey = codeMirrorKey.replace('Cmd', 'Ctrl');
    return { key: winKey, mac: codeMirrorKey };
  }

  return { key: codeMirrorKey };
}

export function createCodeMirrorKeymap(callbacks: KeyboardHandlerCallbacks) {
  const keymapBindings = [];

  for (const [shortcutKey, shortcut] of Object.entries(KEYBOARD_SHORTCUTS)) {
    const { key, mac } = convertToCodeMirrorKey(shortcutKey);

    keymapBindings.push({
      key,
      ...(mac && { mac }),
      run: () => {
        shortcut.handler(callbacks);
        return true;
      },
    });
  }

  return keymap.of(keymapBindings);
}
