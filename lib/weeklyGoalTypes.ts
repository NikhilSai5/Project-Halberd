export interface AutoTrackingConfig {
  enabled: boolean;
  keywords: string[];
  classificationThresholdMs: number;
  gracePeriodMs: number;
  excludedDomains: string[];
  productiveDomains: string[];
  minSessionDurationMs: number;
}

export interface WeeklyGoalSession {
  timeRange: string;
  description: string;
}

export interface WeeklyGoal {
  id: string;
  name: string;
  targetHours: number;
  startDate: string;
  endDate: string;
  sessions: WeeklyGoalSession[];
  autoTracking?: AutoTrackingConfig;
  completed: boolean;
}

export interface ProductiveSession {
  id: string;
  domain: string;
  url: string;
  title: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  isProductive: boolean;
  weeklyGoalId: string;
  contentSummary: string;
  matchedKeywords: string[];
  confidence: number;
  createdAt: number;
}

export const DEFAULT_AUTO_TRACKING_CONFIG: AutoTrackingConfig = {
  enabled: false,
  keywords: [],
  classificationThresholdMs: 5 * 60 * 1000,
  gracePeriodMs: 30 * 1000,
  excludedDomains: [],
  productiveDomains: [],
  minSessionDurationMs: 60 * 1000,
};
