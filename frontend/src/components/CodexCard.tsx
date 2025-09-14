import React, { useState } from 'react';
import {
  PushPinIcon,
  PencilSimpleIcon,
  TrashIcon,
  BookIcon,
} from '@phosphor-icons/react';
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
      className="card card-hover p-5 cursor-pointer relative group h-48 w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(codex)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(codex);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open codex ${codex.title}`}
    >
      {/* Pin indicator */}
      {codex.isPinned && !isHovered && (
        <div className="absolute top-3 right-3">
          <PushPinIcon
            size={16}
            weight="fill"
            className="text-gray-400 dark:text-gray-500"
          />
        </div>
      )}

      {/* Action buttons */}
      <div
        className={`absolute top-2 right-2 flex gap-0.5 rounded-md border transition-opacity duration-150 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete(codex);
          }}
          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-150 rounded-r-md"
          title="Delete"
        >
          <TrashIcon size={16} weight="regular" className="text-red-500" />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onEdit(codex);
          }}
          className="p-1.5 hover-bg border-x border-gray-200 dark:border-gray-700"
          title="Edit"
        >
          <PencilSimpleIcon
            size={16}
            weight="regular"
            className="text-gray-500 dark:text-gray-200"
          />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onTogglePin(codex);
          }}
          className="p-1.5 hover-bg rounded-l-md"
          title={codex.isPinned ? 'Unpin' : 'Pin'}
        >
          <PushPinIcon
            size={16}
            weight={codex.isPinned ? 'fill' : 'regular'}
            className={
              codex.isPinned
                ? 'text-accent'
                : 'text-gray-500 dark:text-gray-200'
            }
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-3 mb-3">
          <BookIcon
            size={20}
            weight="duotone"
            className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0"
          />
          <h3
            className="font-medium text-base line-clamp-2"
            style={{ color: 'var(--color-text)' }}
          >
            {codex.title}
          </h3>
        </div>

        {codex.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
            {codex.description}
          </p>
        )}

        {/* Progress bar */}
        {progress && progress.totalSections > 0 && (
          <div
            className="mt-auto pt-3 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>Progress</span>
              <span>{Math.round(progress.progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${progress.progressPercent}%`,
                  backgroundColor: 'var(--color-primary)',
                }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {progress.completedSections} of {progress.totalSections} sections
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
