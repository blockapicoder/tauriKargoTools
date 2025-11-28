// dist/client.ts
import * as T from "./types";

export type FetchLike = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export interface ClientOptions {
  /** Exemple: "http://127.0.0.1:5173" ; si absent, utilise 127.0.0.1:8080 */
  baseUrl?: string;
  /** Port à utiliser si baseUrl est omis */
  port?: number | string;
  /** En-têtes par défaut à ajouter à chaque requête */
  headers?: Record<string, string>;
  /** fetch custom (ex. node-fetch) si l’environnement ne fournit pas fetch */
  fetchImpl?: FetchLike;
}

export class TauriKargoClient {
  readonly baseUrl: string;
  readonly headers: Record<string, string>;
  private readonly fetchImpl: FetchLike;

  constructor(opts: ClientOptions = {}) {
    const port = opts.port ?? 8080;
    this.baseUrl = opts.baseUrl ?? (opts.port ?`http://127.0.0.1:${port}`:'');
    this.headers = opts.headers ?? {};
    this.fetchImpl = opts.fetchImpl ?? (globalThis.fetch?.bind(globalThis) as FetchLike);
    if (!this.fetchImpl) throw new Error("No fetch implementation available.");
  }

  /* =============== Helpers HTTP =============== */

  private  req(path: string, init: RequestInit): Promise<Response> {
    const url = this.baseUrl + path;
    const headers = { ...this.headers, ...(init.headers || {}) } as Record<string, string>;
    return this.fetchImpl(url, { ...init, headers });
  }

  private async postJson<R>(path: string, body: unknown): Promise<R> {
    const res = await this.req(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body == null ? undefined : JSON.stringify(body),
    });
    return this.parseJsonOrThrow<R>(res);
  }

  private async parseJsonOrThrow<R>(res: Response): Promise<R> {
    if (!res.ok) {
      const text = await this.safeText(res);
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return (await res.json()) as R;
    }
    // Tolérance: certains endpoints peuvent répondre text/plain en erreur
    const text = await res.text();
    try {
      return JSON.parse(text) as R;
    } catch {
      throw new Error(`Unexpected content-type: ${ct || "unknown"}; body: ${text}`);
    }
  }

  private async safeText(res: Response): Promise<string> {
    try { return await res.text(); } catch { return "<no-body>"; }
  }

  /* =============== Routes: Embed =============== */

  /** POST /api/embed */
  embed(body: T.EmbedReqAny): Promise<T.EmbedResp> {
    return this.postJson<T.EmbedResp>("/api/embed", body);
  }

  /* =============== Routes: Config =============== */

  /** POST /api/useConfig */
  useConfig(body: T.UseConfigReq): Promise<T.UseConfigResp> {
    return this.postJson<T.UseConfigResp>("/api/useConfig", body);
  }

  /** POST /api/get-config */
  getConfig(): Promise<T.GetConfigResp> {
    return this.postJson<T.GetConfigResp>("/api/get-config", {});
  }

  /* =============== Routes: Files =============== */

  /** POST /api/current-directory */
  setCurrentDirectory(body: T.CurrentDirReq): Promise<T.CurrentDirResp> {
    return this.postJson<T.CurrentDirResp>("/api/current-directory", body);
  }

  /**
   * Lire un fichier texte relatif au répertoire courant.
   * (POST sans corps ⇒ READ ; renvoie text/plain ou octet-stream)
   */
  async readFileText(file: string, encoding: string = "utf-8"): Promise<string> {
    const res = await this.req(`/api/file/${encodeURIComponent(file)}`, { method: "POST" });
    if (!res.ok) throw new Error(`READ ${file} failed: ${res.status} ${await this.safeText(res)}`);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/octet-stream")) {
      const buf = await res.arrayBuffer();
      return new TextDecoder(encoding).decode(buf);
    }
    return res.text();
  }

  /** Lire un fichier binaire */
  async readFileBinary(file: string): Promise<ArrayBuffer> {
    const res = await this.req(`/api/file/${encodeURIComponent(file)}`, { method: "POST" });
    if (!res.ok) throw new Error(`READ ${file} failed: ${res.status} ${await this.safeText(res)}`);
    return res.arrayBuffer();
  }

  /** Écrire un fichier texte (UTF-8) */
  async writeFileText(file: string, content: string): Promise<T.FileWriteResp> {
    const res = await this.req(`/api/file/${encodeURIComponent(file)}`, {
      method: "POST",
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: content,
    });
    return this.parseJsonOrThrow<T.FileWriteResp>(res);
  }

  /** Écrire un fichier binaire */
async writeFileBinary(
  file: string,
  data:  Blob 
): Promise<T.FileWriteResp> {
  // Normalise en Blob (OK WebView2/WebKit/Chromium)
  const blob = data

  const res = await fetch(`${this.baseUrl}/api/file/${encodeURIComponent(file)}`, {
    method: "POST",
    // Laisser fetch gérer le Content-Length; Content-Type vient du blob
    headers: { "content-type": blob.type || "application/octet-stream" },
    body: blob,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "<no-body>");
    throw new Error(`WRITE ${file} failed: ${res.status} ${text}`);
  }

  // La route renvoie du JSON en cas d’écriture
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T.FileWriteResp;
  }
  // Fallback s'il répond "text/plain" avec un JSON sérialisé
  return JSON.parse(await res.text()) as T.FileWriteResp;
}

  /** DELETE /api/file/{file} */
  async deleteFile(file: string): Promise<T.FileDeleteResp> {
    const res = await this.req(`/api/file/${encodeURIComponent(file)}`, { method: "DELETE" });
    return this.parseJsonOrThrow<T.FileDeleteResp>(res);
    // En cas d'erreur 4xx/5xx, parseJsonOrThrow lève déjà une exception
  }

  /* =============== Routes: Run (process) =============== */

  /** POST /api/run */
  run(body: T.RunReq): Promise<T.RunResp> {
    return this.postJson<T.RunResp>("/api/run", body);
  }

  /** POST /api/run/status */
  runStatus(body: T.ProcIdReq): Promise<T.ProcStatusResp> {
    return this.postJson<T.ProcStatusResp>("/api/run/status", body);
  }

  /** POST /api/run/stop */
  runStop(body: T.ProcIdReq): Promise<T.ProcStopResp> {
    return this.postJson<T.ProcStopResp>("/api/run/stop", body);
  }

  /** POST /api/run/stopAll */
  runStopAll(): Promise<T.StopAllResp> {
    return this.postJson<T.StopAllResp>("/api/run/stopAll", {});
  }

  /* =============== Routes: Explorer =============== */

  /** POST /api/explorer */
  explorer(body: T.ExplorerRequest): Promise<T.ExplorerResponse> {
    return this.postJson<T.ExplorerResponse>("/api/explorer", body);
  }

  /* =============== Routes: Servers =============== */

  /** POST /api/newServer */
  newServer(body: T.NewServerReq): Promise<T.NewServerResp> {
    return this.postJson<T.NewServerResp>("/api/newServer", body);
  }

  /** POST /api/stop */
  stopServer(body: T.StopServerReq = {}): Promise<T.StopServerResp> {
    return this.postJson<T.StopServerResp>("/api/stop", body);
  }
}

/* =============== Petit helper factory =============== */
export function createClient(opts?: ClientOptions) {
  return new TauriKargoClient(opts);
}

/* =============== Exemple d'usage =============== */
/*
const api = createClient({ port: 5173 });
await api.useConfig({ code: "C:/code", executable: "C:/bin" });
const txt = await api.readFileText("README.md");
await api.writeFileText("out.txt", "hello");
const run = await api.run({ executableName: "mytool", arguments: ["--help"] });
const st = await api.runStatus({ id: run.id! });
*/
