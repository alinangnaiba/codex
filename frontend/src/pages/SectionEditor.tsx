import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  FloppyDiskIcon,
  FileIcon,
  EyeIcon,
  CodeIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { HelpDialog } from '../components/HelpDialog';
import { EditorToolbar } from '../components/EditorToolbar';
import { sectionAPI, codexAPI, fileAPI, settingsAPI } from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { useTheme } from '../contexts/ThemeContext';
import md from '../utils/markdown';
import toast from 'react-hot-toast';
import {
  KeyboardHandlerCallbacks,
  createCodeMirrorKeymap,
} from '../utils/keyboardHandlers';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { search, highlightSelectionMatches } from '@codemirror/search';
import { EditorView, ViewUpdate } from '@codemirror/view';

export const SectionEditor: React.FC = () => {
  const { codexId, sectionId } = useParams<{
    codexId: string;
    sectionId: string;
  }>();
  const navigate = useNavigate();
  const { setCodexTitle, setSectionTitle: setBreadcrumbSectionTitle } =
    useBreadcrumb();
  const { theme } = useTheme();
  const [sectionTitle, setSectionTitle] = useState('');
  const [originalSectionTitle, setOriginalSectionTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [wordWrapEnabled, setWordWrapEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const latestContentRef = useRef(content);
  const latestOriginalContentRef = useRef(originalContent);
  const latestSectionTitleRef = useRef(sectionTitle);
  const latestOriginalSectionTitleRef = useRef(originalSectionTitle);
  const latestIsSavingRef = useRef(isSaving);

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  useEffect(() => {
    latestOriginalContentRef.current = originalContent;
  }, [originalContent]);

  useEffect(() => {
    latestSectionTitleRef.current = sectionTitle;
  }, [sectionTitle]);

  useEffect(() => {
    latestOriginalSectionTitleRef.current = originalSectionTitle;
  }, [originalSectionTitle]);

  useEffect(() => {
    latestIsSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    const contentChanged = content !== originalContent;
    const titleChanged = sectionTitle !== originalSectionTitle;
    setHasChanges(contentChanged || titleChanged);
  }, [content, originalContent, sectionTitle, originalSectionTitle]);

  const loadSettings = useCallback(async () => {
    try {
      const autoSave = await settingsAPI.get('autoSave');
      setAutoSaveEnabled(autoSave === 'true');

      const wordWrap = await settingsAPI.get('wordWrap');
      setWordWrapEnabled(wordWrap !== 'false');
    } catch (error) {
      console.error('Failed to load settings:', error);
      setAutoSaveEnabled(false);
      setWordWrapEnabled(true);
    }
  }, []);

  const loadSection = useCallback(
    async (id: number) => {
      try {
        setIsLoading(true);
        const sections = await sectionAPI.getByCodex(parseInt(codexId!));
        const section = sections.find(s => s.id === id);

        if (!section) {
          throw new Error('Section not found');
        }

        setSectionTitle(section.title);
        setOriginalSectionTitle(section.title);

        setBreadcrumbSectionTitle(section.title);

        const codex = await codexAPI.getWithSections(parseInt(codexId!));
        setCodexTitle(codex.title);

        const sectionContent = await sectionAPI.getContent(id);
        setContent(sectionContent || '');
        setOriginalContent(sectionContent || '');
      } catch (error) {
        console.error('Failed to load section:', error);
        toast.error('Failed to load section. Please try again.');
        navigate(`/codex/${codexId}`);
      } finally {
        setIsLoading(false);
      }
    },
    [codexId, navigate, setCodexTitle, setBreadcrumbSectionTitle]
  );

  useEffect(() => {
    if (sectionId) {
      loadSection(parseInt(sectionId));
    }
    loadSettings();
  }, [sectionId, loadSection, loadSettings]);

  const handleSave = useCallback(async () => {
    if (!sectionId || !sectionTitle.trim()) return;

    try {
      setIsSaving(true);
      await sectionAPI.update(
        parseInt(sectionId),
        sectionTitle.trim(),
        content
      );
      setOriginalContent(content);
      setOriginalSectionTitle(sectionTitle.trim());
      setLastSaved(new Date());
      toast.success('Section saved successfully!');
    } catch (error) {
      console.error('Failed to save section:', error);
      toast.error('Failed to save section. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [sectionId, sectionTitle, content]);

  // Auto-save every 30 seconds if there are changes and auto-save is enabled
  useEffect(() => {
    if (!autoSaveEnabled) {
      return;
    }

    const autoSaveInterval = setInterval(() => {
      const hasContentChanges =
        latestContentRef.current !== latestOriginalContentRef.current;
      const hasTitleChanges =
        latestSectionTitleRef.current !== latestOriginalSectionTitleRef.current;
      const isCurrentlySaving = latestIsSavingRef.current;

      if ((hasContentChanges || hasTitleChanges) && !isCurrentlySaving) {
        console.warn(
          'Auto-save triggered - Content changed:',
          hasContentChanges,
          'Title changed:',
          hasTitleChanges
        );
        handleSave();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [autoSaveEnabled, handleSave]);

  const handleImportFile = async () => {
    try {
      const filePath = await fileAPI.selectMarkdownFile();
      if (filePath) {
        const importedContent = await fileAPI.importMarkdown(filePath);
        setContent(importedContent);
      }
    } catch (error) {
      console.error('Failed to import file:', error);
      toast.error('Failed to import markdown file. Please try again.');
    }
  };

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = '') => {
      if (!editorView) {
        setContent(prev => prev + prefix + suffix);
        return;
      }

      const state = editorView.state;
      const selection = state.selection.main;
      const selectedText = state.doc.sliceString(selection.from, selection.to);

      const replacement = prefix + selectedText + suffix;

      const transaction = state.update({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: replacement,
        },
        selection: {
          anchor: selection.from + prefix.length,
          head: selection.from + prefix.length + selectedText.length,
        },
      });

      editorView.dispatch(transaction);
      editorView.focus();
    },
    [editorView]
  );

  const updateCursorPosition = useCallback((view: EditorView) => {
    const currentHead = view.state.selection.main.head;
    const line = view.state.doc.lineAt(currentHead);
    setCursorPosition({
      line: line.number,
      column: currentHead - line.from + 1,
    });
  }, []);

  const keyboardCallbacks: KeyboardHandlerCallbacks = useMemo(
    () => ({
      insertMarkdown,
      handleSave,
      setContent,
      setWordWrapEnabled,
      setShowHelp,
    }),
    [insertMarkdown, handleSave, setWordWrapEnabled, setShowHelp]
  );

  const cursorPositionExtension = useMemo(() => {
    return EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.selectionSet) {
        updateCursorPosition(update.view);
      }
    });
  }, [updateCursorPosition]);

  // CodeMirror extensions
  const extensions = useMemo(() => {
    const baseExtensions = [
      markdown(),
      search({ top: true }),
      highlightSelectionMatches(),
      createCodeMirrorKeymap(keyboardCallbacks),
      cursorPositionExtension,
      EditorView.theme(
        {
          '&': {
            fontSize: '14px',
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            height: '100%',
          },
          '.cm-focused': {
            outline: 'none',
          },
          '.cm-editor': {
            height: '100%',
            overflow: 'hidden',
          },
          '.cm-scroller': {
            fontFamily: 'inherit',
            lineHeight: '1.5',
            overflow: 'auto',
            maxHeight: '100%',
          },
          '.cm-content': {
            padding: '16px',
            minHeight: 'calc(100vh - 200px)', // Ensure content has minimum height to enable scrolling
            paddingBottom: '50vh', // Extra bottom padding
          },
        },
        theme === 'dark' ? { dark: true } : undefined
      ),
      EditorView.lineWrapping,
    ];

    return baseExtensions;
  }, [theme, keyboardCallbacks, cursorPositionExtension]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/codex/${codexId}`)}
              className="p-2 rounded-lg hover-bg"
            >
              <ArrowLeftIcon
                size={20}
                weight="regular"
                className="text-gray-600 dark:text-gray-400"
              />
            </button>
            <input
              type="text"
              value={sectionTitle}
              onChange={e => setSectionTitle(e.target.value)}
              className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none px-1 w-[36rem]"
              placeholder="Section title..."
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="text-sm text-gray-500">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Saving...
                </span>
              ) : lastSaved && !hasChanges ? (
                <span>
                  Saved at {lastSaved.toLocaleTimeString()} {hasChanges}
                </span>
              ) : hasChanges ? (
                <span className="text-orange-500">Unsaved changes</span>
              ) : null}
            </div>

            {/* Action buttons */}
            <button
              onClick={handleImportFile}
              className="p-2 rounded-lg hover-bg"
              title="Import markdown file"
            >
              <UploadSimpleIcon
                size={20}
                weight="regular"
                className="text-gray-600 dark:text-gray-400"
              />
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded-lg hover-bg"
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? (
                <CodeIcon
                  size={20}
                  weight="regular"
                  className="text-gray-600 dark:text-gray-400"
                />
              ) : (
                <EyeIcon
                  size={20}
                  weight="regular"
                  className="text-gray-600 dark:text-gray-400"
                />
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="btn-primary flex items-center gap-2"
            >
              <FloppyDiskIcon size={16} weight="regular" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar
        insertMarkdown={insertMarkdown}
        wordWrapEnabled={wordWrapEnabled}
        setWordWrapEnabled={setWordWrapEnabled}
        setShowHelp={setShowHelp}
      />

      {/* Editor and preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div
          className={showPreview ? 'w-1/2' : 'w-full'}
          style={{
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: '1', minHeight: '0' }}>
            <CodeMirror
              value={content}
              onChange={val => setContent(val)}
              onCreateEditor={view => {
                setEditorView(view);
                updateCursorPosition(view);
              }}
              extensions={extensions}
              theme={theme === 'dark' ? oneDark : undefined}
              placeholder="Start writing in Markdown...\n\n# Heading 1\n## Heading 2\n\n**Bold text** and *italic text*\n\n- List item\n- Another item\n\n[Link text](https://example.com)"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: false, // We handle this in extensions
                searchKeymap: true,
              }}
              height="100%"
              style={{ height: '100%' }}
            />
          </div>

          {/* Status Bar */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-1 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 flex justify-between items-center">
            <div>
              Ln {cursorPosition.line}, Col {cursorPosition.column}
            </div>
            <div className="flex items-center gap-3">
              {content.length > 0 && <span>{content.length} characters</span>}
              <span>Markdown</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-6">
              {content ? (
                <div
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: md.render(content) }}
                />
              ) : (
                <div className="text-gray-400 dark:text-gray-600">
                  <FileIcon size={48} weight="thin" className="mb-3" />
                  <p>Preview will appear here...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Dialog */}
      <HelpDialog isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};
