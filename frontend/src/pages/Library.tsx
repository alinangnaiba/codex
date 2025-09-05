import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Pin } from 'lucide-react';
import toast from 'react-hot-toast';
import { CodexCard } from '../components/CodexCard';
import { CreateCodexDialog } from '../components/CreateCodexDialog';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { codexAPI, Codex, CodexProgress } from '../utils/api';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const [codexes, setCodexes] = useState<Codex[]>([]);
  const [progressMap, setProgressMap] = useState<Map<number, CodexProgress>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCodex, setEditingCodex] = useState<Codex | null>(null);
  const [deletingCodex, setDeletingCodex] = useState<Codex | null>(null);

  useEffect(() => {
    loadCodexes();
  }, []);

  const loadCodexes = async () => {
    try {
      setIsLoading(true);
      const allCodexes = await codexAPI.getAll();
      // Ensure we have an array even if the backend returns null/undefined
      const codexList = Array.isArray(allCodexes) ? allCodexes : [];
      setCodexes(codexList);

      // Load progress for each codex
      const progressData = new Map<number, CodexProgress>();
      for (const codex of codexList) {
        try {
          const progress = await codexAPI.getProgress(codex.id);
          progressData.set(codex.id, progress);
        } catch (error) {
          console.error(`Failed to load progress for codex ${codex.id}:`, error);
        }
      }
      setProgressMap(progressData);
    } catch (error) {
      console.error('Failed to load codexes:', error);
      toast.error('Failed to load codexes');
      setCodexes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      const results = await codexAPI.search(query);
      // Ensure we have an array even if the backend returns null/undefined
      const searchResults = Array.isArray(results) ? results : [];
      setCodexes(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      // On search error, just keep the current list
    }
  };

  const handleCreateCodex = async (title: string, description: string) => {
    try {
      const newCodex = await codexAPI.create(title, description);
      await loadCodexes();
      setIsCreateDialogOpen(false);
      toast.success('Codex created successfully!');
      navigate(`/codex/${newCodex.id}`);
    } catch (error) {
      console.error('Failed to create codex:', error);
      toast.error('Failed to create codex');
    }
  };

  const handleUpdateCodex = async (title: string, description: string) => {
    if (!editingCodex) return;

    try {
      await codexAPI.update(editingCodex.id, title, description);
      await loadCodexes();
      setEditingCodex(null);
      toast.success('Codex updated successfully!');
    } catch (error) {
      console.error('Failed to update codex:', error);
      toast.error('Failed to update codex');
    }
  };

  const handleDeleteCodex = async () => {
    if (!deletingCodex) return;
    
    try {
      await codexAPI.delete(deletingCodex.id);
      await loadCodexes();
      toast.success('Codex deleted successfully');
      setDeletingCodex(null);
    } catch (error) {
      console.error('Failed to delete codex:', error);
      toast.error('Failed to delete codex');
      setDeletingCodex(null);
    }
  };

  const handleTogglePin = async (codex: Codex) => {
    try {
      await codexAPI.pin(codex.id, !codex.isPinned);
      await loadCodexes();
      toast.success(codex.isPinned ? 'Codex unpinned' : 'Codex pinned');
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toast.error('Failed to update pin status');
    }
  };

  const handleOpenCodex = (codex: Codex) => {
    navigate(`/codex/${codex.id}`);
  };

  // Separate pinned and unpinned codexes
  const { pinnedCodexes, unpinnedCodexes } = useMemo(() => {
    const pinned = codexes.filter(c => c.isPinned);
    const unpinned = codexes.filter(c => !c.isPinned);
    return { pinnedCodexes: pinned, unpinnedCodexes: unpinned };
  }, [codexes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">My Library</h1>
          </div>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Codex
          </button>
        </div>
        
        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search codexes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {codexes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <BookOpen className="w-16 h-16 mb-4" />
            <p className="text-lg mb-2">No codexes yet</p>
            <p className="text-sm">Create your first codex to get started</p>
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {pinnedCodexes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Pin className="w-4 h-4" />
                  Pinned
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedCodexes.map(codex => (
                    <CodexCard
                      key={codex.id}
                      codex={codex}
                      progress={progressMap.get(codex.id)}
                      onOpen={handleOpenCodex}
                      onEdit={setEditingCodex}
                      onDelete={setDeletingCodex}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All codexes */}
            {unpinnedCodexes.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  {pinnedCodexes.length > 0 ? 'All Codexes' : 'My Codexes'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {unpinnedCodexes.map(codex => (
                    <CodexCard
                      key={codex.id}
                      codex={codex}
                      progress={progressMap.get(codex.id)}
                      onOpen={handleOpenCodex}
                      onEdit={setEditingCodex}
                      onDelete={setDeletingCodex}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      {(isCreateDialogOpen || editingCodex) && (
        <CreateCodexDialog
          isOpen={true}
          onClose={() => {
            setIsCreateDialogOpen(false);
            setEditingCodex(null);
          }}
          onSubmit={editingCodex ? handleUpdateCodex : handleCreateCodex}
          initialTitle={editingCodex?.title || ''}
          initialDescription={editingCodex?.description || ''}
          mode={editingCodex ? 'edit' : 'create'}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {deletingCodex && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeletingCodex(null)}
          onConfirm={handleDeleteCodex}
          title="Delete Codex"
          message={`Are you sure you want to delete "${deletingCodex.title}"? This will permanently delete all sections and content. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </div>
  );
};
