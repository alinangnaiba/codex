import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PencilSimpleIcon,
  TrashIcon,
  CheckSquareIcon,
  SquareIcon,
  FileIcon,
  BookOpenIcon,
  CaretRightIcon,
  CaretDownIcon,
  FilePlusIcon,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { codexAPI, sectionAPI, CodexWithSections, Section } from '../utils/api';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import md, {
  extractHeadings,
  HeadingInfo,
  NestedHeading,
  createNestedHeadings,
} from '../utils/markdown';

export const CodexView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCodexTitle } = useBreadcrumb();
  const [codex, setCodex] = useState<CodexWithSections | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [sectionContent, setSectionContent] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );
  const [expandedH2Headings, setExpandedH2Headings] = useState<Set<string>>(
    new Set()
  );
  const [allSectionHeadings, setAllSectionHeadings] = useState<
    Map<number, HeadingInfo[]>
  >(new Map());
  const [allNestedHeadings, setAllNestedHeadings] = useState<
    Map<number, NestedHeading[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);

  const getSectionHeadings = useCallback(
    async (sectionId: number): Promise<HeadingInfo[]> => {
      try {
        const content = await sectionAPI.getContent(sectionId);
        return extractHeadings(content);
      } catch (error) {
        console.error('Failed to get section headings:', error);
        return [];
      }
    },
    []
  );

  const loadCodex = useCallback(
    async (codexId: number) => {
      try {
        setIsLoading(true);
        const data = await codexAPI.getWithSections(codexId);
        setCodex(data);

        // Update breadcrumb with codex title
        setCodexTitle(data.title);

        // Preload headings for all sections to show carets immediately
        if (data.sections && data.sections.length > 0) {
          const headingsPromises = data.sections.map(async section => {
            const headings = await getSectionHeadings(section.id);
            return { sectionId: section.id, headings };
          });

          const allHeadings = await Promise.all(headingsPromises);
          const headingsMap = new Map<number, HeadingInfo[]>();
          const nestedHeadingsMap = new Map<number, NestedHeading[]>();

          allHeadings.forEach(({ sectionId, headings }) => {
            headingsMap.set(sectionId, headings);
            const nested = createNestedHeadings(headings);
            nestedHeadingsMap.set(sectionId, nested);
          });

          setAllSectionHeadings(headingsMap);
          setAllNestedHeadings(nestedHeadingsMap);

          // Select first incomplete section by default, or first section if all are complete
          const firstIncomplete = data.sections.find(
            section => !section.isComplete
          );
          const selectedSec =
            firstIncomplete || data.sections[data.sections.length - 1];
          setSelectedSection(selectedSec);

          // Auto-expand the selected section if it has headings
          const selectedHeadings = headingsMap.get(selectedSec.id) || [];
          if (selectedHeadings.length > 0) {
            setExpandedSections(new Set([selectedSec.id]));
          }
        }
      } catch (error) {
        console.error('Failed to load codex:', error);
        toast.error('Failed to load codex');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    },
    [setCodexTitle, getSectionHeadings, navigate]
  );

  const loadSectionContent = useCallback(
    async (sectionId: number) => {
      try {
        setIsLoadingContent(true);
        const content = await sectionAPI.getContent(sectionId);
        setSectionContent(content);

        // Extract H2 and H3 headings from the content
        const headings = extractHeadings(content);

        setAllSectionHeadings(prev => new Map(prev).set(sectionId, headings));

        if (headings.length > 0 && selectedSection?.id === sectionId) {
          setExpandedSections(() => {
            const newSet: Set<number> = new Set();
            newSet.add(sectionId); // Only expand the active section
            return newSet;
          });
        }
      } catch (error) {
        console.error('Failed to load section content:', error);
        setSectionContent('');
      } finally {
        setIsLoadingContent(false);
      }
    },
    [selectedSection]
  );

  useEffect(() => {
    if (id) {
      loadCodex(parseInt(id));
    }

    // Cleanup breadcrumbs when component unmounts
    return () => {
      setCodexTitle('');
    };
  }, [id, setCodexTitle, loadCodex]);

  useEffect(() => {
    if (selectedSection) {
      loadSectionContent(selectedSection.id);
    }
  }, [selectedSection, loadSectionContent]);

  const handleAddSection = async () => {
    if (!newSectionTitle.trim() || !codex) return;

    try {
      setIsAddingSection(true);
      const newSection = await sectionAPI.create(
        codex.id,
        newSectionTitle.trim()
      );

      setNewSectionTitle('');
      toast.success('Section added successfully');

      navigate(`/codex/${codex.id}/section/${newSection.id}/edit`);
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

  const toggleSectionExpansion = (sectionId: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        // When manually expanding, collapse other sections for better UX
        newSet.clear();
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const scrollToHeading = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  };

  const handleH2Click = (headingId: string, hasChildren: boolean) => {
    // First scroll to the heading
    scrollToHeading(headingId);

    // If it has children, toggle expansion (collapse siblings)
    if (hasChildren) {
      setExpandedH2Headings(prev => {
        const newSet = new Set<string>();
        if (!prev.has(headingId)) {
          newSet.add(headingId); // Only expand this one, collapsing all others
        }
        // If it was already expanded, leave newSet empty to collapse all
        return newSet;
      });
    }
  };

  const handleSectionClick = async (section: Section) => {
    const previousSection = selectedSection;
    setSelectedSection(section);

    if (previousSection && previousSection.id !== section.id) {
      setExpandedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(previousSection.id);
        return newSet;
      });
    }

    if (!allSectionHeadings.has(section.id)) {
      const headings = await getSectionHeadings(section.id);
      setAllSectionHeadings(prev => new Map(prev).set(section.id, headings));

      if (headings.length > 0) {
        setExpandedSections(prev => {
          const newSet = new Set(prev);
          newSet.add(section.id);
          return newSet;
        });
      }
    } else {
      const headings = allSectionHeadings.get(section.id) || [];
      if (headings.length > 0) {
        setExpandedSections(prev => new Set(prev).add(section.id));
      }
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
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-hover)' }}
          >
            <BookOpenIcon
              size={20}
              weight="duotone"
              style={{ color: 'var(--color-text-muted)' }}
            />
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
                onChange={e => setNewSectionTitle(e.target.value)}
                onKeyPress={e => {
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
                <FilePlusIcon size={20} weight="thin" />
              </button>
            </div>
          </div>

          {/* Sections list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {codex.sections && codex.sections.length > 0 ? (
              <div className="p-2 flex flex-col items-stretch">
                {codex.sections.map(section => {
                  const nestedHeadings =
                    allNestedHeadings.get(section.id) || [];
                  const isExpanded = expandedSections.has(section.id);
                  const hasHeadings = nestedHeadings.length > 0;

                  return (
                    <div
                      key={section.id}
                      className="mb-1 flex flex-col items-stretch"
                    >
                      <div
                        className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedSection?.id === section.id
                            ? 'bg-blue-50 dark:bg-gray-500/20 border border-blue-200 dark:border-gray-500/20'
                            : 'hover-bg'
                        }`}
                        onClick={() => handleSectionClick(section)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSectionClick(section);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select section ${section.title}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {hasHeadings && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleSectionExpansion(section.id);
                                }}
                                className="mt-0.5 text-gray-500 hover:text-blue-500"
                              >
                                {isExpanded ? (
                                  <CaretDownIcon size={12} weight="regular" />
                                ) : (
                                  <CaretRightIcon size={12} weight="regular" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleToggleComplete(section);
                              }}
                              className="mt-0.5 text-gray-500 hover:text-blue-500"
                            >
                              {section.isComplete ? (
                                <CheckSquareIcon size={16} weight="regular" />
                              ) : (
                                <SquareIcon size={16} weight="regular" />
                              )}
                            </button>
                            <span
                              className={`flex-1 ${
                                section.isComplete
                                  ? 'line-through text-gray-500'
                                  : ''
                              }`}
                            >
                              {section.title}
                            </span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                navigate(
                                  `/codex/${codex.id}/section/${section.id}/edit`
                                );
                              }}
                              className="p-1 rounded hover-bg"
                            >
                              <PencilSimpleIcon size={14} weight="regular" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setDeletingSection(section);
                              }}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600"
                            >
                              <TrashIcon size={14} weight="regular" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Nested headings hierarchy */}
                      {hasHeadings && isExpanded && (
                        <div className="ml-6 mt-1 flex flex-col">
                          {nestedHeadings.map(h2Heading => (
                            <div key={h2Heading.id} className="mb-1">
                              {/* H2 Heading */}
                              <div
                                className="p-2 rounded cursor-pointer hover-bg text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                                onClick={() =>
                                  handleH2Click(
                                    h2Heading.id,
                                    h2Heading.children.length > 0
                                  )
                                }
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleH2Click(
                                      h2Heading.id,
                                      h2Heading.children.length > 0
                                    );
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Toggle ${h2Heading.text} section`}
                              >
                                {h2Heading.children.length > 0 && (
                                  <div className="text-gray-500">
                                    {expandedH2Headings.has(h2Heading.id) ? (
                                      <CaretDownIcon
                                        size={10}
                                        weight="regular"
                                      />
                                    ) : (
                                      <CaretRightIcon
                                        size={10}
                                        weight="regular"
                                      />
                                    )}
                                  </div>
                                )}
                                <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0" />
                                <span className="font-medium">
                                  {h2Heading.text}
                                </span>
                              </div>

                              {/* H3 Children */}
                              {h2Heading.children.length > 0 &&
                                expandedH2Headings.has(h2Heading.id) && (
                                  <div className="ml-6 mt-1 flex flex-col space-y-0.5">
                                    {h2Heading.children.map(h3Heading => (
                                      <div
                                        key={h3Heading.id}
                                        className="p-2 rounded cursor-pointer hover-bg text-sm text-gray-500 dark:text-gray-500 flex items-center gap-2"
                                        onClick={() =>
                                          scrollToHeading(h3Heading.id)
                                        }
                                        onKeyDown={e => {
                                          if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                          ) {
                                            e.preventDefault();
                                            scrollToHeading(h3Heading.id);
                                          }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Navigate to ${h3Heading.text}`}
                                      >
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                                        <span>{h3Heading.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FileIcon
                  size={48}
                  weight="thin"
                  className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                />
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
                  <h2 className="text-xl font-semibold">
                    {selectedSection.title}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {isLoadingContent ? (
                  <LoadingSpinner size="md" />
                ) : sectionContent ? (
                  <div
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: md.render(sectionContent),
                    }}
                  />
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-12">
                    <FileIcon
                      size={64}
                      weight="thin"
                      className="mx-auto mb-4 text-gray-300 dark:text-gray-600"
                    />
                    <p className="mb-4">This section is empty</p>
                    <button
                      onClick={() =>
                        navigate(
                          `/codex/${codex.id}/section/${selectedSection.id}/edit`
                        )
                      }
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
                <FileIcon
                  size={64}
                  weight="thin"
                  className="mx-auto mb-4 text-gray-300 dark:text-gray-600"
                />
                <p>
                  {codex.sections && codex.sections.length > 0
                    ? 'Select a section to view'
                    : 'Create your first section'}
                </p>
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
