import { TrendingUp } from "lucide-react";

export function StatusBanner() {
  return (
    <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-[12px] border-[0.5px] border-border/70 bg-[var(--surface-card)] py-12 text-center shadow-[var(--shadow-card)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#292925_0%,#22221f_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-revenue)]/45 to-transparent" />
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--bg-success)] text-[var(--text-success)] shadow-[0_0_0_8px_color-mix(in_srgb,var(--color-revenue)_8%,transparent)] dark:bg-[#073a1c] dark:text-[#21e274]">
        <TrendingUp className="size-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">Tudo em dia</p>
      <p className="text-xs text-muted-foreground">Todas as contas estao dentro do prazo.</p>
    </div>
  );
}
