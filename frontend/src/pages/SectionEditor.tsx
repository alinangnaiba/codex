import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, FloppyDiskIcon, FileIcon, EyeIcon, CodeIcon, UploadSimpleIcon, TextHOneIcon, TextHTwoIcon, TextHThreeIcon, TextBIcon, TextItalicIcon, TextStrikethroughIcon, CodeBlockIcon, ListBulletsIcon, ListNumbersIcon, LinkIcon, QuotesIcon, TextAlignLeftIcon, ArrowsOutLineHorizontalIcon, QuestionIcon, CheckSquareIcon, FootprintsIcon, HighlighterIcon, TextSubscriptIcon, TextSuperscriptIcon, BookIcon, SmileyIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { HelpDialog } from '../components/HelpDialog';
import { sectionAPI, codexAPI, fileAPI, settingsAPI } from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import md from '../utils/markdown';
import toast from 'react-hot-toast';
import { handleKeyboardShortcut, KeyboardHandlerCallbacks } from '../utils/keyboardHandlers';

export const SectionEditor: React.FC = () => {
  const { codexId, sectionId } = useParams<{ codexId: string; sectionId: string }>();
  const navigate = useNavigate();
  const { setCodexTitle, setSectionTitle: setBreadcrumbSectionTitle } = useBreadcrumb();
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
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Use refs to capture latest values for interval callback
  const latestContentRef = useRef(content);
  const latestOriginalContentRef = useRef(originalContent);
  const latestSectionTitleRef = useRef(sectionTitle);
  const latestOriginalSectionTitleRef = useRef(originalSectionTitle);
  const latestIsSavingRef = useRef(isSaving);


  // Update refs whenever values change
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

  useEffect(() => {
    if (sectionId) {
      loadSection(parseInt(sectionId));
    }
    loadSettings();
  }, [sectionId]);

  const loadSettings = async () => {
    try {
      const autoSave = await settingsAPI.get('autoSave');
      setAutoSaveEnabled(autoSave === 'true');
      
      const wordWrap = await settingsAPI.get('wordWrap');
      // Default to true if not set
      setWordWrapEnabled(wordWrap !== 'false');
    } catch (error) {
      console.error('Failed to load settings:', error);
      setAutoSaveEnabled(false);
      setWordWrapEnabled(true);
    }
  };

  const handleSave = useCallback(async () => {
    if (!sectionId || !sectionTitle.trim()) return;

    try {
      setIsSaving(true);
      await sectionAPI.update(parseInt(sectionId), sectionTitle.trim(), content);
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
      const hasContentChanges = latestContentRef.current !== latestOriginalContentRef.current;
      const hasTitleChanges = latestSectionTitleRef.current !== latestOriginalSectionTitleRef.current;
      const isCurrentlySaving = latestIsSavingRef.current;

      // Only run auto-save if there are actual changes and not currently saving
      if ((hasContentChanges || hasTitleChanges) && !isCurrentlySaving) {
        console.log('Auto-save triggered - Content changed:', hasContentChanges, 'Title changed:', hasTitleChanges);
        handleSave();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [autoSaveEnabled, handleSave]);

  const loadSection = async (id: number) => {
    try {
      setIsLoading(true);
      
      // Get section details
      const sections = await sectionAPI.getByCodex(parseInt(codexId!));
      const section = sections.find(s => s.id === id);
      
      if (!section) {
        throw new Error('Section not found');
      }
      
      setSectionTitle(section.title);
      setOriginalSectionTitle(section.title);
      
      // Update breadcrumb with section title
      setBreadcrumbSectionTitle(section.title);
      
      // Get codex details for breadcrumb
      const codex = await codexAPI.getWithSections(parseInt(codexId!));
      setCodexTitle(codex.title);
      
      // Get section content
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
  };


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

  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = textarea.value;
    const selectedText = currentContent.substring(start, end);
    const replacement = prefix + selectedText + suffix;
    const newContent = currentContent.substring(0, start) + replacement + currentContent.substring(end);
    
    setContent(newContent);
    
    setTimeout(() => {
      textarea.scrollTop = scrollTop;
      textarea.scrollLeft = scrollLeft;
      
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
      
      // Ensure scroll position is maintained after focus
      requestAnimationFrame(() => {
        textarea.scrollTop = scrollTop;
        textarea.scrollLeft = scrollLeft;
      });
    }, 0);
  }, []);

  // Create callbacks object for keyboard handler
  const keyboardCallbacks: KeyboardHandlerCallbacks = useMemo(() => ({
    insertMarkdown,
    handleSave,
    setContent,
    setWordWrapEnabled,
    setShowHelp
  }), [insertMarkdown, handleSave, setWordWrapEnabled, setShowHelp]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    handleKeyboardShortcut(e, keyboardCallbacks);
  }, [keyboardCallbacks]);

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
              <ArrowLeftIcon size={20} weight="regular" className="text-gray-600 dark:text-gray-400" />
            </button>
            <input
              type="text"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
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
                <span>Saved at {lastSaved.toLocaleTimeString()} {hasChanges}</span>
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
              <UploadSimpleIcon size={20} weight="regular" className="text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded-lg hover-bg"
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? <CodeIcon size={20} weight="regular" className="text-gray-600 dark:text-gray-400" /> : <EyeIcon size={20} weight="regular" className="text-gray-600 dark:text-gray-400" />}
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

      {/* Toolbar Container */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
        {/* Toolbar */}
        <div className="flex items-center gap-1">
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
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
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
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
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
            onClick={() => insertMarkdown('- [ ] ')}
            className="p-2 rounded-md hover-bg"
            title="Task List (Ctrl+Shift+T)"
          >
            <CheckSquareIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => insertMarkdown('[^1]: ')}
            className="p-2 rounded-md hover-bg"
            title="Footnote (Ctrl+Shift+F)"
          >
            <FootprintsIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
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
            <BookIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
          </button>
          
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
        </div>
        
        {/* Help Button */}
        <div className="flex items-center">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg hover-bg"
            title="Keyboard Shortcuts (F1 or Ctrl+?)"
          >
            <QuestionIcon size={18} weight="regular" className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Editor and preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={showPreview ? 'w-1/2' : 'w-full'}>
          <div className="h-full relative">
            {/* Editor textarea */}
            <div className="relative overflow-hidden h-full">
              <textarea
                ref={editorRef}
                id="markdown-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="absolute inset-0 pr-6 pl-4 pt-6 resize-none focus:outline-none font-mono text-sm editor-textarea"
                style={{ 
                  backgroundColor: 'var(--color-bg)', 
                  color: 'var(--color-text)',
                  lineHeight: '1.5rem',
                  overflowY: 'auto',
                  overflowX: wordWrapEnabled ? 'hidden' : 'auto',
                  whiteSpace: wordWrapEnabled ? 'pre-wrap' : 'pre',
                  wordBreak: wordWrapEnabled ? 'break-word' : 'normal',
                  overflowWrap: wordWrapEnabled ? 'break-word' : 'normal',
                  paddingBottom: '50vh' // Extra bottom padding to allow scrolling past the last line
                }}
                placeholder="Start writing in Markdown...\n\n# Heading 1\n## Heading 2\n\n**Bold text** and *italic text*\n\n- List item\n- Another item\n\n[Link text](https://example.com)"
              />
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
      <HelpDialog 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
    </div>
  );
};
