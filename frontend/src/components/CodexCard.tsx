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
      className="card card-hover p-6 cursor-pointer relative group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(codex)}
    >
      {/* Pin indicator */}
      {codex.isPinned && !isHovered && (
        <div className="absolute top-3 right-3 p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
          <Pin className="w-3.5 h-3.5 text-white fill-current" />
        </div>
      )}

      {/* Action buttons */}
      <div
        className={`absolute top-2 right-2 flex gap-1 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-lg p-1 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(codex);
          }}
          className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all duration-200 hover:scale-110"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(codex);
          }}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          title="Edit"
        >
          <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(codex);
          }}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          title={codex.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className={`w-4 h-4 ${codex.isPinned ? 'fill-current text-blue-500' : 'text-gray-600 dark:text-gray-400'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
            <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-lg line-clamp-2 text-gray-900 dark:text-gray-100">{codex.title}</h3>
        </div>
        
        {codex.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">
            {codex.description}
          </p>
        )}

        {/* Progress bar */}
        {progress && progress.totalSections > 0 && (
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              <span className="uppercase tracking-wider">Progress</span>
              <span className="font-semibold">{Math.round(progress.progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              {progress.completedSections} of {progress.totalSections} sections complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
