'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './workflow-node';
import { useWorkflowStore, type CanvasNode, type CanvasEdge } from '@/hooks/use-workflow-store';

export default function WorkflowCanvas() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNodeId,
    selectNode,
    moveNode,
    zoom,
    setZoom,
    openStepPicker,
  } = useWorkflowStore();

  // Convert store nodes to React Flow nodes
  const rfNodes: Node[] = useMemo(() => {
    return storeNodes.map((node: CanvasNode) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      selected: node.id === selectedNodeId,
      draggable: true,
    }));
  }, [storeNodes, selectedNodeId]);

  // Convert store edges to React Flow edges
  const rfEdges: Edge[] = useMemo(() => {
    return storeEdges.map((edge: CanvasEdge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated,
      style: { stroke: '#4b5563', strokeWidth: 2 },
    }));
  }, [storeEdges]);

  // Node changes (position, selection, etc.)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // Handle position changes
      for (const change of changes) {
        if (change.type === 'position' && change.position && change.id) {
          moveNode(change.id, change.position);
        }
      }
    },
    [moveNode]
  );

  // Edge changes
  const onEdgesChange: OnEdgesChange = useCallback(
    (_changes) => {
      // Edge changes handled by store
    },
    []
  );

  // Node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Pane click (deselect)
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Double click to add step
  const onPaneDoubleClick = useCallback(() => {
    openStepPicker(null);
  }, [openStepPicker]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDoubleClick={(_e, node) => selectNode(node.id)}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.25}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1f2937"
        />
        <Controls
          showInteractive={false}
          className="!bottom-6 !left-6"
        />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(n) => (n.type === 'trigger' ? '#C9A227' : '#4b5563')}
          maskColor="rgba(15, 15, 26, 0.7)"
          className="!bottom-6 !right-6"
        />
      </ReactFlow>
    </div>
  );
}
