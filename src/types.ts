/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserPlan = 'FREE' | 'PREMIUM';

export interface UserProfile {
  id: string;
  email: string;
  plan: UserPlan;
  storageUsage: number; // in bytes
  storageLimit: number; // in bytes (e.g. 20MB for FREE, 2GB for PREMIUM)
  createdAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId: string | null; // Supports subfolders
  createdAt: string;
}

export type ProblemType = 'SOLVING' | 'MEMORIZING'; // 풀이형 / 암기형
export type Difficulty = 'HIGH' | 'MEDIUM' | 'LOW'; // 상 / 중 / 하
export type MistakeReason = 'CONCEPT' | 'CALCULATION' | 'READING_ERROR' | 'COMPREHENSION' | 'OTHER' | string;
export type EvaluationResult = 'X' | 'TRIANGLE' | 'CHECK'; // X / △ / ✓

export interface ReviewRecord {
  sessionId: string;
  sessionType: 'PDF' | 'EXAM';
  result: EvaluationResult;
  reviewedAt: string;
}

export interface Problem {
  id: string;
  userId: string;
  title: string;
  problemImageUrls: string[]; // 문제 이미지 목록
  solutionImageUrls: string[]; // 답안 및 해설 이미지 목록
  folderId: string | null; // 상위 폴더 ID
  tags: string[];
  problemType: ProblemType;
  difficulty: Difficulty;
  mistakeReason: MistakeReason;
  memo: string;
  reviewHistory: ReviewRecord[];
  mastered: boolean; // 체화 여부 (마지막 평가가 CHECK 인지 여부)
  masteredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSession {
  id: string;
  userId: string;
  pdfName: string;
  createdAt: string;
  problemIds: string[];
  problemOrder: string[];
  evaluations: Record<string, EvaluationResult | null>; // problemId -> evaluation
}

export interface ExamSession {
  id: string;
  userId: string;
  examName: string;
  createdAt: string;
  problemIds: string[];
  problemOrder: string[];
  evaluations: Record<string, EvaluationResult | null>; // problemId -> evaluation
  finished: boolean;
  resultStats?: {
    total: number;
    checkCount: number;
    triangleCount: number;
    xCount: number;
    newMasteredCount: number;
    remainingReviewCount: number;
  };
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
}
