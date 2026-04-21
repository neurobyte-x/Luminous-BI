import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';

type DataRow = Record<string, unknown>;

type SortConfig = {
  column: string;
  direction: 'asc' | 'desc';
} | null;

interface DataTableViewProps {
  data: DataRow[];
}

export function DataTableView({ data }: DataTableViewProps) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const columns = useMemo(() => Object.keys(data[0]), [data]);

  const filteredAndSortedData = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    const filtered = normalizedQuery
      ? data.filter((row) =>
          columns.some((column) => {
            const value = row[column];
            if (value === null || value === undefined) {
              return false;
            }
            return String(value).toLowerCase().includes(normalizedQuery);
          }),
        )
      : data;

    if (!sortConfig) {
      return filtered;
    }

    const sorted = [...filtered].sort((a, b) => {
      const left = a[sortConfig.column];
      const right = b[sortConfig.column];

      if (left === null || left === undefined) {
        return 1;
      }
      if (right === null || right === undefined) {
        return -1;
      }

      if (typeof left === 'number' && typeof right === 'number') {
        return left - right;
      }

      return String(left).localeCompare(String(right), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });

    return sortConfig.direction === 'asc' ? sorted : sorted.reverse();
  }, [columns, data, search, sortConfig]);

  const toggleSort = (column: string) => {
    setSortConfig((current) => {
      if (!current || current.column !== column) {
        return { column, direction: 'asc' };
      }

      if (current.direction === 'asc') {
        return { column, direction: 'desc' };
      }

      return null;
    });
  };

  const renderSortIcon = (column: string) => {
    if (!sortConfig || sortConfig.column !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }

    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter rows across all columns..."
          className="sm:max-w-sm"
        />
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedData.length} of {data.length} rows
        </p>
      </div>

      <ScrollArea className="h-[500px] rounded-lg border border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort(column)}
                    className="inline-flex items-center gap-1.5 text-left"
                  >
                    {column.charAt(0).toUpperCase() + column.slice(1)}
                    {renderSortIcon(column)}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {column === 'status' ? (
                      <Badge variant={row[column] === 'Active' ? 'default' : 'secondary'}>
                        {String(row[column] ?? '')}
                      </Badge>
                    ) : typeof row[column] === 'number' && column.includes('revenue') ? (
                      `$${row[column].toLocaleString()}`
                    ) : (
                      String(row[column] ?? '')
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
