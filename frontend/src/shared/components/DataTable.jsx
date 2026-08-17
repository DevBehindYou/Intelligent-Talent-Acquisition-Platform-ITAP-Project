import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { useState } from "react";
import Icon from "./Icon.jsx";
import { SkeletonTable } from "./Skeleton.jsx";
import EmptyState from "./EmptyState.jsx";
import { useUiStore } from "../store/uiStore.js";
import clsx from "clsx";

/**
 * Generic data table used across Candidates/Pipeline/Talent Search (docs/07 §2, "Table / DataGrid").
 * Density (comfortable/compact) is a shared UI preference, not per-table state — see uiStore.
 */
export default function DataTable({
  columns,
  data,
  isLoading,
  emptyState,
  onRowClick,
  selectedIds,
  onToggleSelect,
}) {
  const [sorting, setSorting] = useState([]);
  const density = useUiStore((s) => s.tableDensity);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) return <SkeletonTable />;
  if (!isLoading && data.length === 0) {
    return <EmptyState {...emptyState} />;
  }

  const rowHeight = density === "compact" ? "py-xs" : "py-sm";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="hairline-b">
              {onToggleSelect && <th className="w-10 px-md py-sm" />}
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="text-left px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase cursor-pointer select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: <Icon name="arrow_upward" size={12} />, desc: <Icon name="arrow_downward" size={12} /> }[
                      header.column.getIsSorted()
                    ] ?? null}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={clsx("hairline-b hover:bg-surface transition-colors group", onRowClick && "cursor-pointer")}
            >
              {onToggleSelect && (
                <td className={clsx("px-md", rowHeight)} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds?.includes(row.original._id)}
                    onChange={() => onToggleSelect(row.original._id)}
                    aria-label={`Select ${row.original.fullName || row.original.title || "row"}`}
                  />
                </td>
              )}
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={clsx("px-md", rowHeight)}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
