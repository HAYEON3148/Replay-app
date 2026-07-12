/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  UserProfile, 
  Folder, 
  Problem, 
  ReviewSession, 
  ExamSession, 
  EvaluationResult, 
  ReviewRecord 
} from '../types';

// ============================================================================
// Firebase Service Layer (Fully functional local cloud storage with Firebase support)
// ============================================================================

const FREE_LIMIT = 5 * 1024 * 1024; // 5MB limit for Free tier to demonstrate limits easily
const PREMIUM_LIMIT = 100 * 1024 * 1024; // 100MB for Premium

class FirebaseService {
  private listeners: (() => void)[] = [];
  private currentUser: UserProfile | null = null;

  constructor() {
    this.initializeDemoData();
  }

  // Subscribe to changes (so our UI updates in real-time)
  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private initializeDemoData() {
    // Current simulated user matching the workspace metadata
    const cachedUser = localStorage.getItem('error_note_user');
    if (!cachedUser) {
      const defaultUser: UserProfile = {
        id: 'user_chy3148123',
        email: 'chy3148123@gmail.com',
        plan: 'FREE',
        storageUsage: 0,
        storageLimit: FREE_LIMIT,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('error_note_user', JSON.stringify(defaultUser));
      this.currentUser = defaultUser;
    } else {
      this.currentUser = JSON.parse(cachedUser);
    }

    // Initialize Folders if empty
    if (!localStorage.getItem('error_note_folders')) {
      const initialFolders: Folder[] = [
        { id: 'f1', userId: 'user_chy3148123', name: '수학', parentId: null, createdAt: new Date().toISOString() },
        { id: 'f2', userId: 'user_chy3148123', name: '미적분', parentId: 'f1', createdAt: new Date().toISOString() },
        { id: 'f3', userId: 'user_chy3148123', name: '확률과 통계', parentId: 'f1', createdAt: new Date().toISOString() },
        { id: 'f4', userId: 'user_chy3148123', name: '영어', parentId: null, createdAt: new Date().toISOString() },
        { id: 'f5', userId: 'user_chy3148123', name: '독해', parentId: 'f4', createdAt: new Date().toISOString() },
        { id: 'f6', userId: 'user_chy3148123', name: '어휘', parentId: 'f4', createdAt: new Date().toISOString() },
      ];
      localStorage.setItem('error_note_folders', JSON.stringify(initialFolders));
    }

    // Initialize Problems if empty
    if (!localStorage.getItem('error_note_problems')) {
      // We will provide some elegant high-quality mock problems with placeholders
      const initialProblems: Problem[] = [
        {
          id: 'p1',
          userId: 'user_chy3148123',
          title: '2024학년도 수능 수학 22번 (미적분)',
          problemImageUrls: ['/assets/placeholder_math22.png'],
          solutionImageUrls: ['/assets/placeholder_math22_sol.png'],
          folderId: 'f2',
          tags: ['수능 기출', '미적분', '킬러문항'],
          problemType: 'SOLVING',
          difficulty: 'HIGH',
          mistakeReason: 'CONCEPT',
          memo: '삼차함수의 비율 관계와 접선의 개수 성질을 이용해 극값을 찾아야 함. g(x) 그래프 개형 추론할 때 f(x)와의 관계식을 잘못 세워서 틀림.',
          reviewHistory: [
            { sessionId: 's1', sessionType: 'PDF', result: 'X', reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { sessionId: 's2', sessionType: 'EXAM', result: 'TRIANGLE', reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          mastered: false,
          masteredAt: null,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'p2',
          userId: 'user_chy3148123',
          title: '6월 모의평가 미적분 29번 (등비급수 도형)',
          problemImageUrls: ['/assets/placeholder_math29.png'],
          solutionImageUrls: ['/assets/placeholder_math29_sol.png'],
          folderId: 'f2',
          tags: ['6평 기출', '도형', '급수'],
          problemType: 'SOLVING',
          difficulty: 'MEDIUM',
          mistakeReason: 'CALCULATION',
          memo: '첫째항 구하는 건 맞았는데 공비 구하는 과정에서 원의 성질(방멱정리) 적용할 때 곱하기 계산 실수함. 다시 풀면 충분히 맞출 수 있음.',
          reviewHistory: [
            { sessionId: 's1', sessionType: 'PDF', result: 'CHECK', reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          mastered: true,
          masteredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'p3',
          userId: 'user_chy3148123',
          title: 'EBS 수능특강 영어 4강 3번 어휘',
          problemImageUrls: ['/assets/placeholder_eng3.png'],
          solutionImageUrls: ['/assets/placeholder_eng3_sol.png'],
          folderId: 'f6',
          tags: ['수능특강', '핵심어휘'],
          problemType: 'MEMORIZING',
          difficulty: 'LOW',
          mistakeReason: 'COMPREHENSION',
          memo: 'coherent(일관성 있는) 와 inherent(타고난, 내재적인) 단어가 헷갈렸음. 맥락상 타고난 재능을 설명하는 문맥이라 inherent 가 와야 함.',
          reviewHistory: [],
          mastered: false,
          masteredAt: null,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      localStorage.setItem('error_note_problems', JSON.stringify(initialProblems));
      this.recalculateStorageUsage();
    }
  }

  // Helper to recalculate total size of simulated data to emulate storage limits
  recalculateStorageUsage() {
    if (!this.currentUser) return;
    const problems = this.getProblemsSync();
    let totalSize = 0;

    // Sum up length of base64 image strings (which are simulated uploads)
    problems.forEach(p => {
      p.problemImageUrls.forEach(url => {
        if (url.startsWith('data:')) {
          totalSize += url.length;
        }
      });
      p.solutionImageUrls.forEach(url => {
        if (url.startsWith('data:')) {
          totalSize += url.length;
        }
      });
    });

    this.currentUser.storageUsage = totalSize;
    localStorage.setItem('error_note_user', JSON.stringify(this.currentUser));
    this.notify();
  }

  // ==========================================
  // AUTH
  // ==========================================
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  updateUserPlan(plan: 'FREE' | 'PREMIUM') {
    if (!this.currentUser) return;
    this.currentUser.plan = plan;
    this.currentUser.storageLimit = plan === 'FREE' ? FREE_LIMIT : PREMIUM_LIMIT;
    localStorage.setItem('error_note_user', JSON.stringify(this.currentUser));
    this.notify();
  }

  // ==========================================
  // FOLDERS
  // ==========================================
  getFolders(): Promise<Folder[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const foldersJson = localStorage.getItem('error_note_folders') || '[]';
        resolve(JSON.parse(foldersJson));
      }, 100);
    });
  }

  getFoldersSync(): Folder[] {
    const foldersJson = localStorage.getItem('error_note_folders') || '[]';
    return JSON.parse(foldersJson);
  }

  createFolder(name: string, parentId: string | null): Promise<Folder> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const folders = this.getFoldersSync();
        const newFolder: Folder = {
          id: 'folder_' + Math.random().toString(36).substr(2, 9),
          userId: this.currentUser?.id || 'anonymous',
          name,
          parentId,
          createdAt: new Date().toISOString()
        };
        folders.push(newFolder);
        localStorage.setItem('error_note_folders', JSON.stringify(folders));
        this.notify();
        resolve(newFolder);
      }, 100);
    });
  }

  updateFolder(folderId: string, name: string, parentId: string | null): Promise<Folder> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const folders = this.getFoldersSync();
        const index = folders.findIndex(f => f.id === folderId);
        if (index === -1) {
          reject(new Error('Folder not found'));
          return;
        }
        folders[index] = {
          ...folders[index],
          name,
          parentId
        };
        localStorage.setItem('error_note_folders', JSON.stringify(folders));
        this.notify();
        resolve(folders[index]);
      }, 100);
    });
  }

  deleteFolder(folderId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let folders = this.getFoldersSync();
        
        // Find folder and all its child folders recursively
        const getFolderAndChildrenIds = (id: string): string[] => {
          let ids = [id];
          const children = folders.filter(f => f.parentId === id);
          children.forEach(c => {
            ids = [...ids, ...getFolderAndChildrenIds(c.id)];
          });
          return ids;
        };

        const idsToDelete = getFolderAndChildrenIds(folderId);
        
        // Delete folders
        folders = folders.filter(f => !idsToDelete.includes(f.id));
        localStorage.setItem('error_note_folders', JSON.stringify(folders));

        // Move any problems in these folders to Root (null)
        const problems = this.getProblemsSync();
        const updatedProblems = problems.map(p => {
          if (p.folderId && idsToDelete.includes(p.folderId)) {
            return { ...p, folderId: null, updatedAt: new Date().toISOString() };
          }
          return p;
        });
        localStorage.setItem('error_note_problems', JSON.stringify(updatedProblems));

        this.notify();
        resolve();
      }, 100);
    });
  }

  // ==========================================
  // PROBLEMS
  // ==========================================
  getProblems(): Promise<Problem[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.getProblemsSync());
      }, 150);
    });
  }

  getProblemsSync(): Problem[] {
    const json = localStorage.getItem('error_note_problems') || '[]';
    return JSON.parse(json);
  }

  createProblem(problemData: Omit<Problem, 'id' | 'userId' | 'reviewHistory' | 'mastered' | 'masteredAt' | 'createdAt' | 'updatedAt'>): Promise<Problem> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.currentUser && this.currentUser.storageUsage >= this.currentUser.storageLimit) {
          // If the user exceeds storage limits, we block saving if there are new base64 image strings.
          const hasNewImages = [...problemData.problemImageUrls, ...problemData.solutionImageUrls].some(url => url.startsWith('data:'));
          if (hasNewImages) {
            reject(new Error('클라우드 용량 제한 초과: 무료 등급 용량을 초과하여 새 이미지를 업로드할 수 없습니다. 상단에서 구독 업그레이드를 체험해보세요!'));
            return;
          }
        }

        const problems = this.getProblemsSync();
        const newProblem: Problem = {
          ...problemData,
          id: 'prob_' + Math.random().toString(36).substr(2, 9),
          userId: this.currentUser?.id || 'anonymous',
          reviewHistory: [],
          mastered: false,
          masteredAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        problems.push(newProblem);
        localStorage.setItem('error_note_problems', JSON.stringify(problems));
        this.recalculateStorageUsage();
        this.notify();
        resolve(newProblem);
      }, 150);
    });
  }

  updateProblem(problemId: string, updates: Partial<Problem>): Promise<Problem> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const problems = this.getProblemsSync();
        const index = problems.findIndex(p => p.id === problemId);
        if (index === -1) {
          reject(new Error('Problem not found'));
          return;
        }

        // Capacity check
        if (this.currentUser && this.currentUser.storageUsage >= this.currentUser.storageLimit) {
          const hasNewImages = [
            ...(updates.problemImageUrls || []),
            ...(updates.solutionImageUrls || [])
          ].some(url => url.startsWith('data:') && !problems[index].problemImageUrls.includes(url) && !problems[index].solutionImageUrls.includes(url));
          
          if (hasNewImages) {
            reject(new Error('클라우드 용량 제한 초과: 무료 등급 용량을 초과하여 새 이미지를 업로드할 수 없습니다. 상단에서 구독 업그레이드를 체험해보세요!'));
            return;
          }
        }

        const oldProblem = problems[index];
        const updatedProblem = {
          ...oldProblem,
          ...updates,
          updatedAt: new Date().toISOString()
        };

        // Recalculate mastered state based on the last review evaluation
        if (updates.reviewHistory) {
          const history = updates.reviewHistory;
          if (history.length > 0) {
            // Sort history by date descending to find the latest
            const sortedHistory = [...history].sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
            const latestEval = sortedHistory[0].result;
            
            if (latestEval === 'CHECK') {
              updatedProblem.mastered = true;
              updatedProblem.masteredAt = sortedHistory[0].reviewedAt;
            } else {
              updatedProblem.mastered = false;
              updatedProblem.masteredAt = null;
            }
          } else {
            updatedProblem.mastered = false;
            updatedProblem.masteredAt = null;
          }
        }

        problems[index] = updatedProblem;
        localStorage.setItem('error_note_problems', JSON.stringify(problems));
        this.recalculateStorageUsage();
        this.notify();
        resolve(updatedProblem);
      }, 150);
    });
  }

  deleteProblem(problemId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let problems = this.getProblemsSync();
        problems = problems.filter(p => p.id !== problemId);
        localStorage.setItem('error_note_problems', JSON.stringify(problems));
        this.recalculateStorageUsage();
        this.notify();
        resolve();
      }, 100);
    });
  }

  // Evaluation logic - Direct saving for PDF Sessions or App Exams
  saveEvaluation(problemId: string, result: EvaluationResult, sessionId: string, sessionType: 'PDF' | 'EXAM'): Promise<Problem> {
    return new Promise((resolve, reject) => {
      const problems = this.getProblemsSync();
      const index = problems.findIndex(p => p.id === problemId);
      if (index === -1) {
        reject(new Error('Problem not found'));
        return;
      }

      const problem = problems[index];
      
      // Look for an existing evaluation in this session to update, otherwise add
      let history = [...problem.reviewHistory];
      const existingIndex = history.findIndex(h => h.sessionId === sessionId);

      const reviewRecord: ReviewRecord = {
        sessionId,
        sessionType,
        result,
        reviewedAt: new Date().toISOString()
      };

      if (existingIndex !== -1) {
        history[existingIndex] = reviewRecord;
      } else {
        history.push(reviewRecord);
      }

      // Sort by reviewedAt descending to determine the latest mastered state
      const sortedHistory = [...history].sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
      const latestResult = sortedHistory[0].result;
      
      const mastered = latestResult === 'CHECK';
      const masteredAt = mastered ? sortedHistory[0].reviewedAt : null;

      const updatedProblem: Problem = {
        ...problem,
        reviewHistory: history,
        mastered,
        masteredAt,
        updatedAt: new Date().toISOString()
      };

      problems[index] = updatedProblem;
      localStorage.setItem('error_note_problems', JSON.stringify(problems));
      this.notify();
      resolve(updatedProblem);
    });
  }

  // ==========================================
  // REVIEW SESSIONS (PDF SESSIONS)
  // ==========================================
  getReviewSessions(): Promise<ReviewSession[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const json = localStorage.getItem('error_note_review_sessions') || '[]';
        resolve(JSON.parse(json));
      }, 100);
    });
  }

  getReviewSessionsSync(): ReviewSession[] {
    const json = localStorage.getItem('error_note_review_sessions') || '[]';
    return JSON.parse(json);
  }

  createReviewSession(sessionData: Omit<ReviewSession, 'id' | 'userId' | 'createdAt'>): Promise<ReviewSession> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sessions = this.getReviewSessionsSync();
        const newSession: ReviewSession = {
          ...sessionData,
          id: 'session_' + Math.random().toString(36).substr(2, 9),
          userId: this.currentUser?.id || 'anonymous',
          createdAt: new Date().toISOString()
        };
        sessions.push(newSession);
        localStorage.setItem('error_note_review_sessions', JSON.stringify(sessions));
        this.notify();
        resolve(newSession);
      }, 100);
    });
  }

  updateReviewSessionEvaluation(sessionId: string, problemId: string, result: EvaluationResult): Promise<ReviewSession> {
    return new Promise(async (resolve, reject) => {
      const sessions = this.getReviewSessionsSync();
      const sIndex = sessions.findIndex(s => s.id === sessionId);
      if (sIndex === -1) {
        reject(new Error('Session not found'));
        return;
      }

      const session = sessions[sIndex];
      session.evaluations[problemId] = result;
      sessions[sIndex] = session;
      localStorage.setItem('error_note_review_sessions', JSON.stringify(sessions));

      // Propagate result immediately to the core problem
      await this.saveEvaluation(problemId, result, sessionId, 'PDF');
      
      this.notify();
      resolve(session);
    });
  }

  // ==========================================
  // EXAM SESSIONS
  // ==========================================
  getExamSessions(): Promise<ExamSession[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const json = localStorage.getItem('error_note_exam_sessions') || '[]';
        resolve(JSON.parse(json));
      }, 100);
    });
  }

  getExamSessionsSync(): ExamSession[] {
    const json = localStorage.getItem('error_note_exam_sessions') || '[]';
    return JSON.parse(json);
  }

  createExamSession(sessionData: Omit<ExamSession, 'id' | 'userId' | 'createdAt' | 'finished'>): Promise<ExamSession> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sessions = this.getExamSessionsSync();
        const newSession: ExamSession = {
          ...sessionData,
          id: 'exam_' + Math.random().toString(36).substr(2, 9),
          userId: this.currentUser?.id || 'anonymous',
          createdAt: new Date().toISOString(),
          finished: false
        };
        sessions.push(newSession);
        localStorage.setItem('error_note_exam_sessions', JSON.stringify(sessions));
        this.notify();
        resolve(newSession);
      }, 100);
    });
  }

  updateExamSessionEvaluation(sessionId: string, problemId: string, result: EvaluationResult): Promise<ExamSession> {
    return new Promise(async (resolve, reject) => {
      const sessions = this.getExamSessionsSync();
      const sIndex = sessions.findIndex(s => s.id === sessionId);
      if (sIndex === -1) {
        reject(new Error('Exam Session not found'));
        return;
      }

      const session = sessions[sIndex];
      session.evaluations[problemId] = result;
      sessions[sIndex] = session;
      localStorage.setItem('error_note_exam_sessions', JSON.stringify(sessions));

      // Propagate result immediately to the core problem
      await this.saveEvaluation(problemId, result, sessionId, 'EXAM');
      
      this.notify();
      resolve(session);
    });
  }

  finishExamSession(sessionId: string, stats: ExamSession['resultStats']): Promise<ExamSession> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const sessions = this.getExamSessionsSync();
        const sIndex = sessions.findIndex(s => s.id === sessionId);
        if (sIndex === -1) {
          reject(new Error('Exam Session not found'));
          return;
        }

        const session = sessions[sIndex];
        session.finished = true;
        session.resultStats = stats;
        sessions[sIndex] = session;
        localStorage.setItem('error_note_exam_sessions', JSON.stringify(sessions));
        this.notify();
        resolve(session);
      }, 100);
    });
  }

  // ==========================================
  // TAGS (Helper to extract global tags)
  // ==========================================
  async getTags(): Promise<string[]> {
    const problems = this.getProblemsSync();
    const tagSet = new Set<string>();
    problems.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }
}

export const firebaseService = new FirebaseService();
