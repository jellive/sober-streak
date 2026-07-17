export type DrinkType = '맥주' | '소주' | '사케' | '와인' | '기타';
export type DrinkContext = '회식' | '약속' | '혼술' | '기타';

export interface DrinkDay {
  date: string;          // 'YYYY-MM-DD' (KST)
  drank: boolean;
  nonAlcohol: boolean;
  type?: DrinkType;
  amount?: string;
  context?: DrinkContext;
}

export interface Meta {
  trackingStartDate: string; // 'YYYY-MM-DD' — 시드된 마지막 음주일
  schemaVersion: number;
}

export interface DrinkStore {
  days: Record<string, DrinkDay>;
  meta: Meta;
}

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'sober-streak:v1';
