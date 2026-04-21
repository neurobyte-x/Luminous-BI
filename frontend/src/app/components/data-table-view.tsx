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

interface DataTableViewProps {
  data: any[];
}

export function DataTableView({ data }: DataTableViewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <ScrollArea className="h-[500px] rounded-lg border border-border">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} className="font-semibold">
                {column.charAt(0).toUpperCase() + column.slice(1)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column}>
                  {column === 'status' ? (
                    <Badge
                      variant={row[column] === 'Active' ? 'default' : 'secondary'}
                    >
                      {row[column]}
                    </Badge>
                  ) : typeof row[column] === 'number' && column.includes('revenue') ? (
                    `$${row[column].toLocaleString()}`
                  ) : (
                    row[column]
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
