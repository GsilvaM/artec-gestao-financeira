import { TrendingUp } from "lucide-react";

export function StatusBanner() {
  return (
    <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border-[0.5px] border-border/70 bg-[var(--surface-card)] px-5 py-4 text-center shadow-[var(--shadow-card)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#292925_0%,#22221f_100%)] sm:px-6 sm:py-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-revenue)]/45 to-transparent" />
      <div className="flex size-10 items-center justify-center rounded-full bg-[var(--bg-success)] text-[var(--text-success)] shadow-[0_0_0_6px_color-mix(in_srgb,var(--color-revenue)_8%,transparent)] dark:bg-[#073a1c] dark:text-[#21e274]">
        <TrendingUp className="size-4" />
      </div>
      <p className="text-sm font-semibold text-foreground">Tudo em dia</p>
      <p className="text-xs text-muted-foreground">Todas as contas estao dentro do prazo.</p>
    </div>
  );
}
