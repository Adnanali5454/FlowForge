'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Connection,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

const NOTE_COLORS = ['#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#ede9fe'];

function StickyNote({ data }: { data: { text: string; color: string; onChange: (text: string) => void } }) {
  return (
    <div style={{ backgroundColor: data.color }} className="w-48 min-h-24 rounded-xl p-3 shadow-lg">
      <textarea
        value={data.text}
        onChange={e => data.onChange(e.target.value)}
        className="w-full h-full bg-transparent text-gray-800 text-sm resize-none outline-none"
        placeholder="Write a note..."
      />
    </div>
  );
}

const nodeTypes = { sticky: StickyNote };

export default function CanvasEditorPage() {
  const params = useParams();
  const canvasId = params?.canvasId as string;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/canvases/${canvasId}`).then(r => r.json()).then(d => {
      if (d.canvas) {
        setCanvasName(d.canvas.name);
        const data = d.canvas.data as { nodes: Node[]; edges: typeof edges };
        if (data.nodes) setNodes(data.nodes);
        if (data.edges) setEdges(data.edges);
      }
    });
  }, [canvasId, setNodes, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge(connection, eds));
  }, [setEdges]);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/canvases/${canvasId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { nodes, edges } }),
      });
    } finally {
      setIsSaving(false);
    }
  }, [canvasId, nodes, edges]);

  const addStickyNote = () => {
    const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const id = `note_${Date.now()}`;
    setNodes(prev => [...prev, {
      id,
      type: 'sticky',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        text: '',
        color,
        onChange: (text: string) => {
          setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, text } } : n));
        },
      },
    }]);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-14 border-b border-gray-800 flex items-center px-4 gap-3">
        <input
          value={canvasName}
          onChange={e => setCanvasName(e.target.value)}
          className="text-white font-semibold bg-transparent border-none outline-none"
        />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={addStickyNote} className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg">+ Sticky Note</button>
          <button onClick={save} disabled={isSaving} className="px-4 py-1.5 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f2937" />
          <Controls className="!bottom-6 !left-6" />
          <MiniMap className="!bottom-6 !right-6" maskColor="rgba(15,15,26,0.7)" />
        </ReactFlow>
      </div>
    </div>
  );
}
