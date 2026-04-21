import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface SQLViewProps {
  sql: string;
}

export function SQLView({ sql }: SQLViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="absolute right-4 top-4 z-10"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </>
        )}
      </Button>
      <pre className="rounded-lg border border-border bg-muted p-6 text-sm overflow-x-auto">
        <code className="font-mono text-foreground">{sql}</code>
      </pre>
    </div>
  );
}
