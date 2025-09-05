import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Eye, Code, Download, Upload } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { sectionAPI, codexAPI, fileAPI, settingsAPI } from '../utils/api';
import md from '../utils/markdown';

export const SectionEditor: React.FC = () => {
  const { codexId, sectionId } = useParams<{ codexId: string; sectionId: string }>();
  const navigate = useNavigate();
  const [sectionTitle, setSectionTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  useEffect(() => {
    if (sectionId) {
      loadSection(parseInt(sectionId));
    }
    loadAutoSaveSetting();
  }, [sectionId]);

  const loadAutoSaveSetting = async () => {
    try {
      const autoSave = await settingsAPI.get('autoSave');
      setAutoSaveEnabled(autoSave === 'true');
    } catch (error) {
      console.error('Failed to load auto-save setting:', error);
      setAutoSaveEnabled(false);
    }
  };

  // Auto-save every 30 seconds if there are changes and auto-save is enabled
  useEffect(() => {
    if (!autoSaveEnabled) {
      return;
    }

    const autoSaveInterval = setInterval(() => {
      if (content !== originalContent && !isSaving) {
        handleSave();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [content, originalContent, isSaving, autoSaveEnabled]);

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
      
      // Get section content
      const sectionContent = await sectionAPI.getContent(id);
      setContent(sectionContent || '');
      setOriginalContent(sectionContent || '');
    } catch (error) {
      console.error('Failed to load section:', error);
      alert('Failed to load section. Please try again.');
      navigate(`/codex/${codexId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sectionId || !sectionTitle.trim()) return;

    try {
      setIsSaving(true);
      await sectionAPI.update(parseInt(sectionId), sectionTitle.trim(), content);
      setOriginalContent(content);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save section:', error);
      alert('Failed to save section. Please try again.');
    } finally {
      setIsSaving(false);
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
      alert('Failed to import markdown file. Please try again.');
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = prefix + selectedText + suffix;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    
    setContent(newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'b':
          e.preventDefault();
          insertMarkdown('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('*', '*');
          break;
      }
    }
  }, [content]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasChanges = content !== originalContent;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/codex/${codexId}`)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1"
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
              ) : lastSaved ? (
                <span>Saved at {lastSaved.toLocaleTimeString()}</span>
              ) : hasChanges ? (
                <span className="text-orange-500">Unsaved changes</span>
              ) : null}
            </div>
            
            {/* Action buttons */}
            <button
              onClick={handleImportFile}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Import markdown file"
            >
              <Upload className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? <Code className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => insertMarkdown('# ')}
            className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => insertMarkdown('## ')}
            className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => insertMarkdown('### ')}
            className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Heading 3"
          >
            H3
          </button>
          <div className="w-px bg-gray-300 dark:bg-gray-600" />
          <button
            onClick={() => insertMarkdown('**', '**')}
            className="px-3 py-1 text-sm font-bold rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button
            onClick={() => insertMarkdown('*', '*')}
            className="px-3 py-1 text-sm italic rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Italic (Ctrl+I)"
          >
            I
          </button>
          <button
            onClick={() => insertMarkdown('`', '`')}
            className="px-3 py-1 text-sm font-mono rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Code"
          >
            {'<>'}
          </button>
          <div className="w-px bg-gray-300 dark:bg-gray-600" />
          <button
            onClick={() => insertMarkdown('- ')}
            className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Bullet list"
          >
            • List
          </button>
          <button
            onClick={() => insertMarkdown('1. ')}
            className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Numbered list"
          >
            1. List
          </button>
          <button
            onClick={() => insertMarkdown('[', '](url)')}
            className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Link"
          >
            Link
          </button>
          <button
            onClick={() => insertMarkdown('> ')}
            className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Quote"
          >
            " Quote
          </button>
        </div>
      </div>

      {/* Editor and preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={showPreview ? 'w-1/2' : 'w-full'}>
          <textarea
            id="markdown-editor"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-6 resize-none focus:outline-none bg-white dark:bg-gray-900 font-mono text-sm"
            placeholder="Start writing in Markdown...\n\n# Heading 1\n## Heading 2\n\n**Bold text** and *italic text*\n\n- List item\n- Another item\n\n[Link text](https://example.com)"
          />
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
                  <FileText className="w-12 h-12 mb-3" />
                  <p>Preview will appear here...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
