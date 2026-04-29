"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

interface ReportDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  exportFileName?: string;
  className?: string;
}

export function ReportDataTable<T extends Record<string, any>>({
  columns,
  data,
  title,
  exportFileName = "report-data",
  className,
}: ReportDataTableProps<T>) {
  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = columns.map((col) => col.header).join(",");
    const rows = data.map((item) =>
      columns
        .map((col) => {
          const val = col.accessorKey.toString().split(".").reduce((obj, key) => obj?.[key], item);
          const stringVal = val === null || val === undefined ? "" : String(val);
          // Escape quotes and wrap in quotes if contains comma
          return `"${stringVal.replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${exportFileName}-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-4 print:hidden">
        {title ? <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</h3> : null}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={exportToCSV} disabled={data.length === 0}>
            <Download className="mr-2 size-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={handlePrint} disabled={data.length === 0}>
            <Printer className="mr-2 size-3.5" /> Print
          </Button>
        </div>
      </div>

      <div className="crm-table-shell print:overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, i) => (
                <TableHead key={i} className="text-xs font-bold uppercase text-muted-foreground">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No data available for this report.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className="text-sm">
                      {column.cell
                        ? column.cell(item)
                        : (column.accessorKey.toString().split(".").reduce((obj, key) => obj?.[key], item) as any) || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
