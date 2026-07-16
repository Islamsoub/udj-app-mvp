'use client';

import { useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Row,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmtNumber } from '@/lib/utils';

/**
 * DataTable — TanStack Table v8 wrapper with the prototype's SortHead
 * behavior: click toggles asc/desc; active column → jadeText label +
 * directional chevron; idle → sort icon. Rows hover to surface2; pagination
 * footer "N sur M" with prev/next.
 */
/**
 * Server-driven pagination. When provided, the table renders `data` as-is (one
 * server page — no client slicing) and the footer's prev/next call `onPageChange`
 * with the new 0-based page index. Omit it for client-side pagination.
 */
export interface ServerPagination {
  pageIndex: number;
  pageCount: number;
  total: number;
  onPageChange: (pageIndex: number) => void;
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  pageSize?: number;
  totalLabel?: (shown: number, total: number) => string;
  emptyState?: ReactNode;
  rowClassName?: (row: Row<TData>) => string | undefined;
  serverPagination?: ServerPagination;
}

export function DataTable<TData>({
  columns,
  data,
  onRowClick,
  pageSize = 20,
  totalLabel,
  emptyState,
  rowClassName,
  serverPagination,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const manual = serverPagination != null;

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Client pagination slices `data`; server pagination renders it verbatim.
    ...(manual
      ? { manualPagination: true }
      : { getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize } } }),
  });

  const rows = table.getRowModel().rows;
  const total = manual ? serverPagination.total : data.length;
  const pageIndex = manual ? serverPagination.pageIndex : table.getState().pagination.pageIndex;
  const pageCount = manual ? Math.max(1, serverPagination.pageCount) : Math.max(1, table.getPageCount());
  const shownFrom = total === 0 ? 0 : pageIndex * pageSize + 1;
  const shownTo = manual
    ? Math.min(pageIndex * pageSize + rows.length, total)
    : Math.min((pageIndex + 1) * pageSize, total);
  const canPrev = manual ? pageIndex > 0 : table.getCanPreviousPage();
  const canNext = manual ? pageIndex < pageCount - 1 : table.getCanNextPage();
  const goPrev = () => (manual ? serverPagination.onPageChange(pageIndex - 1) : table.previousPage());
  const goNext = () => (manual ? serverPagination.onPageChange(pageIndex + 1) : table.nextPage());

  return (
    <div>
      <table className="w-full border-collapse text-[13.5px]">
        <thead className="bg-surface2">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className={cn(
                      'whitespace-nowrap px-4 py-[10px] text-start font-mono text-[10.5px] font-medium uppercase tracking-[0.08em]',
                      sorted ? 'text-jade-text' : 'text-ink3',
                      canSort && 'cursor-pointer select-none'
                    )}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <span className="inline-flex items-center gap-[5px]">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort &&
                        (sorted === 'asc' ? (
                          <ChevronUp size={12} />
                        ) : sorted === 'desc' ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ArrowUpDown size={11} className="opacity-60" />
                        ))}
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{emptyState ?? (
                <div className="px-6 py-10 text-center text-[13.5px] text-ink3">Aucun résultat.</div>
              )}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(
                  'transition-colors hover:bg-surface2',
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row)
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="border-t border-hair px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-hair px-4 py-3">
        <div className="text-[12.5px] text-ink2">
          {totalLabel
            ? totalLabel(rows.length, total)
            : `${shownFrom}–${shownTo} sur ${fmtNumber(total)}`}
        </div>
        <div className="flex items-center gap-[6px]">
          <button
            type="button"
            disabled={!canPrev}
            onClick={goPrev}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border border-hair2 bg-surface text-ink2 transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Page précédente"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-mono text-[11.5px] text-ink3">
            {pageIndex + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={!canNext}
            onClick={goNext}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border border-hair2 bg-surface text-ink2 transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Page suivante"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
