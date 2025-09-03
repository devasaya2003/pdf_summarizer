import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from "@/components/ui/collapsible";

interface RawTextPaneProps {
  rawText: string;
}

export default function RawTextPane({ rawText }: RawTextPaneProps) {
  return (
    <div className="w-1/4 border-l border-[var(--border)] p-4 bg-[var(--card)]">
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full mb-2 border-[var(--border)] text-[var(--foreground)]">
            Toggle Raw Text
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="h-[80vh] w-full rounded border border-[var(--border)] p-2 bg-[var(--muted)]">
            <pre className="text-xs text-[var(--muted-foreground)] whitespace-pre-wrap">{rawText}</pre>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}