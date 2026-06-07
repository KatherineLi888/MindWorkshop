"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import { CardNode } from "./CardNode";
import { CanvasModelPanelWidget } from "./CanvasModelPanelWidget";
import { CanvasTheoryPanelWidget } from "./CanvasTheoryPanelWidget";
import { EditPanel } from "./EditPanel";
import { LabeledEdge } from "./LabeledEdge";
import { PickModelDialog } from "./PickModelDialog";
import { PickTheoryDialog } from "./PickTheoryDialog";
import {
  createCanvasModelPanel,
  createCanvasTheoryPanel,
  createEmptyNode,
  type CanvasNodeData,
  type CanvasData,
  type EdgeLabelData,
} from "./types";

const edgeTypes = { labeled: LabeledEdge };

type Props = {
  data: CanvasData;
  onChange: (data: CanvasData) => void;
  active: boolean;
};

function MiniCanvas({ data, onChange, active }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickModelOpen, setPickModelOpen] = useState(false);
  const [pickTheoryOpen, setPickTheoryOpen] = useState(false);
  const rfRef = useRef<ReactFlowInstance | null>(null);
  const panels = data.modelPanels ?? [];
  const theoryPanels = data.theoryPanels ?? [];

  const update = useCallback(
    (patch: Partial<CanvasData>) => {
      onChange({
        ...data,
        ...patch,
        viewport: patch.viewport ?? rfRef.current?.getViewport() ?? data.viewport,
      });
    },
    [data, onChange]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      update({ nodes: applyNodeChanges(changes, data.nodes) });
    },
    [data.nodes, update]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      update({ edges: applyEdgeChanges(changes, data.edges) });
    },
    [data.edges, update]
  );

  const deleteNode = useCallback(
    (id: string) => {
      update({
        nodes: data.nodes.filter((n) => n.id !== id),
        edges: data.edges.filter((e) => e.source !== id && e.target !== id),
      });
      if (editingId === id) setEditingId(null);
    },
    [data.nodes, data.edges, editingId, update]
  );

  const nodeTypes = useMemo(
    () => ({
      card: (props: Parameters<typeof CardNode>[0]) => (
        <CardNode {...props} onEdit={setEditingId} onDelete={deleteNode} />
      ),
    }),
    [deleteNode]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const source = data.nodes.find((n) => n.id === connection.source);
      const color = source?.data.color ?? "#94a3b8";
      update({
        edges: addEdge(
          {
            ...connection,
            type: "labeled",
            data: { label: "" },
            style: { stroke: color },
            markerEnd: { type: MarkerType.ArrowClosed, color },
          },
          data.edges
        ),
      });
    },
    [data.nodes, data.edges, update]
  );

  const saveNode = (id: string, nodeData: CanvasNodeData) => {
    update({
      nodes: data.nodes.map((n) => (n.id === id ? { ...n, data: nodeData } : n)),
      edges: data.edges.map((e) => {
        if (e.source !== id) return e;
        return {
          ...e,
          style: { ...e.style, stroke: nodeData.color },
          markerEnd: { type: MarkerType.ArrowClosed, color: nodeData.color },
        };
      }),
    });
  };

  const editingNode = editingId
    ? data.nodes.find((n) => n.id === editingId)
    : null;

  const attachModel = (opts: {
    libraryModelId: string;
    corner: import("./types").CanvasModelPanelCorner;
    mode: import("./types").CanvasModelPanelMode;
  }) => {
    const panel = createCanvasModelPanel(
      opts.libraryModelId,
      opts.corner,
      opts.mode
    );
    update({ modelPanels: [...panels, panel] });
    setPickModelOpen(false);
  };

  const attachTheory = (opts: {
    theoryId: string;
    corner: import("./types").CanvasModelPanelCorner;
  }) => {
    const panel = createCanvasTheoryPanel(opts.theoryId, opts.corner);
    update({ theoryPanels: [...theoryPanels, panel] });
    setPickTheoryOpen(false);
  };

  const updatePanel = (id: string, next: import("./types").CanvasModelPanel) => {
    update({
      modelPanels: panels.map((p) => (p.id === id ? next : p)),
    });
  };

  const removePanel = (id: string) => {
    update({ modelPanels: panels.filter((p) => p.id !== id) });
  };

  const updateTheoryPanel = (
    id: string,
    next: import("./types").CanvasTheoryPanel
  ) => {
    update({
      theoryPanels: theoryPanels.map((p) => (p.id === id ? next : p)),
    });
  };

  const removeTheoryPanel = (id: string) => {
    update({ theoryPanels: theoryPanels.filter((p) => p.id !== id) });
  };

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={data.nodes}
        edges={data.edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(inst) => {
          rfRef.current = inst;
          if (data.viewport) inst.setViewport(data.viewport);
        }}
        onMoveEnd={() => update({ viewport: rfRef.current?.getViewport() })}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDoubleClick={(_, node) => setEditingId(node.id)}
        onEdgeContextMenu={(e, edge) => {
          e.preventDefault();
          if (confirm("删除此连线？")) {
            update({ edges: data.edges.filter((ed) => ed.id !== edge.id) });
          }
        }}
        deleteKeyCode={active ? ["Backspace", "Delete"] : null}
        panOnDrag
        zoomOnScroll
        minZoom={0.2}
        maxZoom={3}
        fitView={false}
        style={{ background: "#FFFFFF" }}
      />

      {panels.map((panel) => (
        <CanvasModelPanelWidget
          key={panel.id}
          panel={panel}
          onChange={(next) => updatePanel(panel.id, next)}
          onRemove={() => removePanel(panel.id)}
        />
      ))}

      {theoryPanels.map((panel) => (
        <CanvasTheoryPanelWidget
          key={panel.id}
          panel={panel}
          onChange={(next) => updateTheoryPanel(panel.id, next)}
          onRemove={() => removeTheoryPanel(panel.id)}
        />
      ))}

      {active && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          <button
            type="button"
            onClick={() => setPickModelOpen(true)}
            className="rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 text-xs font-medium text-slate-700 shadow-md hover:bg-slate-50"
          >
            + 挂载模型
          </button>
          <button
            type="button"
            onClick={() => setPickTheoryOpen(true)}
            className="rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-medium text-violet-700 shadow-md hover:bg-violet-100"
          >
            + 引用理论
          </button>
        </div>
      )}

      <PickModelDialog
        open={pickModelOpen}
        title="挂载思维模型"
        showCorner
        showMode
        onCancel={() => setPickModelOpen(false)}
        onConfirm={attachModel}
      />

      <PickTheoryDialog
        open={pickTheoryOpen}
        title="引用理论"
        showCorner
        onCancel={() => setPickTheoryOpen(false)}
        onConfirm={attachTheory}
      />

      {editingNode && (
        <EditPanel
          nodeId={editingNode.id}
          data={editingNode.data}
          onSave={saveNode}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

export function PaneCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <MiniCanvas {...props} />
    </ReactFlowProvider>
  );
}

export function addNodeToPane(data: CanvasData): CanvasData {
  return {
    ...data,
    nodes: [
      ...data.nodes,
      createEmptyNode({
        x: 80 + Math.random() * 120,
        y: 80 + Math.random() * 80,
      }),
    ],
  };
}
