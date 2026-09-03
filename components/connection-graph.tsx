'use client';

import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type GraphNode = {
  id: string;
  label: string;
  type: 'concern' | 'member' | 'bill' | 'committee' | 'target';
  sublabel?: string;
  x: number;
  y: number;
};

type GraphEdge = {
  from: string;
  to: string;
  label: string;
};

const nodeColors: Record<string, string> = {
  concern: '#bb4937',
  member: '#244e68',
  bill: '#4e875b',
  committee: '#7c5a9e',
  target: '#c7873f',
};

const nodeRadius: Record<string, number> = {
  concern: 40,
  member: 28,
  bill: 24,
  committee: 24,
  target: 30,
};

type Props = {
  concernId: string;
  concernTitle: string;
  open: boolean;
  onClose: () => void;
};

export function ConnectionGraph({ concernId, concernTitle, open, onClose }: Props) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!open) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setLoading(false); return; }

    void (async () => {
      setLoading(true);
      const [{ data: connData }, { data: billData }, { data: targetData }] = await Promise.all([
        supabase.from('concern_members').select('id, connection_type, detail, member:members(id, name, party, state, chamber)'),
        supabase.from('concern_bills').select('id, bill_title, bill_url, bill_provider'),
        supabase.from('concern_targets').select('id, target:targets(id, name, acronym, type)'),
      ]);

      const graphNodes: GraphNode[] = [];
      const graphEdges: GraphEdge[] = [];

      graphNodes.push({ id: 'concern-center', label: concernTitle, type: 'concern', x: 400, y: 300 });

      const members = (connData ?? []) as unknown as Array<{ id: string; connection_type: string; detail: string | null; member: { id: string; name: string; party: string; state: string; chamber: string } }>;
      const seenMembers = new Set<string>();
      for (const conn of members) {
        if (!conn.member || seenMembers.has(conn.member.id)) continue;
        seenMembers.add(conn.member.id);
        const angle = (graphNodes.filter(n => n.type === 'member').length) * 0.7 - Math.PI / 2;
        const radius = 180;
        graphNodes.push({
          id: `member-${conn.member.id}`,
          label: conn.member.name,
          type: 'member',
          sublabel: `${conn.member.party === 'democrat' ? 'D' : conn.member.party === 'republican' ? 'R' : 'I'} · ${conn.member.state}`,
          x: 400 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius,
        });
        graphEdges.push({ from: 'concern-center', to: `member-${conn.member.id}`, label: conn.connection_type });
      }

      const bills = (billData ?? []) as unknown as Array<{ id: string; bill_title: string; bill_url: string; bill_provider: string }>;
      for (const bill of bills) {
        const angle = (graphNodes.filter(n => n.type === 'bill').length) * 0.8 + Math.PI / 4;
        const radius = 200;
        graphNodes.push({
          id: `bill-${bill.id}`,
          label: bill.bill_title.slice(0, 50),
          type: 'bill',
          x: 400 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius,
        });
        graphEdges.push({ from: 'concern-center', to: `bill-${bill.id}`, label: 'linked bill' });
      }

      const targets = (targetData ?? []) as unknown as Array<{ id: string; target: { id: string; name: string; acronym: string | null; type: string | null } }>;
      for (const t of targets) {
        if (!t.target) continue;
        const angle = Math.PI / 2 + (graphNodes.filter(n => n.type === 'target').length) * 0.5;
        const radius = 160;
        graphNodes.push({
          id: `target-${t.target.id}`,
          label: t.target.name,
          type: 'target',
          sublabel: t.target.acronym ?? undefined,
          x: 400 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius,
        });
        graphEdges.push({ from: 'concern-center', to: `target-${t.target.id}`, label: 'accountable target' });
      }

      setNodes(graphNodes);
      setEdges(graphEdges);
      setLoading(false);
    })();
  }, [open, concernId, concernTitle]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4">
          <div>
            <p className="eyebrow text-[#bb4937]">Relational graph</p>
            <h2 className="mt-1 font-display text-2xl">{concernTitle}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition hover:bg-[#f4f6f8]"><X className="h-5 w-5 text-[#52636f]" /></button>
        </div>

        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-sm text-[#7b8992]">Loading connections...</p>
          </div>
        ) : nodes.length <= 1 ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-sm text-[#7b8992]">No connections mapped yet for this petition.</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto rounded-xl bg-[#f8f9fb] p-4">
              <svg ref={svgRef} viewBox="0 0 800 600" className="h-[500px] w-full">
                {edges.map((edge, i) => {
                  const from = nodes.find(n => n.id === edge.from);
                  const to = nodes.find(n => n.id === edge.to);
                  if (!from || !to) return null;
                  const mx = (from.x + to.x) / 2;
                  const my = (from.y + to.y) / 2;
                  return (
                    <g key={`edge-${i}`}>
                      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#cfd8de" strokeWidth="1.5" />
                      <text x={mx} y={my} textAnchor="middle" className="fill-[#82909a]" style={{ fontSize: '9px', fontWeight: 600 }}>{edge.label}</text>
                    </g>
                  );
                })}
                {nodes.map((node) => {
                  const r = nodeRadius[node.type] ?? 24;
                  const color = nodeColors[node.type] ?? '#52636f';
                  return (
                    <g key={node.id}>
                      <circle cx={node.x} cy={node.y} r={r} fill={color} fillOpacity={0.12} stroke={color} strokeWidth="2" />
                      <text x={node.x} y={node.y - 2} textAnchor="middle" style={{ fontSize: node.type === 'concern' ? '13px' : '11px', fontWeight: 700, fill: '#17202a' }}>
                        {node.label.length > 30 ? node.label.slice(0, 28) + '...' : node.label}
                      </text>
                      {node.sublabel && (
                        <text x={node.x} y={node.y + 12} textAnchor="middle" style={{ fontSize: '9px', fontWeight: 600, fill: '#7b8992' }}>{node.sublabel}</text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              {Object.entries(nodeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-semibold capitalize text-[#52636f]">{type}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
