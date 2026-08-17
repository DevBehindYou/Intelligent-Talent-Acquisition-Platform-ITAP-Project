import { useState } from "react";
import MatchDial from "../../../shared/components/MatchDial.jsx";
import StageTag, { PIPELINE_STAGES } from "../../../shared/components/StageTag.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import Button from "../../../shared/components/Button.jsx";
import Select from "../../../shared/components/Select.jsx";
import { SkeletonTable } from "../../../shared/components/Skeleton.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import { usePipelineViewModel } from "../hooks/usePipelineViewModel.js";

/**
 * Reproduces the "bulk_actions_stage_management" screen from the Stitch export: a dense,
 * selectable table (not a drag-and-drop kanban) with a sticky bulk-action bar that appears
 * once one or more rows are selected. Keyboard-accessible alternative to drag-and-drop,
 * per docs/05-ui-ux-design-system.md §11.
 */
export default function PipelineTable({ jobId }) {
  const { candidates, isLoading, selectedIds, toggleSelect, toggleSelectAll, bulkMoveStage, isMoving } =
    usePipelineViewModel(jobId);
  const [targetStage, setTargetStage] = useState("shortlisted");

  if (isLoading) return <SkeletonTable />;
  if (candidates.length === 0) {
    return <EmptyState icon="account_tree" title="No candidates in this pipeline yet" description="Rankings will appear here once resumes are scored." />;
  }

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-paper overflow-hidden">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-sm px-md py-sm bg-primary-fixed/20 hairline-b flex-wrap">
          <span className="text-body-sm text-on-surface font-medium">{selectedIds.length} selected</span>
          <div className="flex-1" />
          <Select
            options={PIPELINE_STAGES.map((s) => ({ value: s, label: s.replace("_", " ") }))}
            value={targetStage}
            onChange={(e) => setTargetStage(e.target.value)}
            className="!h-8"
          />
          <Button size="sm" isLoading={isMoving} onClick={() => bulkMoveStage(targetStage)}>
            Move to stage
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-12 gap-gutter px-md py-sm hairline-b bg-surface-container-low">
            <span className="col-span-1">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={selectedIds.length === candidates.length && candidates.length > 0}
                onChange={toggleSelectAll}
              />
            </span>
            <span className="col-span-2 font-label-caps text-label-caps text-on-surface-variant uppercase">Match</span>
            <span className="col-span-3 font-label-caps text-label-caps text-on-surface-variant uppercase">Candidate</span>
            <span className="col-span-2 font-label-caps text-label-caps text-on-surface-variant uppercase">Stage</span>
            <span className="col-span-4 font-label-caps text-label-caps text-on-surface-variant uppercase">AI Insight</span>
          </div>

          <div className="divide-y divide-outline-variant/20">
            {candidates.map((c) => {
              const id = c.candidateId || c._id;
              return (
                <div key={id} className="grid grid-cols-12 gap-gutter px-md py-md items-center hover:bg-surface transition-colors">
                  <div className="col-span-1">
                    <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelect(id)} aria-label={`Select ${c.fullName}`} />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <MatchDial score={c.overallScore} size="sm" />
                  </div>
                  <div className="col-span-3 flex flex-col justify-center">
                    <span className="text-body-md font-medium text-on-surface">{c.fullName}</span>
                    <span className="text-body-sm text-on-surface-variant">{c.currentTitle || "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <StageTag stage={c.stage} />
                  </div>
                  <div className="col-span-4 flex items-start ai-brass-bg p-sm rounded">
                    <Icon name="lightbulb" size={14} className="text-secondary mr-xs mt-[2px]" />
                    <span className="text-body-sm text-on-secondary-container leading-tight">{c.reasonSummary || "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
