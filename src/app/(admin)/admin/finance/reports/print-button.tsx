'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function PrintReportButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm"
    >
      <Printer className="w-4 h-4 text-muted-foreground" />
      <span>Print / PDF</span>
    </Button>
  );
}

