'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface Column {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  position: number;
  isRequired: boolean;
}

interface Row {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
}

interface TableInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const COLUMN_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'boolean', label: 'Checkbox', icon: '☑️' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'select', label: 'Select', icon: '🔽' },
  { value: 'multiselect', label: 'Multi-select', icon: '🔽🔽' },
];

export default function TableDetailPage() {
  const params = useParams();
  const tableId = params?.tableId as string;

  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('text');

  const load = useCallback(async () => {
    try {
      const [tableRes, colsRes, rowsRes] = await Promise.all([
        fetch(`/api/tables/${tableId}`),
        fetch(`/api/tables/${tableId}/columns`),
        fetch(`/api/tables/${tableId}/rows`),
      ]);
      const [tableData, colsData, rowsData] = await Promise.all([
        tableRes.json(), colsRes.json(), rowsRes.json(),
      ]);
      setTableInfo(tableData.table);
      setColumns(colsData.columns ?? []);
      setRows(rowsData.rows ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [tableId]);

  useEffect(() => { load(); }, [load]);

  const addRow = async () => {
    const emptyData: Record<string, unknown> = {};
    columns.forEach(col => { emptyData[col.id] = ''; });
    const res = await fetch(`/api/tables/${tableId}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: emptyData }),
    });
    const data = await res.json();
    setRows(prev => [...prev, data.row]);
  };

  const saveCell = async (rowId: string) => {
    if (!editingCell) return;
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const newData = { ...row.data, [editingCell.colId]: cellValue };
    await fetch(`/api/tables/${tableId}/rows/${rowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: newData }),
    });
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, data: newData } : r));
    setEditingCell(null);
  };

  const deleteRow = async (rowId: string) => {
    await fetch(`/api/tables/${tableId}/rows/${rowId}`, { method: 'DELETE' });
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  const addColumn = async () => {
    if (!newColName.trim()) return;
    const res = await fetch(`/api/tables/${tableId}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newColName, type: newColType, position: columns.length }),
    });
    const data = await res.json();
    setColumns(prev => [...prev, data.column]);
    setShowAddColumn(false);
    setNewColName('');
    setNewColType('text');
  };

  const renderCell = (row: Row, col: Column) => {
    const value = row.data[col.id] ?? '';
    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;

    if (isEditing) {
      if (col.type === 'boolean') {
        return (
          <input
            type="checkbox"
            checked={!!cellValue}
            onChange={e => setCellValue(String(e.target.checked))}
            onBlur={() => saveCell(row.id)}
            className="w-4 h-4"
            autoFocus
          />
        );
      }
      return (
        <input
          type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : col.type === 'email' ? 'email' : 'text'}
          value={cellValue}
          onChange={e => setCellValue(e.target.value)}
          onBlur={() => saveCell(row.id)}
          onKeyDown={e => { if (e.key === 'Enter') saveCell(row.id); if (e.key === 'Escape') setEditingCell(null); }}
          className="w-full bg-[#1a2a3a] text-white text-sm px-2 py-1 outline-none border border-[#C9A227] rounded"
          autoFocus
        />
      );
    }

    return (
      <span
        className="cursor-text text-sm text-gray-300 block truncate"
        onClick={() => {
          setEditingCell({ rowId: row.id, colId: col.id });
          setCellValue(String(value));
        }}
      >
        {col.type === 'boolean' ? (value ? '✓' : '○') : String(value || '')}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
        <span className="text-2xl">{tableInfo?.icon}</span>
        <h1 className="text-xl font-bold text-white">{tableInfo?.name}</h1>
        <span className="text-gray-500 text-sm">{rows.length} rows</span>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-2 border-b border-gray-800 flex items-center gap-3">
        <button
          onClick={addRow}
          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          + Add Row
        </button>
        <button
          onClick={() => setShowAddColumn(true)}
          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          + Add Column
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#0f0f1a] z-10">
            <tr>
              <th className="w-10 border-r border-b border-gray-800 px-2 py-2 text-gray-500 text-xs">#</th>
              {columns.map(col => (
                <th key={col.id} className="min-w-[160px] border-r border-b border-gray-800 px-3 py-2">
                  <span className="text-gray-400 text-xs font-medium">{col.name}</span>
                  <span className="ml-1 text-gray-600 text-xs">{COLUMN_TYPES.find(t => t.value === col.type)?.icon}</span>
                </th>
              ))}
              <th className="w-8 border-b border-gray-800" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="hover:bg-gray-900/50 group">
                <td className="border-r border-b border-gray-800 px-2 py-1.5 text-gray-600 text-xs text-center">{i + 1}</td>
                {columns.map(col => (
                  <td key={col.id} className="border-r border-b border-gray-800 px-3 py-1.5 min-h-[36px]">
                    {renderCell(row, col)}
                  </td>
                ))}
                <td className="border-b border-gray-800 px-1 py-1">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={columns.length + 2} className="border-b border-gray-800">
                <button
                  onClick={addRow}
                  className="w-full text-left px-4 py-2 text-gray-600 hover:text-gray-400 text-sm hover:bg-gray-900/30 transition-colors"
                >
                  + Add row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add Column Modal */}
      {showAddColumn && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0C2340] border border-gray-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold mb-4">Add Column</h2>
            <input
              type="text"
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              placeholder="Column name"
              autoFocus
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] mb-3"
            />
            <select
              value={newColType}
              onChange={e => setNewColType(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] mb-4"
            >
              {COLUMN_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAddColumn(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
              <button
                onClick={addColumn}
                className="px-4 py-2 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
