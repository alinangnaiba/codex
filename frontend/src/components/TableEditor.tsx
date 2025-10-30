import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import {
  PlusIcon,
  MinusIcon,
  X,
  CheckIcon,
} from '@phosphor-icons/react';

interface TableData {
  [key: string]: string;
}

interface TableEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (markdown: string) => void;
  initialMarkdown?: string;
}

export const TableEditor: React.FC<TableEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMarkdown = '',
}) => {
  const [data, setData] = useState<TableData[]>([]);
  const [columns, setColumns] = useState<string[]>(['Column 1', 'Column 2']);
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);

  useEffect(() => {
    if (initialMarkdown && isOpen) {
      parseMarkdownTable(initialMarkdown);
    } else if (isOpen && !initialMarkdown) {
      setColumns(['Column 1', 'Column 2', 'Column 3']);
      setData([
        { 'Column 1': '', 'Column 2': '', 'Column 3': '' },
        { 'Column 1': '', 'Column 2': '', 'Column 3': '' },
        { 'Column 1': '', 'Column 2': '', 'Column 3': '' },
      ]);
    }
  }, [isOpen, initialMarkdown]);

  const parseMarkdownTable = (markdown: string) => {
    const lines = markdown.trim().split('\n');
    if (lines.length < 3) return; // Need at least header, separator, and one data row

    const headerLine = lines[0].trim();
    const headers = headerLine
      .split('|')
      .map(h => h.trim())
      .filter(h => h !== '');

    setColumns(headers);

    const dataRows: TableData[] = [];
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const cells = line
          .split('|')
          .map(c => c.trim())
          .filter((_, index, arr) => index > 0 && index < arr.length - 1); // Remove empty first/last

        const rowData: TableData = {};
        headers.forEach((header, index) => {
          rowData[header] = cells[index] || '';
        });
        dataRows.push(rowData);
      }
    }

    setData(dataRows);
  };

  const generateMarkdownTable = (): string => {
    if (columns.length === 0 || data.length === 0) return '';

    const header = `| ${columns.join(' | ')} |`;
    const separator = `| ${columns.map(() => '---').join(' | ')} |`;
    const rows = data.map(row => {
      const cells = columns.map(col => row[col] || '');
      return `| ${cells.join(' | ')} |`;
    });

    return [header, separator, ...rows].join('\n');
  };

  const updateColumnName = useCallback((oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return;

    setColumns(prev => prev.map(col => col === oldName ? newName.trim() : col));
    setData(prev => prev.map(row => {
      const newRow = { ...row };
      if (newRow[oldName] !== undefined) {
        newRow[newName.trim()] = newRow[oldName];
        delete newRow[oldName];
      }
      return newRow;
    }));
  }, []);

  const updateCell = useCallback((rowIndex: number, columnId: string, value: string) => {
    setData(prev => prev.map((row, index) =>
      index === rowIndex ? { ...row, [columnId]: value } : row
    ));
  }, []);

  const removeColumn = useCallback((columnName: string) => {
    if (columns.length <= 1) return;

    setColumns(prev => prev.filter(col => col !== columnName));
    setData(prev => prev.map(row => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    }));
  }, [columns.length]);

  const columnHelper = useMemo(() => createColumnHelper<TableData>(), []);

  const tableColumns = useMemo<ColumnDef<TableData, string>[]>(() => {
    return columns.map((colName) =>
      columnHelper.accessor(colName, {
        header: () => (
          <div className="flex items-center justify-between group">
            <EditableHeader
              value={colName}
              onChange={(newName) => updateColumnName(colName, newName)}
            />
            <button
              onClick={() => removeColumn(colName)}
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-red-500 hover:text-red-700 transition-opacity"
              title="Remove column"
            >
              <MinusIcon size={14} />
            </button>
          </div>
        ),
        cell: ({ row, column }) => (
          <EditableCell
            value={row.original[colName] || ''}
            onChange={(value) => updateCell(row.index, colName, value)}
            isEditing={
              editingCell?.rowIndex === row.index &&
              editingCell?.columnId === column.id
            }
            onEdit={() => setEditingCell({ rowIndex: row.index, columnId: column.id })}
            onStopEdit={() => setEditingCell(null)}
          />
        ),
      })
    );
  }, [columns, editingCell, removeColumn, updateColumnName, updateCell, columnHelper]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const addColumn = () => {
    const newColumnName = `Column ${columns.length + 1}`;
    setColumns(prev => [...prev, newColumnName]);
    setData(prev => prev.map(row => ({ ...row, [newColumnName]: '' })));
  };

  const addRow = () => {
    const newRow: TableData = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    setData(prev => [...prev, newRow]);
  };

  const removeRow = (index: number) => {
    if (data.length <= 1) return;
    setData(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const markdown = generateMarkdownTable();
    onSave(markdown);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Table Editor
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={addColumn}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
          >
            <PlusIcon size={16} />
            Add Column
          </button>
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
          >
            <PlusIcon size={16} />
            Add Row
          </button>
          <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
            {data.length} rows × {columns.length} columns
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                    <th className="w-12 px-2 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-2 py-3 text-center">
                      <button
                        onClick={() => removeRow(row.index)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Remove row"
                      >
                        <MinusIcon size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Click any cell to edit. Use Tab to move between cells.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              <CheckIcon size={16} />
              Insert Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Editable Header Component
interface EditableHeaderProps {
  value: string;
  onChange: (value: string) => void;
}

const EditableHeader: React.FC<EditableHeaderProps> = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-blue-500 rounded focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-left hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors"
    >
      {value}
    </button>
  );
};

// Editable Cell Component
interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  onStopEdit: () => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onChange,
  isEditing,
  onEdit,
  onStopEdit,
}) => {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(tempValue);
    onStopEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setTempValue(value);
      onStopEdit();
    } else if (e.key === 'Tab') {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <textarea
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-blue-500 rounded focus:outline-none resize-none"
        rows={1}
      />
    );
  }

  return (
    <div
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onEdit();
        }
      }}
      role="button"
      tabIndex={0}
      className="min-h-[2rem] px-2 py-1 cursor-text hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded transition-colors"
    >
      {value || (
        <span className="text-gray-400 dark:text-gray-600 italic">
          Click to edit
        </span>
      )}
    </div>
  );
};