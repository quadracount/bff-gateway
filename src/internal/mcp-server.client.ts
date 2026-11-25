import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { internalApiKey } from './internal-key';

export interface ParseExpenseRequest {
  groupId: string;
  text: string;
  paidBy: string;
  requesterId: string;
}

/** Respuesta de POST /automation/parse-expense (misma forma que ExpenseDraft). */
export interface McpDraft {
  description: string;
  amount: number;
  paidBy: { userId: string; name: string };
  shares: { userId: string; name: string; amount: number }[];
  interpretations: { phrase: string; meaning: string }[];
  sumMatches: boolean;
}

const UNAVAILABLE =
  'El asistente no está disponible en este momento. Usa la pestaña Formulario.';

/** Cliente REST del mcp-server. */
@Injectable()
export class McpServerClient {
  private readonly logger = new Logger(McpServerClient.name);
  private readonly baseUrl =
    process.env.MCP_SERVER_URL ?? 'http://localhost:3001';
  private readonly key = internalApiKey();
  // Con el LLM, un borrador puede tardar varios segundos
  private readonly timeoutMs = Number(process.env.MCP_TIMEOUT_MS ?? 60_000);

  async parseExpense(body: ParseExpenseRequest): Promise<McpDraft> {
    let res: Response;
    try {
      res = await fetch(new URL('/automation/parse-expense', this.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': this.key,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      this.logger.warn(`mcp-server no respondió: ${String(error)}`);
      throw new ServiceUnavailableException(UNAVAILABLE);
    }

    if (res.ok) return (await res.json()) as McpDraft;

    const message = await errorMessage(res);
    switch (res.status) {
      case 400:
      case 422:
        throw new BadRequestException(message);
      case 403:
        throw new ForbiddenException(message);
      case 404:
        throw new NotFoundException(message);
      default:
        this.logger.warn(`mcp-server respondió ${res.status}: ${message}`);
        throw new ServiceUnavailableException(UNAVAILABLE);
    }
  }
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    if (body.message) return body.message;
  } catch {
    // cuerpo vacío o que no es JSON
  }
  return `mcp-server respondió ${res.status}`;
}
