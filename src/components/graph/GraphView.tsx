"use client";

import { useEffect, useRef } from "react";
import cytoscape, { type Core } from "cytoscape";
import type { GraphNodeRow } from "@/types/database";

const STATUS_COLOR: Record<string, string> = {
  tracking: "#10B981",
  paused: "#F59E0B",
  abandoned: "#9CA3AF",
  ongoing: "#3B82F6",
};

type Edge = { id: string; source_id: string; target_id: string; label: string };

type Props = {
  nodes: GraphNodeRow[];
  edges: Edge[];
  onSelect: (node: GraphNodeRow) => void;
};

export function GraphView({ nodes, edges, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const cy = cytoscape({
      container: ref.current,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": 10,
            "background-color": "data(color)",
            width: 56,
            height: 56,
            color: "#1E293B",
            "text-wrap": "wrap",
            "text-max-width": 50,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#E2E8F0",
            "target-arrow-color": "#94a3b8",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": 8,
          },
        },
        { selector: ".ongoing", style: { "border-width": 3, "border-color": "#3B82F6" } },
      ],
      layout: { name: "cose", animate: false },
      wheelSensitivity: 0.3,
    });

    cy.on("tap", "node", (evt) => {
      const id = evt.target.id();
      const node = nodes.find((n) => n.id === id);
      if (node) onSelect(node);
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
    };
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().remove();
    nodes.forEach((n) => {
      cy.add({
        group: "nodes",
        data: {
          id: n.id,
          label: n.title.slice(0, 8),
          color: STATUS_COLOR[n.status] ?? "#94a3b8",
        },
        position: { x: n.position_x, y: n.position_y },
        classes: n.status === "ongoing" ? "ongoing" : "",
      });
    });
    edges.forEach((e) => {
      cy.add({
        group: "edges",
        data: {
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          label: e.label || "",
        },
      });
    });
    cy.layout({ name: "cose", animate: false }).run();
  }, [nodes, edges]);

  return (
    <div
      ref={ref}
      className="h-[min(70vh,520px)] w-full touch-pan-y rounded-xl border border-[#E2E8F0] bg-white"
    />
  );
}
