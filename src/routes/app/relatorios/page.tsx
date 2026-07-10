import { useNavigate } from "react-router";
import { BarChart3, ChevronRight, Landmark, Network } from "lucide-react";
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
      <style>{reportStyles}</style>
    </PageShell>
  );
}

const reportStyles = `
.reports-list {
  display: grid;
  gap: 12px;
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
