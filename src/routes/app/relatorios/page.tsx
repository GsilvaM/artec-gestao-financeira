import { useNavigate } from "react-router";
import { BarChart3, CalendarDays, ChevronRight, FileText, Landmark, Network } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";

const reports = [
  {
    icon: Landmark,
    title: "Financeiros",
    description: "DRE, fluxo de caixa, contas e lançamentos",
    to: "/app/relatorios/financeiros",
  },
  {
    icon: Network,
    title: "Por centro de custo",
    description: "Rentabilidade, desempenho e comparativos",
    to: "/app/relatorios/centros-custo",
  },
];

const shortcuts = [
  {
    icon: CalendarDays,
    title: "Fluxo de Caixa",
    description: "Projecao, PDF e Excel",
    to: "/app/financeiro/fluxo-caixa",
  },
  {
    icon: FileText,
    title: "DRE",
    description: "Resultado gerencial e PDF",
    to: "/app/financeiro/dre",
  },
];

export function Component() {
  const navigate = useNavigate();

  return (
    <PageShell
      icon={BarChart3}
      title="Relatórios"
      subtitle="Painéis e exportações para análise gerencial"
    >
      <div className="reports-list">
        {reports.map((report) => (
          <button
            key={report.title}
            type="button"
            className="report-link-card"
            aria-label={`Abrir relatório ${report.title}`}
            onClick={() => navigate(report.to)}
          >
            <span className="report-link-icon">
              <report.icon className="size-5" />
            </span>
            <span className="report-link-copy">
              <strong>{report.title}</strong>
              <span>{report.description}</span>
            </span>
            <ChevronRight className="report-link-chevron" aria-hidden="true" />
          </button>
        ))}
      </div>
      <section className="reports-shortcuts" aria-label="Atalhos de relatórios financeiros">
        <div className="reports-shortcuts-header">
          <h2>Atalhos úteis</h2>
          <p>Rotas com exportações e análises já disponíveis no sistema.</p>
        </div>
        <div className="reports-shortcut-grid">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.title}
              type="button"
              className="report-shortcut-card"
              onClick={() => navigate(shortcut.to)}
            >
              <shortcut.icon className="size-4" />
              <span>
                <strong>{shortcut.title}</strong>
                <small>{shortcut.description}</small>
              </span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
      <style>{reportStyles}</style>
    </PageShell>
  );
}

const reportStyles = `
.reports-list {
  display: grid;
  gap: 12px;
}

.reports-shortcuts {
  margin-top: 16px;
  display: grid;
  gap: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  padding: 14px;
  box-shadow: var(--shadow-xs);
}

.reports-shortcuts-header {
  display: grid;
  gap: 4px;
}

.reports-shortcuts-header h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 0.95rem;
  font-weight: 850;
  line-height: 1.2;
}

.reports-shortcuts-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 650;
  line-height: 1.35;
}

.reports-shortcut-grid {
  display: grid;
  gap: 8px;
}

.report-shortcut-card {
  display: inline-flex;
  min-height: 56px;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-2);
  color: var(--foreground);
  padding: 10px 12px;
  text-align: left;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.report-shortcut-card:hover {
  border-color: color-mix(in srgb, var(--primary) 28%, var(--border));
  background: color-mix(in srgb, var(--primary) 5%, var(--surface));
}

.report-shortcut-card > svg:first-child {
  flex: 0 0 auto;
  color: var(--primary);
}

.report-shortcut-card > span {
  display: grid;
  min-width: 0;
  flex: 1 1 auto;
  gap: 2px;
}

.report-shortcut-card strong {
  color: var(--text-strong);
  font-size: 0.8125rem;
  font-weight: 850;
  line-height: 1.2;
}

.report-shortcut-card small {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 650;
  line-height: 1.25;
}

.report-link-card {
  display: inline-flex;
  min-height: 84px;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: var(--surface);
  color: var(--foreground);
  padding: 16px;
  text-align: left;
  box-shadow: var(--shadow-xs);
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease,
    box-shadow 150ms ease;
}

.report-link-card:hover {
  border-color: color-mix(in srgb, var(--primary) 34%, var(--border));
  background: color-mix(in srgb, var(--primary) 5%, var(--surface));
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.report-link-icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--primary-soft);
  color: var(--primary);
}

.report-link-copy {
  display: grid;
  min-width: 0;
  flex: 1 1 auto;
  gap: 4px;
}

.report-link-copy strong {
  color: var(--text-strong);
  font-size: 0.95rem;
  font-weight: 850;
  line-height: 1.2;
}

.report-link-copy span {
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 650;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.report-link-chevron {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  color: var(--text-muted);
}

@media (min-width: 768px) {
  .reports-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reports-shortcut-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .report-link-card {
    min-height: 76px;
    gap: 12px;
    padding: 14px;
  }

  .report-link-icon {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
  }
}
`;
