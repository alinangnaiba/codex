import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CreateCodexDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
  initialTitle?: string;
  initialDescription?: string;
  mode?: 'create' | 'edit';
}

export const CreateCodexDialog: React.FC<CreateCodexDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTitle = '',
  initialDescription = '',
  mode = 'create',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
  }, [initialTitle, initialDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { title?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(title.trim(), description.trim());
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slide-in transform transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'create' ? 'Create New Codex' : 'Edit Codex'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: undefined });
              }}
              className={`input w-full ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              placeholder="Enter codex title..."
              autoFocus
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <span className="text-xs">⚠</span> {errors.title}
              </p>
            )}
          </div>

          <div className="mb-8">
            <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full h-24 resize-none"
              placeholder="Enter a brief description..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
