/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Problem, ReviewSession, ExamSession } from '../types';
import { 
  FileText, 
  Layers, 
  BookmarkCheck, 
  Camera, 
  Plus, 
  FilePlus2, 
  Activity,
  History,
  TrendingUp,
  Brain,
  FolderOpen
} from 'lucide-react';
import { getProblemImageSrc } from '../utils/placeholders';

interface DashboardProps {
  problems: Problem[];
  reviewSessions: ReviewSession[];
  examSessions: ExamSession[];
  onNavigate: (tab: string, arg?: any) => void;
  onSelectProblem: (problem: Problem) => void;
}

export default function Dashboard({ 
  problems, 
  reviewSessions, 
  examSessions, 
  onNavigate,
  onSelectProblem
}: DashboardProps) {
  
  // Calculate summary metrics
  const totalCount = problems.length;
  const masteredCount = problems.filter(p => p.mastered).length;
  const reviewNeededCount = totalCount - masteredCount;

  // Recent data
  const recentProblems = [...problems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentPdfs = [...reviewSessions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentExams = [...examSessions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div id="dashboard-tab-content" className="space-y-6">
      {/* Title & Slogan */}
      <div>
        <h2 className="font-sans text-xl font-semibold tracking-tight text-gray-900">학습 대시보드</h2>
        <p className="text-xs text-gray-500 mt-1">틀린 문제를 기록하고 반복하여 체화 완료(✓)로 만들어내세요.</p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div id="metric-total-problems" className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between shadow-sm hover:border-blue-400 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">전체 보관 문제</span>
            <div className="font-sans text-2xl font-bold text-gray-900">{totalCount}개</div>
          </div>
          <div className="p-3 bg-gray-50 text-gray-400 border border-gray-100 rounded-full w-12 h-12 flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        {/* Metric 2 */}
        <div id="metric-review-needed" className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between shadow-sm hover:border-blue-400 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">복습 필요 (X/△)</span>
            <div className="font-sans text-2xl font-bold text-orange-600">{reviewNeededCount}개</div>
          </div>
          <div className="p-3 bg-orange-50 text-orange-500 border border-orange-100 rounded-full w-12 h-12 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>

        {/* Metric 3 */}
        <div id="metric-mastered" className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between shadow-sm hover:border-blue-400 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">체화 완료</span>
            <div className="font-sans text-2xl font-bold text-green-600">{masteredCount}개</div>
          </div>
          <div className="p-3 bg-green-50 text-green-500 border border-green-100 rounded-full w-12 h-12 flex items-center justify-center">
            <BookmarkCheck size={20} />
          </div>
        </div>
      </div>

      {/* Fast Action Buttons */}
      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
        <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-gray-500 mb-4">빠른 실행 메뉴</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Btn 1 */}
          <button 
            id="quick-shoot-btn"
            onClick={() => onNavigate('register', { triggerCamera: true })}
            className="group flex items-center gap-3.5 p-4 bg-gray-50/50 border border-gray-200 text-left hover:bg-white hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer rounded-xl"
          >
            <div className="p-2.5 bg-white text-gray-500 border border-gray-200 rounded-lg group-hover:text-blue-600 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-colors">
              <Camera size={16} />
            </div>
            <div>
              <div className="font-bold text-xs text-gray-800">문제 촬영</div>
              <div className="text-[10px] text-gray-400 mt-0.5">카메라 크롭 등록</div>
            </div>
          </button>

          {/* Btn 2 */}
          <button 
            id="quick-add-btn"
            onClick={() => onNavigate('register', { triggerUpload: true })}
            className="group flex items-center gap-3.5 p-4 bg-gray-50/50 border border-gray-200 text-left hover:bg-white hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer rounded-xl"
          >
            <div className="p-2.5 bg-white text-gray-500 border border-gray-200 rounded-lg group-hover:text-blue-600 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-colors">
              <Plus size={16} />
            </div>
            <div>
              <div className="font-bold text-xs text-gray-800">문제 추가</div>
              <div className="text-[10px] text-gray-400 mt-0.5">이미지 업로드 등록</div>
            </div>
          </button>

          {/* Btn 3 */}
          <button 
            id="quick-pdf-btn"
            onClick={() => onNavigate('pdf')}
            className="group flex items-center gap-3.5 p-4 bg-gray-50/50 border border-gray-200 text-left hover:bg-white hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer rounded-xl"
          >
            <div className="p-2.5 bg-white text-gray-500 border border-gray-200 rounded-lg group-hover:text-blue-600 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-colors">
              <FilePlus2 size={16} />
            </div>
            <div>
              <div className="font-bold text-xs text-gray-800">PDF 만들기</div>
              <div className="text-[10px] text-gray-400 mt-0.5">선택 문항 인쇄 생성</div>
            </div>
          </button>

          {/* Btn 4 */}
          <button 
            id="quick-exam-btn"
            onClick={() => onNavigate('exam')}
            className="group flex items-center gap-3.5 p-4 bg-gray-50/50 border border-gray-200 text-left hover:bg-white hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer rounded-xl"
          >
            <div className="p-2.5 bg-white text-gray-500 border border-gray-200 rounded-lg group-hover:text-blue-600 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-colors">
              <Brain size={16} />
            </div>
            <div>
              <div className="font-bold text-xs text-gray-800">앱 내 시험 시작</div>
              <div className="text-[10px] text-gray-400 mt-0.5">암기 문항 스피드 퀴즈</div>
            </div>
          </button>
        </div>
      </div>

      {/* Grid for details lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Problems Column */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex flex-col h-[340px] hover:border-gray-300 transition-all duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <span className="font-sans font-bold text-sm text-gray-800 flex items-center gap-1.5">
              <FolderOpen size={16} className="text-gray-400" />
              최근 추가한 문제
            </span>
            <button 
              id="view-all-cabinet-btn"
              onClick={() => onNavigate('cabinet')} 
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              더보기
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {recentProblems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                등록된 문제가 없습니다.
              </div>
            ) : (
              recentProblems.map(p => (
                <div 
                  key={p.id}
                  onClick={() => onSelectProblem(p)}
                  className="flex items-center gap-3 p-2.5 hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer rounded-lg"
                >
                  <img 
                    src={getProblemImageSrc(p.problemImageUrls[0])} 
                    alt="Problem Thumbnail" 
                    className="w-10 h-10 object-cover border border-gray-200 rounded-md flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-800 truncate">{p.title}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${
                        p.problemType === 'SOLVING' 
                          ? 'bg-purple-50 text-purple-700 border-purple-100' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {p.problemType === 'SOLVING' ? '풀이형' : '암기형'}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${
                        p.mastered 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {p.mastered ? '체화완료' : '미체화'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent PDF Sessions Column */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex flex-col h-[340px] hover:border-gray-300 transition-all duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <span className="font-sans font-bold text-sm text-gray-800 flex items-center gap-1.5">
              <FileText size={16} className="text-gray-400" />
              최근 생성한 PDF
            </span>
            <button 
              id="view-all-pdfs-btn"
              onClick={() => onNavigate('pdfSessions')} 
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              전체 세션
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {recentPdfs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                생성된 PDF 복습 세션이 없습니다.
              </div>
            ) : (
              recentPdfs.map(session => {
                const totalProblems = session.problemIds.length;
                const evaluatedCount = Object.values(session.evaluations).filter(v => v !== null).length;
                const progress = totalProblems > 0 ? Math.round((evaluatedCount / totalProblems) * 100) : 0;

                return (
                  <div 
                    key={session.id}
                    onClick={() => onNavigate('pdfSessions', { sessionId: session.id })}
                    className="p-3 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/80 transition-all cursor-pointer rounded-lg"
                  >
                    <div className="text-xs font-semibold text-gray-800 truncate mb-1">{session.pdfName}</div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>문항 수: {totalProblems}개</span>
                      <span>{formatDate(session.createdAt)}</span>
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[9px] text-gray-400 mb-0.5 font-medium">
                        <span>복습 진행률</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Exam Sessions Column */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex flex-col h-[340px] hover:border-gray-300 transition-all duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <span className="font-sans font-bold text-sm text-gray-800 flex items-center gap-1.5">
              <History size={16} className="text-gray-400" />
              최근 앱 내 시험
            </span>
            <button 
              id="view-all-exams-btn"
              onClick={() => onNavigate('examHistory')} 
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              전체 이력
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {recentExams.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                완료된 앱 내 시험 기록이 없습니다.
              </div>
            ) : (
              recentExams.map(session => (
                <div 
                  key={session.id}
                  onClick={() => onNavigate('examHistory', { sessionId: session.id })}
                  className="p-3 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/80 transition-all cursor-pointer rounded-lg"
                >
                  <div className="text-xs font-semibold text-gray-800 truncate mb-1">{session.examName}</div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>문항 수: {session.problemIds.length}개</span>
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                  {session.finished && session.resultStats && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">✓ {session.resultStats.checkCount}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-100 font-semibold">△ {session.resultStats.triangleCount}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-50 text-red-700 border border-red-100">X {session.resultStats.xCount}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
