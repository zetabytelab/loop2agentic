import type { Report } from "../types.js";

export interface Scanner {
  id: string;
  scan(url: string): Promise<Report>;
}
