import React, { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div
        className="rounded-lg shadow-xl w-full max-w-md mx-4 border"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2
            className="text-lg font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            {mode === 'create' ? 'Create New Codex' : 'Edit Codex'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-150"
          >
            <X
              size={20}
              weight="regular"
              style={{ color: 'var(--color-text-muted)' }}
            />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: undefined });
              }}
              className={`input w-full ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter codex title..."
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1.5">{errors.title}</p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
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
            <button type="submit" className="btn-primary">
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
