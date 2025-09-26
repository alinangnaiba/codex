import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import {
  CaretRightIcon,
  BookOpenIcon,
  PencilSimpleIcon,
  BooksIcon,
} from '@phosphor-icons/react';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  codexTitle?: string;
  sectionTitle?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  codexTitle,
  sectionTitle,
}) => {
  const location = useLocation();
  const { id, codexId, sectionId } = useParams();
  const currentCodexId = codexId || id;

  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: 'My Library',
        path: '/',
        icon: <BooksIcon size={16} weight="duotone" />,
      },
    ];

    if (location.pathname === '/settings') {
      items.push({
        label: 'Settings',
        path: '/settings',
      });
    } else if (currentCodexId) {
      items.push({
        label: codexTitle || 'Codex',
        path: `/codex/${currentCodexId}`,
        icon: <BookOpenIcon size={16} weight="duotone" />,
      });

      if (sectionId) {
        items.push({
          label: sectionTitle || 'Edit Section',
          path: `/codex/${currentCodexId}/section/${sectionId}/edit`,
          icon: <PencilSimpleIcon size={16} weight="duotone" />,
        });
      }
    }

    return items;
  };

  const items = getBreadcrumbItems();

  if (items.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={item.path}>
            {index > 0 && (
              <CaretRightIcon
                size={16}
                className="text-gray-400 dark:text-gray-500 mx-1"
              />
            )}
            {isLast ? (
              <span className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100 font-medium">
                {item.icon}
                <span className="truncate max-w-[200px]">{item.label}</span>
              </span>
            ) : (
              <Link
                to={item.path}
                className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 hover:underline"
              >
                {item.icon}
                <span className="truncate max-w-[150px]">{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
