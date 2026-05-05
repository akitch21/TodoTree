import { useEffect } from "react";
import ReactFlow, {
  Background, Controls, MarkerType,
  useNodesState, useEdgesState,
  type Node, type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "@/components/dashboard/FlowTaskNode";
import { flattenTasks } from "@/lib/taskTree";
import type { Task } from "@/types";

const NW = 200; const NH = 64; const HG = 48; const VG = 80;
const PROJECT_ROOT_ID = "__project_root__";

function subtreeWidth(task: Task): number {
  if (task.children.length === 0) return NW;
  return Math.max(NW, task.children.reduce((s, c) => s + subtreeWidth(c) + HG, -HG));
}

function buildGraph(
  task: Task, depth: number, offsetX: number,
  nodes: Node[], edges: Edge[],
  posMap: Map<string, { x: number; y: number }>,
  onToggle: (id: string) => void,
  onSelect?: (task: Task) => void,
) {
  const sw = subtreeWidth(task);
  const x  = offsetX + sw / 2 - NW / 2;
  const y  = -depth * (NH + VG);
  nodes.push({ id: task.id, type: "taskNode", position: { x, y },
    data: { task, onToggle, onSelect } });
  posMap.set(task.id, { x: x + NW / 2, y });

  let childX = offsetX;
  for (const child of task.children) {
    edges.push({
      id: "e-" + task.id + "-" + child.id,
      source: task.id, target: child.id,
      sourceHandle: "top", targetHandle: "bottom",
      type: "smoothstep",
      style: { stroke: "var(--border)", strokeWidth: 1.5 },
    });
    buildGraph(child, depth + 1, childX, nodes, edges, posMap, onToggle, onSelect);
    childX += subtreeWidth(child) + HG;
  }
}

function addExtraDepEdges(
  tasks: Task[], edges: Edge[],
  posMap: Map<string, { x: number; y: number }>
) {
  for (const t of flattenTasks(tasks)) {
    if (!t.extraDependencies?.length) continue;
    for (const depId of t.extraDependencies) {
      const src = posMap.get(depId);
      const tgt = posMap.get(t.id);
      let sourceHandle: string | undefined;
      let targetHandle: string | undefined;
      if (src && tgt && Math.abs(src.y - tgt.y) <= 5) {
        if (src.x < tgt.x) { sourceHandle = "right-out"; targetHandle = "left-in"; }
        else                { sourceHandle = "left-out";  targetHandle = "right-in"; }
      }
      edges.push({
        id: "xdep-" + depId + "-" + t.id,
        source: depId, target: t.id, sourceHandle, targetHandle,
        type: "smoothstep",
        style: { stroke: "var(--primary)", strokeWidth: 1.5, strokeDasharray: "6 3" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--primary)" },
      });
    }
  }
}

interface TreeViewProps {
  tasks:         Task[];
  onToggle:      (id: string) => void;
  projectName?:  string;
  onSelectTask?: (task: Task) => void;
}

export function TreeView({ tasks, onToggle, projectName, onSelectTask }: TreeViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const posMap = new Map<string, { x: number; y: number }>();

    if (tasks.length === 0) { setNodes([]); setEdges([]); return; }

    const totalSpan = tasks.reduce((s, t) => s + subtreeWidth(t) + HG * 2, 0);

    if (projectName) {
      const px = totalSpan / 2 - NW / 2;
      newNodes.push({ id: PROJECT_ROOT_ID, type: "projectNode",
        position: { x: px, y: 0 }, data: { label: projectName } });
      posMap.set(PROJECT_ROOT_ID, { x: px + NW / 2, y: 0 });
    }

    const startDepth = projectName ? 1 : 0;
    let offsetX = 0;
    for (const root of tasks) {
      buildGraph(root, startDepth, offsetX, newNodes, newEdges, posMap, onToggle, onSelectTask);
      if (projectName) {
        newEdges.push({
          id: "e-proj-" + root.id,
          source: PROJECT_ROOT_ID, target: root.id,
          sourceHandle: "top", targetHandle: "bottom",
          type: "smoothstep",
          style: { stroke: "var(--primary)", strokeWidth: 2 },
        });
      }
      offsetX += subtreeWidth(root) + HG * 2;
    }

    addExtraDepEdges(tasks, newEdges, posMap);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [tasks, onToggle, onSelectTask, projectName, setNodes, setEdges]);

  return (
    <div style={{ position: "absolute", inset: 0 }} data-testid="tree-view">
      <ReactFlow nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={1.5}
        panOnDrag
        zoomOnPinch
        zoomOnScroll={false}
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls
          showInteractive={false}
          style={{ bottom: 8, left: 8 }}
        />
      </ReactFlow>
    </div>
  );
}
