import { TrendingUp } from "lucide-react";

export function StatusBanner() {
  return (
    <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-4 text-center shadow-[var(--shadow-sm)] sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-revenue)]/45 to-transparent" />
      <div className="flex size-10 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)] shadow-[0_0_0_6px_color-mix(in_srgb,var(--success)_8%,transparent)]">
        <TrendingUp className="size-4" />
      </div>
      <p className="text-sm font-semibold text-foreground">Tudo em dia</p>
      <p className="text-xs text-muted-foreground">Todas as contas estao dentro do prazo.</p>
    </div>
  );
}
