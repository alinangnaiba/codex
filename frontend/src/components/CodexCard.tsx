import React, { useState } from 'react';
import { Pin, Edit2, Trash2, Book } from 'lucide-react';
import { Codex, CodexProgress } from '../utils/api';

interface CodexCardProps {
  codex: Codex;
  progress?: CodexProgress;
  onOpen: (codex: Codex) => void;
  onEdit: (codex: Codex) => void;
  onDelete: (codex: Codex) => void;
  onTogglePin: (codex: Codex) => void;
}

export const CodexCard: React.FC<CodexCardProps> = ({
  codex,
  progress,
  onOpen,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="card card-hover p-6 cursor-pointer relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(codex)}
    >
      {/* Pin indicator */}
      {codex.isPinned && (
        <div className="absolute top-2 right-2 text-blue-500">
          <Pin className="w-4 h-4 fill-current" />
        </div>
      )}

      {/* Action buttons */}
      <div
        className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(codex);
          }}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          title={codex.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className={`w-4 h-4 ${codex.isPinned ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(codex);
          }}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(codex);
          }}
          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-3 mb-3">
          <Book className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <h3 className="font-semibold text-lg line-clamp-2">{codex.title}</h3>
        </div>
        
        {codex.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
            {codex.description}
          </p>
        )}

        {/* Progress bar */}
        {progress && progress.totalSections > 0 && (
          <div className="mt-auto">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress.progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {progress.completedSections} of {progress.totalSections} sections complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
