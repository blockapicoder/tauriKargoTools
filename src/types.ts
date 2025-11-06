/** OpenAPI: 3.0.3 — Tauri Static Server API — v1.0.0 */

/* =========================
   Schemas (components)
   ========================= */

export interface EmbedReqAny {
  /** Code folder to package (required server-side) */
  code: string | null;
  /** Binary folder to package */
  executable: string | null;
  /** Path of the new executable */
  output: string;
}

export interface EmbedResp {
  ok: boolean;
  message: string;
}

export interface UseConfigReq {
  code: string;
  executable: string;
}

export interface UseConfigResp {
  ok: boolean;
  message: string;
}

export interface GetConfigResp {
  ok: boolean;
  code: string;
  executable: string;
  fileBase: string;
}

export interface CurrentDirReq {
  /** Absolute or relative path. Empty ⇒ CWD. */
  path: string;
}

export interface CurrentDirResp {
  ok: boolean;
  message: string;
  current: string;
}

export interface FileWriteResp {
  ok: boolean;
  message: string;
  path: string;
}

export interface FileDeleteResp {
  ok: boolean;
  message: string;
  path: string;
}

export interface RunReq {
  executableName: string;
  /** Either an argv array or a single command-line string */
  arguments?: string[] | string;
}

export interface RunResp {
  ok: boolean;
  /** exit status code (when available) */
  status?: number | null;
  message: string;
  stdout?: string;
  stderr?: string;
  /** internal id of started process */
  id?: number | null;   // int64 → number
  /** OS pid (when available) */
  pid?: number | null;
}

export interface ProcIdReq {
  id: number; // int64
}

export interface ProcStatusResp {
  ok: boolean;
  running: boolean;
  status?: number | null;
  pid?: number | null;
  stdout: string;
  stderr: string;
  message: string;
}

export interface ProcStopResp {
  ok: boolean;
  message: string;
}

export interface StopAllResp {
  ok: boolean;
  message: string;
}

export interface ExplorerReq {
  path?: string;
}

export type ExplorerElement = ExplorerDirectory | ExplorerFile

export interface ExplorerFile {
  type: "file";
  path: string;
  name: string;
  parent: string | null;
}

export interface ExplorerDirectory {
  type: "directory";
  path: string;
  parent: string | null;
  content: ExplorerElement[];
}

export interface ExplorerError {
  type: "error";
  message: string;
}

export interface NewServerReq {
  code: string;
  executable: string;
  /** 0..65535 (nullable) */
  port?: number | null;
}

export interface NewServerResp {
  ok: boolean;
  port?: number | null;
  message: string;
}

export interface StopServerReq {
  /** if omitted, targets current server (parent) */
  port?: number | null;
}

export interface StopServerResp {
  ok: boolean;
  port?: number | null;
  message: string;
}

/* =========================
   Helper union types
   ========================= */

/** Result of /api/explorer (200) */
export type ExplorerResult = ExplorerFile | ExplorerDirectory;

/** Error shapes from /api/explorer (404/500) */
export type ExplorerErrorResult = ExplorerError;

/* =========================
   (Optionnel) Types d’IO par route
   — utiles si tu veux typer ton client HTTP
   ========================= */

/* =========================
   (Optionnel) Types utilitaires client
   ========================= */

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [k: string]: Json };
