/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ReviewSession, Problem, EvaluationResult } from '../types';
import { 
  FileText, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Eye, 
  BookmarkCheck,
  TrendingUp,
  Award,
  Printer,
  Info
} from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { getProblemImageSrc } from '../utils/placeholders';

interface PdfSessionDetailProps {
  sessions: ReviewSession[];
  problems: Problem[];
  initialActiveSessionId: string | null;
  onSelectProblem: (problem: Problem) => void;
  onRefreshData: () => void;
}

export default function PdfSessionDetail({
  sessions,
  problems,
  initialActiveSessionId,
  onSelectProblem,
  onRefreshData
}: PdfSessionDetailProps) {
  // Navigation: List sessions vs Active detailed session
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialActiveSessionId);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleBackToList = () => {
    setActiveSessionId(null);
    setShowPrintPreview(false);
  };

  // Immediate Grading (Step 9)
  const handleGradeProblem = async (problemId: string, result: EvaluationResult) => {
    if (!activeSessionId) return;
    try {
      await firebaseService.updateReviewSessionEvaluation(activeSessionId, problemId, result);
      onRefreshData(); // trigger global refresh to recalculate stats and master statuses
    } catch (e: any) {
      alert('저장 실패: ' + e.message);
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (showPrintPreview && activeSession) {
    return (
      <div id="print-sheet-canvas" className="bg-white min-h-screen text-black p-8 font-serif leading-relaxed">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Action Bar (Hidden in native printing via custom css style) */}
          <div id="print-action-header" className="flex items-center justify-between p-4.5 bg-gray-55 border border-gray-200 rounded-xl mb-8 print:hidden shadow-sm">
            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Eye size={14} />
              인쇄용 흑백 고화질 미리보기 화면
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2 border border-gray-200 text-xs font-semibold bg-white cursor-pointer hover:bg-gray-50 rounded-lg transition-all text-gray-800"
              >
                수정하러 돌아가기
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white border border-blue-600 text-xs font-semibold cursor-pointer hover:bg-blue-700 rounded-lg transition-all shadow-sm"
              >
                기기 인쇄 (또는 PDF 저장)
              </button>
            </div>
          </div>

          {/* Test Header */}
          <div className="text-center space-y-2 pb-6 border-b-2 border-double border-black">
            <h1 className="text-2xl font-bold font-serif uppercase tracking-wider">{activeSession.pdfName}</h1>
            <div className="flex items-center justify-center gap-12 text-sm">
              <span>성명: __________________</span>
              <span>오답 회독 복습 평가 지본</span>
            </div>
          </div>

          {/* Problems list */}
          <div className="space-y-12">
            {activeSession.problemIds.map((probId, idx) => {
              const prob = problems.find(p => p.id === probId);
              if (!prob) return null;

              return (
                <div 
                  key={prob.id} 
                  className="page-break-avoid mb-8 border-b border-gray-100 pb-6"
                  style={{ pageBreakInside: 'avoid' }}
                >
                  {/* Header line */}
                  <div className="flex items-start justify-between font-bold text-xs mb-3 border-b border-black pb-1">
                    <span>
                      [문항 {idx + 1}] {prob.title}
                    </span>
                    <span className="font-normal text-[10px] text-gray-500">
                      ({prob.difficulty === 'HIGH' ? '상' : prob.difficulty === 'MEDIUM' ? '중' : '하'})
                    </span>
                  </div>

                  {/* Problem Image scaled */}
                  <div className="flex justify-start bg-white py-2">
                    <img
                      src={getProblemImageSrc(prob.problemImageUrls[0])}
                      alt={`Problem ${idx + 1}`}
                      className="w-full object-contain filter grayscale contrast-125 max-h-[260px]"
                    />
                  </div>

                  {/* Handwriting Solve area dotted box */}
                  <div 
                    style={{ height: '180px' }}
                    className="w-full mt-4 border border-dashed border-gray-300 relative bg-linear bg-[linear-gradient(to_bottom,transparent_95%,%23e5e7eb_95%)] bg-[size:100%_24px]"
                  >
                    <span className="absolute top-1.5 left-2 text-[9px] text-gray-400 font-sans uppercase tracking-widest select-none">
                      풀이 및 서술 공간 (Handwriting Space)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Print Footer */}
          <div className="text-center text-xs text-gray-400 pt-12 border-t border-gray-100">
            - {activeSession.pdfName} 수험 학습지 종료 - 
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="pdf-sessions-panel" className="space-y-6">
      
      {/* 1. SESSIONS LIST VIEW */}
      {!activeSession ? (
        <div className="space-y-4">
          <div>
            <h2 className="font-sans text-xl font-semibold tracking-tight text-gray-900">PDF 복습 세션 관리</h2>
            <p className="text-xs text-gray-500 mt-1">출력하여 학습한 실물 PDF의 정답 결과를 평가하고 회독 기록을 업데이트하는 보관소입니다.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {sessions.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-400">
                생성된 PDF 복습 세션 기록이 없습니다. 상단 'PDF 만들기' 탭에서 복습지를 먼저 출력해 보세요!
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {[...sessions]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(session => {
                    const totalCount = session.problemIds.length;
                    const gradedCount = Object.values(session.evaluations).filter(v => v !== null).length;
                    const progressPercent = totalCount > 0 ? Math.round((gradedCount / totalCount) * 100) : 0;

                    return (
                      <div 
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className="p-5 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="text-sm font-bold text-gray-800 truncate flex items-center gap-1.5">
                            <FileText size={16} className="text-gray-400" />
                            {session.pdfName}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-semibold">
                            <span>문항 개수: <strong className="text-gray-750 font-bold">{totalCount}개</strong></span>
                            <span>•</span>
                            <span>생성일: {formatDate(session.createdAt)}</span>
                          </div>

                          {/* Progress Line */}
                          <div className="w-full max-w-md pt-1">
                            <div className="flex items-center justify-between text-[9px] text-gray-400 mb-0.5 font-bold">
                              <span>복습 및 채점 진행률</span>
                              <span>{gradedCount}/{totalCount} 문항 ({progressPercent}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden border border-gray-50/50">
                              <div 
                                className={`h-full transition-all duration-300 rounded-full ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-gray-400">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2. SPECIFIC SESSION EVALUATION CHECKLIST (Step 9) */
        <div className="space-y-6">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToList}
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 cursor-pointer font-semibold"
            >
              <ArrowLeft size={14} /> 목록으로 돌아가기
            </button>
            <span className="text-[10px] text-gray-400 font-medium">세션 고유 ID: {activeSession.id}</span>
          </div>

          {/* Title and Progress Card */}
          <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-sans text-lg font-bold text-gray-800 tracking-tight">{activeSession.pdfName}</h2>
                <p className="text-xs text-gray-400 mt-1">생성일자: {formatDate(activeSession.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPrintPreview(true);
                  setTimeout(() => {
                    window.print();
                  }, 500);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm self-start sm:self-auto cursor-pointer"
              >
                <Printer size={13} /> 실물 PDF 다운로드 / 인쇄
              </button>
            </div>

            {/* Calculations progress */}
            {(() => {
              const totalCount = activeSession.problemIds.length;
              const gradedCount = Object.values(activeSession.evaluations).filter(v => v !== null).length;
              const progressPercent = totalCount > 0 ? Math.round((gradedCount / totalCount) * 100) : 0;
              const checkCount = Object.values(activeSession.evaluations).filter(v => v === 'CHECK').length;
              const triangleCount = Object.values(activeSession.evaluations).filter(v => v === 'TRIANGLE').length;
              const xCount = Object.values(activeSession.evaluations).filter(v => v === 'X').length;

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3.5 border-t border-gray-100">
                  {/* Progress circle bar */}
                  <div className="md:col-span-2 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">세션 전체 채점 완료율</span>
                    <div className="text-lg font-bold text-gray-800">{progressPercent}% 완료</div>
                    <div className="w-full bg-gray-100 h-2 mt-1 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all rounded-full" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  {/* Summary counters */}
                  <div className="grid grid-cols-3 gap-2.5 md:col-span-2 text-center">
                    <div className="bg-emerald-50/40 p-2.5 border border-emerald-150 rounded-xl">
                      <span className="text-[9px] text-emerald-600 block font-bold">✓ (체화)</span>
                      <strong className="text-emerald-700 text-sm font-bold">{checkCount}개</strong>
                    </div>
                    <div className="bg-amber-50/40 p-2.5 border border-amber-150 rounded-xl">
                      <span className="text-[9px] text-amber-600 block font-bold">△ (불안)</span>
                      <strong className="text-amber-700 text-sm font-bold">{triangleCount}개</strong>
                    </div>
                    <div className="bg-red-50/40 p-2.5 border border-red-150 rounded-xl">
                      <span className="text-[9px] text-red-600 block font-bold">X (틀림)</span>
                      <strong className="text-red-700 text-sm font-bold">{xCount}개</strong>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Problems Evaluation Checklist list */}
          <div className="space-y-4">
            <h3 className="font-sans font-bold text-xs text-gray-800 uppercase tracking-wider">포함 문항 채점지</h3>
            
            <div className="space-y-3">
              {activeSession.problemIds.map((probId, idx) => {
                const prob = problems.find(p => p.id === probId);
                const currentGrading = activeSession.evaluations[probId];

                if (!prob) {
                  return (
                    <div key={probId} className="bg-gray-50 p-4 text-xs text-gray-400 rounded-xl border border-gray-150">
                      삭제된 문제 데이터입니다.
                    </div>
                  );
                }

                return (
                  <div 
                    key={prob.id} 
                    className="bg-white border border-gray-200 p-4.5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-blue-400 transition-all shadow-xs"
                  >
                    {/* Thumbnail & Description */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-gray-50 border border-gray-150 overflow-hidden flex-shrink-0 rounded-lg">
                        <img src={getProblemImageSrc(prob.problemImageUrls[0])} className="w-full h-full object-cover rounded-lg" />
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-bold text-xs text-gray-500">
                          <span>문항 {idx + 1}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            prob.difficulty === 'HIGH' ? 'text-red-500' : prob.difficulty === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                          }`}>
                            ({prob.difficulty === 'HIGH' ? '상' : prob.difficulty === 'MEDIUM' ? '중' : '하'})
                          </span>
                        </div>
                        <div 
                          onClick={() => onSelectProblem(prob)}
                          className="text-xs font-bold text-gray-800 truncate hover:text-blue-600 cursor-pointer mt-0.5"
                        >
                          {prob.title}
                        </div>
                        <div className="flex gap-1.5 mt-1 font-semibold">
                          {prob.tags.slice(0, 2).map((t, i) => (
                            <span key={i} className="text-[9px] text-gray-400">#{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Step 9 Buttons: X / △ / ✓ grading directly */}
                    <div className="flex items-center gap-2 justify-end">
                      {/* X Button */}
                      <button
                        onClick={() => handleGradeProblem(prob.id, 'X')}
                        className={`w-10 h-10 text-sm font-bold border transition-all cursor-pointer flex items-center justify-center rounded-xl ${
                          currentGrading === 'X' 
                            ? 'bg-red-500 text-white border-red-500 shadow-sm' 
                            : 'bg-white text-red-500 border-red-150 hover:bg-red-50'
                        }`}
                      >
                        X
                      </button>

                      {/* Triangle Button */}
                      <button
                        onClick={() => handleGradeProblem(prob.id, 'TRIANGLE')}
                        className={`w-10 h-10 text-sm font-bold border transition-all cursor-pointer flex items-center justify-center rounded-xl ${
                          currentGrading === 'TRIANGLE' 
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                            : 'bg-white text-amber-500 border-amber-150 hover:bg-amber-50'
                        }`}
                      >
                        △
                      </button>

                      {/* Check/Mastered Button (This triggers immediate master logic) */}
                      <button
                        onClick={() => handleGradeProblem(prob.id, 'CHECK')}
                        className={`w-10 h-10 text-sm font-bold border transition-all cursor-pointer flex items-center justify-center rounded-xl ${
                          currentGrading === 'CHECK' 
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' 
                            : 'bg-white text-emerald-500 border-emerald-150 hover:bg-emerald-50'
                        }`}
                      >
                        ✓
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
