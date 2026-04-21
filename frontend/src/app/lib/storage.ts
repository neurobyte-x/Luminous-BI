const ACTIVE_DATASET_KEY = 'luminous.activeDataset';
const LAST_ANALYSIS_KEY = 'luminous.lastAnalysis';

export type ActiveDataset = {
  datasetId: string;
  filename?: string;
  columns?: string[];
  rows?: number;
};

export type LastAnalysisSnapshot = {
  query: string;
  datasetId: string;
  summary: string;
  charts: Array<Record<string, unknown>>;
  data: Array<Record<string, unknown>>;
  createdAt: string;
};

function safeParse<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getActiveDataset(): ActiveDataset | null {
  return safeParse<ActiveDataset>(localStorage.getItem(ACTIVE_DATASET_KEY));
}

export function setActiveDataset(dataset: ActiveDataset): void {
  localStorage.setItem(ACTIVE_DATASET_KEY, JSON.stringify(dataset));
}

export function clearActiveDataset(): void {
  localStorage.removeItem(ACTIVE_DATASET_KEY);
}

export function getLastAnalysis(): LastAnalysisSnapshot | null {
  return safeParse<LastAnalysisSnapshot>(localStorage.getItem(LAST_ANALYSIS_KEY));
}

export function setLastAnalysis(snapshot: LastAnalysisSnapshot): void {
  localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(snapshot));
}
