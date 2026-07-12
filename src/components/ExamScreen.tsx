/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Problem, Folder, EvaluationResult, ExamSession } from '../types';
import { 
  Brain, 
  Settings, 
  Check, 
  Play, 
  ArrowLeft, 
  ChevronRight, 
  Eye, 
  Info, 
  Award,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { getProblemImageSrc } from '../utils/placeholders';

interface ExamScreenProps {
  problems: Problem[];
  folders: Folder[];
  examSessions: ExamSession[];
  onRefreshData: () => void;
  onSelectProblem: (problem: Problem) => void;
  initialHistorySessionId: string | null;
}

export default function ExamScreen({
  problems,
  folders,
  examSessions,
  onRefreshData,
  onSelectProblem,
  initialHistorySessionId
}: ExamScreenProps) {
  // Navigation tabs: 'config' | 'playing' | 'result' | 'history'
  const [screenMode, setScreenMode] = useState<'config' | 'playing' | 'result' | 'history'>(
    initialHistorySessionId ? 'history' : 'config'
  );

  // 1. CONFIG STATES
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [includeSubfolders, setIncludeSubfolders] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  // Special targeting
  const [targetingFilter, setTargetingFilter] = useState<'ALL' | 'ONLY_X' | 'ONLY_TRIANGLE' | 'X_AND_TRIANGLE' | 'NEVER_PLAYED'>('ALL');
  const [limitCount, setLimitCount] = useState<number>(10);
  const [orderType, setOrderType] = useState<'sequential' | 'random'>('random');

  // 2. ACTIVE GAME STATES
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [revealAnswer, setRevealAnswer] = useState<boolean>(false);

  // Newly mastered count during this single session tracker
  const [newMasteredCount, setNewMasteredCount] = useState<number>(0);

  // Past History viewing
  const [historySessionId, setHistorySessionId] = useState<string | null>(initialHistorySessionId);

  const getSubfolderIds = (folderId: string): string[] => {
    let ids = [folderId];
    const children = folders.filter(f => f.parentId === folderId);
    children.forEach(c => {
      ids = [...ids, ...getSubfolderIds(c.id)];
    });
    return ids;
  };

  // Helper filter to select exam quiz database bank
  const getExamProblemPool = () => {
    return problems.filter(p => {
      if (selectedFolderId !== null) {
        if (includeSubfolders) {
          const allowed = getSubfolderIds(selectedFolderId);
          if (!p.folderId || !allowed.includes(p.folderId)) return false;
        } else {
          if (p.folderId !== selectedFolderId) return false;
        }
      }

      if (selectedTag && !p.tags.includes(selectedTag)) return false;
      if (selectedDifficulty && p.difficulty !== selectedDifficulty) return false;
      if (selectedReason && p.mistakeReason !== selectedReason) return false;

      // Targeting
      const hasX = p.reviewHistory.some(h => h.result === 'X');
      const hasTriangle = p.reviewHistory.some(h => h.result === 'TRIANGLE');
      const neverPlayed = p.reviewHistory.length === 0;

      if (targetingFilter === 'ONLY_X' && !hasX) return false;
      if (targetingFilter === 'ONLY_TRIANGLE' && !hasTriangle) return false;
      if (targetingFilter === 'X_AND_TRIANGLE' && !hasX && !hasTriangle) return false;
      if (targetingFilter === 'NEVER_PLAYED' && !neverPlayed) return false;

      return true;
    });
  };

  // 3. ACTIONS
  const handleStartExam = async () => {
    const pool = getExamProblemPool();
    if (pool.length === 0) {
      alert('출제 조건에 부합하는 문제가 존재하지 않습니다. 필터 조건을 변경해 보세요!');
      return;
    }

    // Shuffle or slice
    let chosen = [...pool];
    if (orderType === 'random') {
      chosen.sort(() => Math.random() - 0.5);
    }
    chosen = chosen.slice(0, limitCount);

    const problemIds = chosen.map(p => p.id);
    const initialEvaluations: Record<string, null> = {};
    problemIds.forEach(id => {
      initialEvaluations[id] = null;
    });

    try {
      const session = await firebaseService.createExamSession({
        examName: `${selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name + ' ' : ''}암기형 스피드 시험`,
        problemIds,
        problemOrder: problemIds,
        evaluations: initialEvaluations
      });

      setActiveSession(session);
      setCurrentIndex(0);
      setRevealAnswer(false);
      setNewMasteredCount(0);
      setScreenMode('playing');
    } catch (e: any) {
      alert('시험 시작 실패: ' + e.message);
    }
  };

  // Grade individual question in speed mode (Step 10)
  const handleGradeQuiz = async (result: EvaluationResult) => {
    if (!activeSession) return;
    const currentProblemId = activeSession.problemIds[currentIndex];
    
    // Check if it was previously unmastered but now is check/mastered
    const origProblem = problems.find(p => p.id === currentProblemId);
    const wasUnmastered = origProblem ? !origProblem.mastered : true;

    try {
      await firebaseService.updateExamSessionEvaluation(activeSession.id, currentProblemId, result);
      
      if (result === 'CHECK' && wasUnmastered) {
        setNewMasteredCount(prev => prev + 1);
      }

      // Progress to next question or end
      if (currentIndex + 1 < activeSession.problemIds.length) {
        setCurrentIndex(prev => prev + 1);
        setRevealAnswer(false);
      } else {
        // Complete the exam session
        const finalSession = firebaseService.getExamSessionsSync().find(s => s.id === activeSession.id);
        if (finalSession) {
          const evals = Object.values(finalSession.evaluations);
          const total = evals.length;
          const checkCount = evals.filter(v => v === 'CHECK').length;
          const triangleCount = evals.filter(v => v === 'TRIANGLE').length;
          const xCount = evals.filter(v => v === 'X').length;

          const stats = {
            total,
            checkCount,
            triangleCount,
            xCount,
            newMasteredCount: result === 'CHECK' && wasUnmastered ? newMasteredCount + 1 : newMasteredCount,
            remainingReviewCount: total - checkCount
          };

          const finishedSession = await firebaseService.finishExamSession(activeSession.id, stats);
          setActiveSession(finishedSession);
          setScreenMode('result');
          onRefreshData(); // sync global problems
        }
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const poolCount = getExamProblemPool().length;

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div id="exam-screen-panel">
      
      {/* A. SETUP CONFIGURATION VIEW */}
      {screenMode === 'config' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-sans text-xl font-semibold tracking-tight text-gray-900">암기형 앱 내 시험</h2>
            <p className="text-xs text-gray-500 mt-1">인쇄 없이 모바일 또는 화면 속에서 답지를 가린 채 퀴즈를 풀고 즉석에서 X / △ / ✓ 회독 평가를 수행합니다.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filter setup column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-4">
                <span className="font-sans font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                  <Settings size={13} className="text-gray-400" />
                  스피드 퀴즈 출제 범위 필터
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Folder */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">출제 폴더</span>
                    <select
                      value={selectedFolderId || ''}
                      onChange={(e) => setSelectedFolderId(e.target.value || null)}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="">전체 보관함</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">출제 난이도</span>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="">전체 난이도</option>
                      <option value="HIGH">상 (킬러문항)</option>
                      <option value="MEDIUM">중 (준킬러)</option>
                      <option value="LOW">하 (일반문항)</option>
                    </select>
                  </div>

                  {/* Special targeting */}
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">출제 우선 대상 설정</span>
                    <select
                      value={targetingFilter}
                      onChange={(e) => setTargetingFilter(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="ALL">전체 문제에서 출제</option>
                      <option value="ONLY_X">과거 틀린 평가(X)가 적어도 1회 있는 문항 우선</option>
                      <option value="ONLY_TRIANGLE">과거 애매함(△)이 적어도 1회 있는 문항 우선</option>
                      <option value="X_AND_TRIANGLE">X 또는 △ 기록이 있어 복습이 시급한 문항 우선</option>
                      <option value="NEVER_PLAYED">아직 한 번도 채점하지 않은 새 문항만</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* General Speed Quiz list of past sessions */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-3">
                <span className="font-sans font-bold text-xs text-gray-800 uppercase tracking-wider block mb-1">
                  과거 시험 응시 이력 ({examSessions.length}회)
                </span>

                {examSessions.length === 0 ? (
                  <div className="text-xs text-gray-400 py-8 text-center border border-dashed border-gray-200 rounded-lg">정답 이력이 아직 없습니다.</div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[180px] overflow-y-auto">
                    {[...examSessions]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map(session => (
                        <div 
                          key={session.id}
                          onClick={() => {
                            setHistorySessionId(session.id);
                            setScreenMode('history');
                          }}
                          className="py-3 px-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between text-xs transition-colors rounded-lg"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-gray-800 block truncate">{session.examName}</span>
                            <span className="text-[10px] text-gray-400">{formatDate(session.createdAt)} • 문항 수 {session.problemIds.length}개</span>
                          </div>
                          {session.finished && session.resultStats && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] px-1.5 py-0.5 font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-150">✓ {session.resultStats.checkCount}</span>
                              <span className="text-[9px] px-1.5 py-0.5 font-bold rounded bg-red-50 text-red-700 border border-red-150 font-semibold">X {session.resultStats.xCount}</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick launch play setting panel */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-4">
              <span className="font-sans font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <Play size={13} className="text-gray-400 animate-pulse" />
                시험 생성 및 시작
              </span>

              {/* Number of questions */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-700 block">시험 문항 개수</label>
                <select
                  value={limitCount}
                  onChange={(e) => setLimitCount(parseInt(e.target.value))}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value={3}>3 문항 스피드</option>
                  <option value={5}>5 문항</option>
                  <option value={10}>10 문항 (추천)</option>
                  <option value={20}>20 문항 모의고사</option>
                </select>
              </div>

              {/* Order */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-700 block">문제 정렬 규칙</label>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-xs">
                  <button
                    onClick={() => setOrderType('random')}
                    className={`flex-1 text-xs py-2 cursor-pointer ${orderType === 'random' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 font-semibold'}`}
                  >
                    무작위 출제
                  </button>
                  <button
                    onClick={() => setOrderType('sequential')}
                    className={`flex-1 text-xs py-2 cursor-pointer ${orderType === 'sequential' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 font-semibold'}`}
                  >
                    순서대로 출제
                  </button>
                </div>
              </div>

              {/* Live Info summary */}
              <div className="p-3 bg-gray-50 border border-gray-100 text-xs text-gray-500 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span>출제 가능한 전체 대상:</span>
                  <strong className="text-gray-800">{poolCount}개 문항</strong>
                </div>
                <div className="flex justify-between">
                  <span>금일 최종 시험 문항:</span>
                  <strong className="text-blue-600 font-bold">{Math.min(poolCount, limitCount)}개 문항</strong>
                </div>
              </div>

              <button
                onClick={handleStartExam}
                disabled={poolCount === 0}
                className="w-full py-3.5 bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 border border-blue-600 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm rounded-xl disabled:bg-gray-200 disabled:border-gray-200 transition-colors"
              >
                <Play size={14} /> 암기 스피드 퀴즈 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. ACTIVE QUIZ GAME LOOP (Step 10) */}
      {screenMode === 'playing' && activeSession && (
        <div className="max-w-2xl mx-auto space-y-6 py-4">
          
          {/* Header Progress indicator */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
            <button
              onClick={() => {
                if (window.confirm('시험 도중 종료하면 현재 문항까지의 평가 결과만 저장됩니다. 종료하시겠습니까?')) {
                  setScreenMode('config');
                }
              }}
              className="text-gray-400 hover:text-gray-900 flex items-center gap-1 cursor-pointer font-semibold"
            >
              <ArrowLeft size={13} /> 중도 그만두기
            </button>
            
            <div className="font-bold text-gray-700 font-sans">
              질문 {currentIndex + 1} / {activeSession.problemIds.length}
            </div>

            <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300 rounded-full" 
                style={{ width: `${((currentIndex + 1) / activeSession.problemIds.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Core Problem sliding container */}
          {(() => {
            const probId = activeSession.problemIds[currentIndex];
            const prob = problems.find(p => p.id === probId);

            if (!prob) return <div className="text-xs text-gray-400 text-center">오류: 문제 데이터를 찾을 수 없습니다.</div>;

            return (
              <div className="space-y-6">
                
                {/* Visual Area */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-4">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-2.5">
                    <h3 className="text-xs font-bold text-gray-800 truncate">{prob.title}</h3>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">난이도: {prob.difficulty === 'HIGH' ? '상' : prob.difficulty === 'MEDIUM' ? '중' : '하'}</span>
                  </div>

                  {/* Problem main visual question */}
                  {!revealAnswer ? (
                    <div className="space-y-4">
                      <div className="text-xs text-gray-500 font-semibold bg-gray-50 p-3.5 text-center border border-gray-100 border-dashed rounded-lg">
                        🤔 머릿속으로 풀이 식이나 답안을 연상해낸 뒤 하단의 [답안 및 해설 보기]를 눌러 확인하세요.
                      </div>
                      <div className="bg-gray-50/50 p-3 border border-gray-100 rounded-xl flex justify-center">
                        <img 
                          src={getProblemImageSrc(prob.problemImageUrls[0])} 
                          alt="Question" 
                          className="max-h-[300px] object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Revealed Answer panel */
                    <div className="space-y-4 animate-fade-in">
                      <div className="text-xs text-emerald-600 font-semibold bg-emerald-50/50 p-3.5 text-center border border-emerald-100 border-dashed rounded-lg">
                        🎯 나의 답과 해설을 상호비교한 뒤 아래 평가 점수(X / △ / ✓)를 선택해 이력을 갱신하세요.
                      </div>
                      <div className="bg-gray-50/50 p-3 border border-gray-100 rounded-xl flex flex-col items-center justify-center space-y-3">
                        <img 
                          src={getProblemImageSrc(prob.solutionImageUrls[0])} 
                          alt="Solution Answer Key" 
                          className="max-h-[280px] object-contain border border-gray-200 bg-white rounded-lg"
                        />
                        {prob.memo && (
                          <div className="w-full text-xs bg-white border border-gray-100 p-3 text-gray-600 rounded-lg leading-relaxed shadow-xs">
                            <strong className="text-gray-800 block text-[10px] mb-1 font-bold">나의 오답 노트 핵심 메모:</strong>
                            {prob.memo}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Control Actions (Revel answer OR choose grading results) */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex flex-col gap-3">
                  {!revealAnswer ? (
                    <button
                      onClick={() => setRevealAnswer(true)}
                      className="w-full py-3.5 bg-gray-900 hover:bg-black text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 rounded-xl transition-all shadow-sm"
                    >
                      <Eye size={14} /> 정답 및 해설지 보기
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block text-center">자가 평가 기록하기 (CHECK 즉시 체화완료)</span>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {/* Grade X */}
                        <button
                          onClick={() => handleGradeQuiz('X')}
                          className="py-3.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition-all text-xs font-bold cursor-pointer rounded-xl"
                        >
                          틀림 (X)
                        </button>

                        {/* Grade Triangle */}
                        <button
                          onClick={() => handleGradeQuiz('TRIANGLE')}
                          className="py-3.5 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-500 hover:text-white transition-all text-xs font-bold cursor-pointer rounded-xl"
                        >
                          아리송 (△)
                        </button>

                        {/* Grade Check (Mastered) */}
                        <button
                          onClick={() => handleGradeQuiz('CHECK')}
                          className="py-3.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold cursor-pointer rounded-xl"
                        >
                          완벽 이해 (✓)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })()}
        </div>
      )}

      {/* C. END EXAM SESSION STATS SUMMARY */}
      {screenMode === 'result' && activeSession && activeSession.resultStats && (
        <div className="max-w-md mx-auto bg-white border border-gray-200 p-8 rounded-xl shadow-md text-center space-y-6">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Award size={24} />
            </div>
            <h2 className="font-sans text-lg font-bold text-gray-900 tracking-tight">수고하셨습니다! 시험 완료</h2>
            <p className="text-xs text-gray-400">{activeSession.examName}</p>
          </div>

          {/* Quick Metrics grid */}
          <div className="grid grid-cols-3 gap-3.5 py-4 border-y border-gray-100 text-center">
            <div className="bg-emerald-50/50 p-3 border border-emerald-100 rounded-xl">
              <span className="text-[9px] text-emerald-600 block font-bold">완벽 (✓)</span>
              <strong className="text-emerald-700 text-lg">{activeSession.resultStats.checkCount}개</strong>
            </div>
            <div className="bg-amber-50/50 p-3 border border-amber-100 rounded-xl">
              <span className="text-[9px] text-amber-600 block font-bold">아리송 (△)</span>
              <strong className="text-amber-700 text-lg">{activeSession.resultStats.triangleCount}개</strong>
            </div>
            <div className="bg-red-50/50 p-3 border border-red-100 rounded-xl">
              <span className="text-[9px] text-red-600 block font-bold">틀림 (X)</span>
              <strong className="text-red-700 text-lg">{activeSession.resultStats.xCount}개</strong>
            </div>
          </div>

          {/* Master achievements */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">전체 문항 개수:</span>
              <strong className="text-gray-800">{activeSession.resultStats.total}문항</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">새롭게 체화 완료된 문제 (✓):</span>
              <strong className="text-emerald-600">+{activeSession.resultStats.newMasteredCount}개</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">오답노트에 남겨진 잔여 복습 대상:</span>
              <strong className="text-red-600">{activeSession.resultStats.remainingReviewCount}개</strong>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setScreenMode('config')}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer border border-gray-200 rounded-xl transition-all"
            >
              종료 및 범위 변경
            </button>
            <button
              onClick={handleStartExam}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 text-xs font-semibold cursor-pointer rounded-xl transition-all"
            >
              같은 필터로 재도전
            </button>
          </div>
        </div>
      )}

      {/* D. PAST HISTORY VIEWING CARD */}
      {screenMode === 'history' && (
        <div className="max-w-2xl mx-auto space-y-6 py-4">
          {(() => {
            const histSession = examSessions.find(s => s.id === historySessionId);
            if (!histSession) return <div className="text-center text-xs text-gray-400">기록을 찾을 수 없습니다.</div>;

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setHistorySessionId(null);
                      setScreenMode('config');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <ArrowLeft size={13} /> 목록으로 돌아가기
                  </button>
                  <span className="text-[10px] text-gray-400">{formatDate(histSession.createdAt)} 응시</span>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-4">
                  <h3 className="font-sans font-bold text-gray-800 text-sm">{histSession.examName} 상세 오답 채점표</h3>
                  
                  {histSession.resultStats && (
                    <div className="grid grid-cols-3 gap-2.5 text-center text-xs pt-3 border-t border-gray-100">
                      <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg border border-emerald-100 font-bold">✓ (체화) : {histSession.resultStats.checkCount}개</div>
                      <div className="bg-amber-50 text-amber-700 p-2.5 rounded-lg border border-amber-100 font-bold">△ (아리송) : {histSession.resultStats.triangleCount}개</div>
                      <div className="bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-100 font-bold">X (틀림) : {histSession.resultStats.xCount}개</div>
                    </div>
                  )}
                </div>

                {/* List of graded problem rows */}
                <div className="space-y-3">
                  {histSession.problemIds.map((pId, idx) => {
                    const prob = problems.find(p => p.id === pId);
                    const grade = histSession.evaluations[pId];

                    if (!prob) return null;

                    return (
                      <div 
                        key={pId}
                        className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs flex items-center justify-between text-xs cursor-pointer hover:border-blue-400 transition-all duration-150"
                        onClick={() => onSelectProblem(prob)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-400">#{idx + 1}</span>
                          <span className="font-bold text-gray-800 truncate">{prob.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-[9px] font-bold rounded ${
                            grade === 'CHECK' ? 'bg-emerald-500 text-white' : grade === 'TRIANGLE' ? 'bg-amber-500 text-white' : grade === 'X' ? 'bg-red-500 text-white' : 'bg-gray-150 text-gray-400'
                          }`}>
                            {grade === 'CHECK' ? '✓ (체화 완료)' : grade === 'TRIANGLE' ? '△ (미체화)' : grade === 'X' ? 'X (미체화)' : '미채점'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}
