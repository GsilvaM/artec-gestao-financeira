import type { AuvoDuplicateCandidate, AuvoImportPreview } from "../../domain/financeiro/auvo-cobranca.js";
import { accountReceivableRepo } from "./repositories.js";
import { parseAuvoInvoiceHtml } from "./auvo-invoice-parser.js";

const AUVO_HOSTNAME = "app.auvo.com.br";
const AUVO_PATH_PREFIX = "/informacoes/ObtenhaFaturaHTML/";
const MAX_URL_LENGTH = 2048;
const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 10_000;

function businessError(message: string, status = 400) {
  return Object.assign(new Error(message), { name: "ValidationError", status });
}

function isIpLiteral(hostname: string) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

export function validateAuvoInvoiceUrl(rawUrl: string) {
  if (!rawUrl || rawUrl.length > MAX_URL_LENGTH) {
    throw businessError("Link do Auvo invalido ou muito longo.");
  }

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw businessError("Informe um link valido da fatura do Auvo.");
  }

  if (url.protocol !== "https:") {
    throw businessError("O link do Auvo deve usar HTTPS.");
  }
  if (url.username || url.password) {
    throw businessError("O link do Auvo nao pode conter credenciais.");
  }
  if (url.port) {
    throw businessError("O link do Auvo nao pode conter porta personalizada.");
  }
  if (url.hostname !== AUVO_HOSTNAME || isIpLiteral(url.hostname)) {
    throw businessError("Use somente links publicos do dominio app.auvo.com.br.");
  }
  if (!url.pathname.startsWith(AUVO_PATH_PREFIX)) {
    throw businessError("Este link nao parece ser uma fatura publica do Auvo.");
  }

  return url;
}

function safeLogUrl(url: URL) {
  return `${url.origin}${AUVO_PATH_PREFIX}...`;
}

async function readLimitedResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
    throw businessError("A pagina do Auvo retornou um formato inesperado.", 502);
  }

  const reader = response.body?.getReader();
  if (!reader) return response.text();

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      throw businessError("A pagina do Auvo excedeu o limite de tamanho.", 502);
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

async function fetchAuvoHtml(initialUrl: URL) {
  let current = initialUrl;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1",
          "user-agent": "ArtecGestao/1.0 (+https://artecclimatizados.com.br)",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw businessError("O Auvo redirecionou sem informar destino.", 502);
        current = validateAuvoInvoiceUrl(new URL(location, current).toString());
        continue;
      }

      if (!response.ok) {
        if (response.status === 404 || response.status === 410) {
          throw businessError("Link expirado ou fatura nao encontrada.", 404);
        }
        throw businessError("Nao foi possivel acessar a pagina do Auvo.", 502);
      }

      return readLimitedResponse(response);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw businessError("A consulta ao Auvo demorou demais. Tente novamente.", 504);
      }
      if (err instanceof Error && err.name === "ValidationError") throw err;
      throw businessError(`Nao foi possivel buscar a fatura do Auvo (${safeLogUrl(current)}).`, 502);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw businessError("O link do Auvo excedeu o limite de redirecionamentos.", 502);
}

async function findDuplicates(preview: ReturnType<typeof parseAuvoInvoiceHtml>) {
  const candidates: AuvoDuplicateCandidate[] = [];
  const byMetadata = [
    preview.invoiceNumber ? `invoiceNumber=${preview.invoiceNumber}` : null,
    preview.externalId ? `externalId=${preview.externalId}` : null,
    preview.sourceUrl ? `sourceUrl=${preview.sourceUrl}` : null,
  ].filter(Boolean);

  for (const token of byMetadata) {
    const matches = await accountReceivableRepo.findAll({ search: token ?? undefined });
    for (const match of matches) {
      candidates.push({
        id: match.id,
        description: match.description,
        client: match.client,
        amount: Number(match.amount),
        dueDate: match.dueDate.toISOString(),
        status: match.status,
        reason: "Metadados Auvo ja encontrados em outra conta.",
      });
    }
  }

  if (preview.client.name && preview.total !== null && preview.dueDate) {
    const matches = await accountReceivableRepo.findAll({
      client: preview.client.name,
      dueDateFrom: new Date(`${preview.dueDate}T00:00:00`),
      dueDateTo: new Date(`${preview.dueDate}T23:59:59`),
    });
    for (const match of matches) {
      if (Math.abs(Number(match.amount) - preview.total) < 0.01) {
        candidates.push({
          id: match.id,
          description: match.description,
          client: match.client,
          amount: Number(match.amount),
          dueDate: match.dueDate.toISOString(),
          status: match.status,
          reason: "Mesmo cliente, valor e vencimento.",
        });
      }
    }
  }

  return Array.from(new Map(candidates.map((item) => [item.id, item])).values());
}

export async function importAuvoInvoice(rawUrl: string): Promise<AuvoImportPreview> {
  const url = validateAuvoInvoiceUrl(rawUrl);
  const html = await fetchAuvoHtml(url);
  const invoice = parseAuvoInvoiceHtml(html, url.toString());
  const duplicates = await findDuplicates(invoice);
  return { invoice, duplicates };
}
