"use client";

import type { GpsProposal } from "@/types/gps";

interface GpsProposalDiffProps {
  proposal: GpsProposal;
  onAccept: () => void;
  onReject: () => void;
}

export function GpsProposalDiff({ proposal, onAccept, onReject }: GpsProposalDiffProps) {
  const hasChanges =
    proposal.addNodes.length > 0 ||
    proposal.updateNodes.length > 0 ||
    proposal.removeNodeIds.length > 0 ||
    proposal.addEdges.length > 0 ||
    proposal.removeEdgeIds.length > 0;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h3 className="font-semibold text-sm">Agent Proposal</h3>

      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{proposal.message}</div>

      {hasChanges && (
        <div className="space-y-2 text-xs">
          {proposal.addNodes.length > 0 && (
            <div>
              <span className="font-medium text-green-600">+ Add nodes:</span>
              {proposal.addNodes.map((n) => (
                <div key={n.id} className="ml-3 text-muted-foreground">
                  {n.label} ({n.state})
                </div>
              ))}
            </div>
          )}
          {proposal.updateNodes.length > 0 && (
            <div>
              <span className="font-medium text-amber-600">~ Update nodes:</span>
              {proposal.updateNodes.map((u) => (
                <div key={u.id} className="ml-3 text-muted-foreground">
                  {u.id} → {JSON.stringify(u.patch)}
                </div>
              ))}
            </div>
          )}
          {proposal.removeNodeIds.length > 0 && (
            <div>
              <span className="font-medium text-red-600">- Remove nodes:</span>
              {proposal.removeNodeIds.map((id) => (
                <div key={id} className="ml-3 text-muted-foreground">
                  {id}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition"
        >
          Accept Changes
        </button>
        <button
          onClick={onReject}
          className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
