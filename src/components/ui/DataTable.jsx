import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DataTable({
  columns,
  data,
  isLoading,
  searchable = true,
  searchPlaceholder = "Search...",
  onSearch,
  searchValue,
  pagination,
  onRowClick,
  emptyMessage = "No data found"
}) {
  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            className="pl-10 bg-[#F7F9FA] border-0 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      )}
      
      <div className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-[0_6px_18px_rgba(15,23,36,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F7F9FA] hover:bg-[#F7F9FA]">
              {columns.map((column, idx) => (
                <TableHead 
                  key={idx} 
                  className={`font-semibold text-[#0F1724] ${column.className || ''}`}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, idx) => (
                    <TableCell key={idx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.length > 0 ? (
              data.map((row, rowIdx) => (
                <TableRow 
                  key={row.id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? "cursor-pointer hover:bg-emerald-50/50 transition-colors" : ""}
                >
                  {columns.map((column, colIdx) => (
                    <TableCell key={colIdx} className={column.cellClassName}>
                      {column.render ? column.render(row) : row[column.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {pagination.from} to {pagination.to} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onPrev}
              disabled={pagination.page === 1}
              className="border-gray-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-3">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onNext}
              disabled={pagination.page === pagination.totalPages}
              className="border-gray-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}