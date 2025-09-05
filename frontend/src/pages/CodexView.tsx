import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, CheckSquare, Square, FileText, Book } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { codexAPI, sectionAPI, CodexWithSections, Section } from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import md from '../utils/markdown';

export const CodexView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCodexTitle } = useBreadcrumb();
  const [codex, setCodex] = useState<CodexWithSections | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [sectionContent, setSectionContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);

  useEffect(() => {
    if (id) {
      loadCodex(parseInt(id));
    }
    
    // Cleanup breadcrumbs when component unmounts
    return () => {
      setCodexTitle('');
    };
  }, [id, setCodexTitle]);

  useEffect(() => {
    if (selectedSection) {
      loadSectionContent(selectedSection.id);
    }
  }, [selectedSection]);

  const loadCodex = async (codexId: number) => {
    try {
      setIsLoading(true);
      const data = await codexAPI.getWithSections(codexId);
      setCodex(data);
      
      // Update breadcrumb with codex title
      setCodexTitle(data.title);
      
      // Select first incomplete section by default, or first section if all are complete
      if (data.sections && data.sections.length > 0) {
        const firstIncomplete = data.sections.find(section => !section.isComplete);
        setSelectedSection(firstIncomplete || data.sections[data.sections.length - 1]);
      }
    } catch (error) {
      console.error('Failed to load codex:', error);
      toast.error('Failed to load codex');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSectionContent = async (sectionId: number) => {
    try {
      setIsLoadingContent(true);
      const content = await sectionAPI.getContent(sectionId);
      setSectionContent(content);
    } catch (error) {
      console.error('Failed to load section content:', error);
      setSectionContent('');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionTitle.trim() || !codex) return;

    try {
      setIsAddingSection(true);
      const newSection = await sectionAPI.create(codex.id, newSectionTitle.trim());
      
      // Reload codex to get updated sections
      await loadCodex(codex.id);
      
      // Select the new section
      setSelectedSection(newSection);
      setNewSectionTitle('');
      toast.success('Section added successfully');
    } catch (error) {
      console.error('Failed to add section:', error);
      toast.error('Failed to add section');
    } finally {
      setIsAddingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!deletingSection || !codex) return;

    try {
      await sectionAPI.delete(deletingSection.id);
      
      // If we deleted the selected section, clear selection
      if (selectedSection?.id === deletingSection.id) {
        setSelectedSection(null);
        setSectionContent('');
      }
      
      toast.success('Section deleted successfully');
      setDeletingSection(null);
      
      // Reload codex
      await loadCodex(codex.id);
    } catch (error) {
      console.error('Failed to delete section:', error);
      toast.error('Failed to delete section');
      setDeletingSection(null);
    }
  };

  const handleToggleComplete = async (section: Section) => {
    try {
      await sectionAPI.setComplete(section.id, !section.isComplete);
      
      // Reload codex to get updated sections
      if (codex) {
        await loadCodex(codex.id);
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!codex) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Codex not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
            <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{codex.title}</h1>
            {codex.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {codex.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Table of Contents */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-lg mb-3">Manuscripts</h2>
            
            {/* Add new section */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSection();
                  }
                }}
                placeholder="New manuscript title..."
                className="input flex-1"
                disabled={isAddingSection}
              />
              <button
                onClick={handleAddSection}
                disabled={!newSectionTitle.trim() || isAddingSection}
                className="btn-primary px-3"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sections list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {codex.sections && codex.sections.length > 0 ? (
              <div className="p-2">
                {codex.sections.map((section) => (
                  <div
                    key={section.id}
                    className={`group mb-1 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSection?.id === section.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedSection(section)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(section);
                          }}
                          className="mt-0.5 text-gray-500 hover:text-blue-500"
                        >
                          {section.isComplete ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={`flex-1 ${
                            section.isComplete ? 'line-through text-gray-500' : ''
                          }`}
                        >
                          {section.title}
                        </span>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/codex/${codex.id}/section/${section.id}/edit`);
                          }}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingSection(section);
                          }}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p>No manuscripts yet</p>
                <p className="text-sm mt-1">Add your first manuscript above</p>
              </div>
            )}
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 overflow-y-auto">
          {selectedSection ? (
            <div className="h-full">
              {/* Section header */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{selectedSection.title}</h2>
                  <button
                    onClick={() => navigate(`/codex/${codex.id}/section/${selectedSection.id}/edit`)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {isLoadingContent ? (
                  <LoadingSpinner size="md" />
                ) : sectionContent ? (
                  <div 
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: md.render(sectionContent) }}
                  />
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="mb-4">This section is empty</p>
                    <button
                      onClick={() => navigate(`/codex/${codex.id}/section/${selectedSection.id}/edit`)}
                      className="btn-primary"
                    >
                      Add Content
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>{codex.sections && codex.sections.length > 0 ? 'Select a section to view' : 'Create your first section'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Section Confirmation Modal */}
      {deletingSection && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeletingSection(null)}
          onConfirm={handleDeleteSection}
          title="Delete Section"
          message={`Are you sure you want to delete "${deletingSection.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </div>
  );
};
