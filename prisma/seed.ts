import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma/client";

async function main() {
  const roles = [
    { name: "admin", description: "Administrador - acesso total" },
    { name: "proprietario", description: "Proprietário - dashboards executivos" },
    { name: "financeiro", description: "Financeiro - lançamentos, contas, DRE" },
    { name: "operacional", description: "Operacional - serviços, técnicos" },
    { name: "tecnico", description: "Técnico - próprios serviços" },
  ];
  for (const r of roles) {
    const exists = await prisma.role.findUnique({ where: { name: r.name } });
    if (!exists) await prisma.role.create({ data: r });
  }
  console.log("Roles ok");

  const catReceita = [
    { name: "Venda de Serviços", type: "receita", color: "#22c55e" },
    { name: "Venda de Produtos", type: "receita", color: "#16a34a" },
    { name: "Consultoria", type: "receita", color: "#15803d" },
    { name: "Manutenção", type: "receita", color: "#10b981" },
  ];
  const catDespesa = [
    { name: "Material", type: "despesa", color: "#ef4444" },
    { name: "Mão de Obra", type: "despesa", color: "#dc2626" },
    { name: "Transporte", type: "despesa", color: "#f97316" },
    { name: "Ferramentas", type: "despesa", color: "#eab308" },
    { name: "Administrativo", type: "despesa", color: "#6366f1" },
    { name: "Impostos", type: "despesa", color: "#8b5cf6" },
  ];
  for (const c of [...catReceita, ...catDespesa]) {
    const exists = await prisma.category.findFirst({ where: { name: c.name } });
    if (!exists) await prisma.category.create({ data: { id: randomUUID(), ...c } });
  }
  console.log("Categories ok");

  const centros = [
    { name: "Residencial", code: "RES" },
    { name: "Comercial", code: "COM" },
    { name: "Industrial", code: "IND" },
    { name: "Manutenção", code: "MAN" },
  ];
  for (const cc of centros) {
    const exists = await prisma.costCenter.findFirst({ where: { name: cc.name } });
    if (!exists) await prisma.costCenter.create({ data: { id: randomUUID(), ...cc } });
  }
  console.log("Cost centers ok");

  console.log("Seed concluído.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
