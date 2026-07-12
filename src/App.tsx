/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Folder, 
  Problem, 
  ReviewSession, 
  ExamSession, 
  UserPlan, 
  ProblemType 
} from './types';
import { firebaseService } from './services/firebase';

// Components
import Dashboard from './components/Dashboard';
import Cabinet from './components/Cabinet';
import ProblemRegister from './components/ProblemRegister';
import ProblemDetail from './components/ProblemDetail';
import PdfGenerator from './components/PdfGenerator';
import PdfSessionDetail from './components/PdfSessionDetail';
import ExamScreen from './components/ExamScreen';
import StorageUsage from './components/StorageUsage';

// Icons
import { 
  LayoutDashboard, 
  FolderHeart, 
  Camera, 
  FileText, 
  History, 
  BrainCircuit, 
  Activity, 
  Sparkles, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Settings,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Sync States
  const [problems, setProblems] = useState<Problem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [pdfSessions, setPdfSessions] = useState<ReviewSession[]>([]);
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [plan, setPlan] = useState<UserPlan>('FREE');

  // Trigger Action states from other screens
  const [triggerCamera, setTriggerCamera] = useState(false);
  const [triggerUpload, setTriggerUpload] = useState(false);
  const [selectedExamSessionId, setSelectedExamSessionId] = useState<string | null>(null);

  // Expanded Active Inspecting Problem Modal
  const [inspectingProblem, setInspectingProblem] = useState<Problem | null>(null);

  // Sync / Load hook
  const loadWorkspaceData = () => {
    setProblems(firebaseService.getProblemsSync());
    setFolders(firebaseService.getFoldersSync());
    setPdfSessions(firebaseService.getReviewSessionsSync());
    setExamSessions(firebaseService.getExamSessionsSync());
    setPlan(firebaseService.getCurrentUser()?.plan || 'FREE');
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  const handleRefreshGlobalData = () => {
    loadWorkspaceData();
  };

  // Switch plans
  const handleTogglePlan = (newPlan: UserPlan) => {
    firebaseService.updateUserPlan(newPlan);
    setPlan(newPlan);
  };

  // Quick Action navigations
  const handleTriggerRegisterFlow = (source: 'camera' | 'upload') => {
    if (source === 'camera') {
      setTriggerCamera(true);
      setTriggerUpload(false);
    } else {
      setTriggerUpload(true);
      setTriggerCamera(false);
    }
    setActiveTab('register');
  };

  const handleStartExamFromSelection = (session: ExamSession) => {
    setSelectedExamSessionId(session.id);
    setActiveTab('exam');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-600">
      
      {/* 1. TOP HEADER BRAND BAR */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center font-bold tracking-tight rounded-lg shadow-sm select-none">
              오
            </div>
            <div>
              <h1 className="font-sans text-sm font-semibold text-gray-900 tracking-tight leading-tight">
                개인 오답노트 & 회독 관리 비서
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">Smart AI Wrong Answer Review Notebook</p>
            </div>
          </div>

          {/* Premium Plan Pill indicator */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-medium block">구독 플랜 등급</span>
              <span className={`text-xs font-semibold ${plan === 'PREMIUM' ? 'text-blue-600' : 'text-gray-500'}`}>
                {plan === 'PREMIUM' ? '✨ 프리미엄 무제한 클라우드' : '무료 기본 플랜 (용량제한)'}
              </span>
            </div>
            
            <button
              onClick={() => handleTogglePlan(plan === 'FREE' ? 'PREMIUM' : 'FREE')}
              className="text-[10px] bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              플랜 전환
            </button>
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden text-gray-500 p-1 cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar Panel (Desktop) */}
        <aside className="hidden md:block w-60 flex-shrink-0 space-y-6">
          <nav className="space-y-1 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
            
            <span className="px-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2 mt-1">대시보드</span>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all cursor-pointer rounded-lg ${
                activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard size={14} /> 학습 현황판
            </button>

            <span className="px-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2 pt-3">오답 오거나이저</span>
            <button
              onClick={() => setActiveTab('cabinet')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all cursor-pointer rounded-lg ${
                activeTab === 'cabinet' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <FolderHeart size={14} /> 캐비닛 폴더 관리
            </button>
            <button
              onClick={() => {
                setTriggerCamera(false);
                setTriggerUpload(false);
                setActiveTab('register');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all cursor-pointer rounded-lg ${
                activeTab === 'register' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Camera size={14} /> 문제 촬영 및 추가
            </button>

            <span className="px-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2 pt-3">1. 풀이형 복습 (PDF)</span>
            <button
              onClick={() => setActiveTab('pdf-create')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all cursor-pointer rounded-lg ${
                activeTab === 'pdf-create' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <FileText size={14} /> PDF 인쇄지 만들기
            </button>
            <button
              onClick={() => setActiveTab('pdf-sessions')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all cursor-pointer rounded-lg ${
                activeTab === 'pdf-sessions' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <History size={14} /> PDF 채점 기록방
            </button>

            <span className="px-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2 pt-3">2. 암기형 복습 (앱 퀴즈)</span>
            <button
              onClick={() => {
                setSelectedExamSessionId(null);
                setActiveTab('exam');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all cursor-pointer rounded-lg ${
                activeTab === 'exam' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <BrainCircuit size={14} /> 암기형 앱 내 시험
            </button>
          </nav>

          {/* Quick Storage Meter box */}
          <StorageUsage onRefresh={handleRefreshGlobalData} />
        </aside>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border border-gray-150 p-4 space-y-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left text-xs font-semibold p-2 ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              학습 현황판 (대시보드)
            </button>
            <button
              onClick={() => { setActiveTab('cabinet'); setMobileMenuOpen(false); }}
              className={`w-full text-left text-xs font-semibold p-2 ${activeTab === 'cabinet' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              캐비닛 폴더 관리
            </button>
            <button
              onClick={() => { setActiveTab('register'); setMobileMenuOpen(false); }}
              className={`w-full text-left text-xs font-semibold p-2 ${activeTab === 'register' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              문제 촬영 및 추가
            </button>
            <button
              onClick={() => { setActiveTab('pdf-create'); setMobileMenuOpen(false); }}
              className={`w-full text-left text-xs font-semibold p-2 ${activeTab === 'pdf-create' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              PDF 인쇄지 만들기
            </button>
            <button
              onClick={() => { setActiveTab('pdf-sessions'); setMobileMenuOpen(false); }}
              className={`w-full text-left text-xs font-semibold p-2 ${activeTab === 'pdf-sessions' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              PDF 채점 기록방
            </button>
            <button
              onClick={() => { setActiveTab('exam'); setMobileMenuOpen(false); }}
              className={`w-full text-left text-xs font-semibold p-2 ${activeTab === 'exam' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              암기형 앱 내 시험
            </button>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span>구독 플랜: {plan === 'PREMIUM' ? '프리미엄 ✨' : '무료'}</span>
              <button
                onClick={() => handleTogglePlan(plan === 'FREE' ? 'PREMIUM' : 'FREE')}
                className="text-[10px] text-blue-600 hover:underline"
              >
                플랜 변경
              </button>
            </div>
          </div>
        )}

        {/* Content Panel Area */}
        <main id="app-workspace-main" className="flex-1 min-w-0">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              problems={problems}
              reviewSessions={pdfSessions}
              examSessions={examSessions}
              onNavigate={(tab, arg) => {
                if (tab === 'register') {
                  if (arg?.triggerCamera) {
                    setTriggerCamera(true);
                    setTriggerUpload(false);
                  } else if (arg?.triggerUpload) {
                    setTriggerUpload(true);
                    setTriggerCamera(false);
                  } else {
                    setTriggerCamera(false);
                    setTriggerUpload(false);
                  }
                  setActiveTab('register');
                } else if (tab === 'pdf') {
                  setActiveTab('pdf-create');
                } else if (tab === 'pdfSessions') {
                  setActiveTab('pdf-sessions');
                } else {
                  setActiveTab(tab);
                }
              }}
              onSelectProblem={setInspectingProblem}
            />
          )}

          {/* Cabinet Tab */}
          {activeTab === 'cabinet' && (
            <Cabinet 
              problems={problems}
              folders={folders}
              onSelectProblem={setInspectingProblem}
              onCreateFolder={async (name, parentId) => {
                await firebaseService.createFolder(name, parentId);
                loadWorkspaceData();
              }}
              onDeleteFolder={async (folderId) => {
                await firebaseService.deleteFolder(folderId);
                loadWorkspaceData();
              }}
              onUpdateProblemFolder={async (problemId, folderId) => {
                await firebaseService.updateProblem(problemId, { folderId });
                loadWorkspaceData();
              }}
            />
          )}

          {/* Problem Register Tab */}
          {activeTab === 'register' && (
            <ProblemRegister 
              folders={folders}
              initialTriggerCamera={triggerCamera}
              initialTriggerUpload={triggerUpload}
              onRegisterSuccess={(newProb) => {
                loadWorkspaceData();
                setTriggerCamera(false);
                setTriggerUpload(false);
              }}
              onNavigate={setActiveTab}
            />
          )}

          {/* PDF Generator Tab */}
          {activeTab === 'pdf-create' && (
            <PdfGenerator 
              problems={problems}
              folders={folders}
              onCreateSessionSuccess={(session) => {
                loadWorkspaceData();
                setActiveTab('pdf-sessions');
              }}
              onNavigate={setActiveTab}
            />
          )}

          {/* PDF Sessions grading Tab */}
          {activeTab === 'pdf-sessions' && (
            <PdfSessionDetail 
              sessions={pdfSessions}
              problems={problems}
              initialActiveSessionId={null}
              onSelectProblem={setInspectingProblem}
              onRefreshData={handleRefreshGlobalData}
            />
          )}

          {/* Speed quiz exam Tab */}
          {activeTab === 'exam' && (
            <ExamScreen 
              problems={problems}
              folders={folders}
              examSessions={examSessions}
              onRefreshData={handleRefreshGlobalData}
              onSelectProblem={setInspectingProblem}
              initialHistorySessionId={selectedExamSessionId}
            />
          )}
        </main>
      </div>

      {/* 3. WRONG ANSWER PROBLEM DETAILS MODAL INSPECT OVERLAY */}
      {inspectingProblem && (
        <ProblemDetail 
          problem={inspectingProblem}
          folders={folders}
          onClose={() => setInspectingProblem(null)}
          onUpdate={(updatedProb) => {
            // Write to state & disk immediately
            loadWorkspaceData();
            // sync inspecting modal data
            setInspectingProblem(updatedProb);
          }}
          onDelete={async (probId) => {
            try {
              await firebaseService.deleteProblem(probId);
              loadWorkspaceData();
              setInspectingProblem(null);
            } catch (err: any) {
              alert('삭제 실패: ' + err.message);
            }
          }}
        />
      )}

      {/* 4. FOOTER CREDITS */}
      <footer className="bg-white border-t border-gray-150 py-6 text-center text-[10px] text-gray-400 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 오답노트 & 회독 비서. Built safely on secure client-side database sandbox.</p>
        </div>
      </footer>

    </div>
  );
}
