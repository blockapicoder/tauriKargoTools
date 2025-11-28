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
// api-explorer
// =====================
// /api/explorer - types
// =====================

export type ExplorerMode = "array" | "tree";

export type ExplorerRequest = {
  /** vide => CWD côté serveur ; relatif => CWD+rel ; absolu => tel quel */
  path?: string;

  /** "array" => content = fichiers à plat ; "tree" => content = arborescence */
  type?: ExplorerMode;

  /** profondeur max (enfants directs = 1). Si absent et type absent => default serveur: 1 */
  maxDeep?: number;

  /** nombre max de fichiers retournés (limite globale) */
  maxSize?: number;
};

// ---- réponses ----

export type ExplorerErrorResponse = {
  type: "error";
  message: string;
};

export type ExplorerFileResponse = {
  type: "file";
  /** chemin absolu (format "joli" Windows/UNC si applicable) */
  path: string;
  name: string;
  /** chemin absolu du parent ou null si racine */
  parent: string | null;
};

export type ExplorerArrayFileItem = {
  type:'file'
  name: string;
  /** chemin absolu du fichier */
  path: string;
};

export type ExplorerTreeItem =
  | {
      type: "file";
      name: string;
      path: string; // absolu
    }
  | {
      type: "directory";
      name: string;
      path: string; // absolu
      /** peut être absent si maxDeep empêche d'expand */
      content?: ExplorerTreeItem[];
    };

export type ExplorerDirectoryResponse =
  | {
      type: "directory";
      path: string; // absolu
      parent: string | null;
      /** si request.type === "array" */
      content: ExplorerArrayFileItem[];
    }
  | {
      type: "directory";
      path: string; // absolu
      parent: string | null;
      /** si request.type === "tree" (ou mode absent côté compat) */
      content: ExplorerTreeItem[];
    };

export type ExplorerResponse =
  | ExplorerErrorResponse
  | ExplorerFileResponse
  | ExplorerDirectoryResponse;

//
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
