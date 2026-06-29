import { TrendingUp } from "lucide-react";
export function StatusBanner() {
  return (
    <div className="flex flex-col items-center gap-3 overflow-hidden rounded-[12px] border-[0.5px] border-border/70 bg-[var(--surface-card)] py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--bg-success)] text-[var(--text-success)]">
        <TrendingUp className="size-5" />
      </div>
      <p className="text-sm font-medium text-foreground">Tudo em dia</p>
      <p className="text-xs text-muted-foreground">Todas as contas estão dentro do prazo.</p>
    </div>
  );
}
