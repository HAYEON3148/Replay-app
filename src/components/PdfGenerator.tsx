/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Problem, Folder } from '../types';
import { 
  FileText, 
  Settings, 
  Check, 
  Printer, 
  ChevronRight, 
  Layout, 
  Eye, 
  Filter,
  CheckSquare,
  MinusSquare,
  Info
} from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { getProblemImageSrc } from '../utils/placeholders';

interface PdfGeneratorProps {
  problems: Problem[];
  folders: Folder[];
  onCreateSessionSuccess: (session: any) => void;
  onNavigate: (tab: string) => void;
}

export default function PdfGenerator({
  problems,
  folders,
  onCreateSessionSuccess,
  onNavigate
}: PdfGeneratorProps) {
  // 1. Filtering State
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [includeSubfolders, setIncludeSubfolders] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [minXCount, setMinXCount] = useState<number>(0);
  const [minTriangleCount, setMinTriangleCount] = useState<number>(0);
  const [minReviewCount, setMinReviewCount] = useState<number>(0);

  // Exclude mastered problems by default
  const [excludeMastered, setExcludeMastered] = useState(true);

  // 2. Selection state
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);

  // 3. PDF Layout configurations
  const [pdfName, setPdfName] = useState('수학 복습 모의고사');
  const [columnLayout, setColumnLayout] = useState<'1' | '2'>('1'); // 1단 배치 / 2단 배치
  const [problemSize, setProblemSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [gapSize, setGapSize] = useState<'narrow' | 'normal' | 'wide'>('normal');
  const [solvingSpaceHeight, setSolvingSpaceHeight] = useState<number>(180); // in pixels
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [showProblemNumbers, setShowProblemNumbers] = useState(true);

  // Preview state
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Helper lists
  const allTags = Array.from(new Set(problems.flatMap(p => p.tags)));
  const allReasons = Array.from(new Set(problems.map(p => p.mistakeReason).filter(Boolean)));

  const getSubfolderIds = (folderId: string): string[] => {
    let ids = [folderId];
    const children = folders.filter(f => f.parentId === folderId);
    children.forEach(c => {
      ids = [...ids, ...getSubfolderIds(c.id)];
    });
    return ids;
  };

  // Filter Problem Bank
  const availableProblems = problems.filter(p => {
    if (excludeMastered && p.mastered) return false;

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

    // Numerical history counts
    const xCount = p.reviewHistory.filter(h => h.result === 'X').length;
    const tCount = p.reviewHistory.filter(h => h.result === 'TRIANGLE').length;
    const totalCount = p.reviewHistory.length;

    if (minXCount > 0 && xCount < minXCount) return false;
    if (minTriangleCount > 0 && tCount < minTriangleCount) return false;
    if (minReviewCount > 0 && totalCount < minReviewCount) return false;

    return true;
  });

  const handleToggleSelectProblem = (id: string) => {
    setSelectedProblemIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = availableProblems.map(p => p.id);
    setSelectedProblemIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedProblemIds([]);
  };

  // Launch browser printing and record Session logs (Step 8 & 9)
  const handlePrintPdfAndCreateSession = async () => {
    if (selectedProblemIds.length === 0) {
      alert('PDF로 생성할 문제를 최소 1개 이상 선택해 주세요.');
      return;
    }

    // Prepare initial session payload evaluations
    const initialEvaluations: Record<string, null> = {};
    selectedProblemIds.forEach(id => {
      initialEvaluations[id] = null;
    });

    try {
      // Create session in state
      const session = await firebaseService.createReviewSession({
        pdfName: pdfName.trim() || '무제 복습 모의고사',
        problemIds: selectedProblemIds,
        problemOrder: selectedProblemIds,
        evaluations: initialEvaluations
      });

      // Show print preview window with print triggering
      setShowPrintPreview(true);
      setTimeout(() => {
        window.print();
        onCreateSessionSuccess(session);
      }, 500);

    } catch (e: any) {
      alert('세션 저장 실패: ' + e.message);
    }
  };

  const getFolderPathName = (folderId: string | null): string => {
    if (!folderId) return '루트';
    const matched = folders.find(f => f.id === folderId);
    return matched ? matched.name : '루트';
  };

  // Size mapping variables for styles
  const sizeClasses = {
    small: 'max-h-[160px]',
    medium: 'max-h-[260px]',
    large: 'max-h-[400px]'
  };

  const gapClasses = {
    narrow: 'mb-4',
    normal: 'mb-8',
    wide: 'mb-14'
  };

  return (
    <div id="pdf-generator-tab-content">
      {!showPrintPreview ? (
        /* 1. PDF Settings and Problem Bank Selection View */
        <div className="space-y-6">
          <div>
            <h2 className="font-sans text-xl font-semibold tracking-tight text-gray-900">PDF 학습지 만들기</h2>
            <p className="text-xs text-gray-500 mt-1">오답 중 다시 풀어볼 문제를 선별하여 흑백 인쇄 및 책자 풀이에 최적화된 복습 학습지를 생성합니다.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Problem bank filter and selection list */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Problem Selection Bank Filters */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-4">
                <span className="font-sans font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-100">
                  <Filter size={13} className="text-gray-400" />
                  학습지 문항 선별 필터
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Folder */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">폴더</span>
                    <select
                      value={selectedFolderId || ''}
                      onChange={(e) => setSelectedFolderId(e.target.value || null)}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="">전체 폴더</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">난이도</span>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="">전체 난이도</option>
                      <option value="HIGH">상 (킬러)</option>
                      <option value="MEDIUM">중</option>
                      <option value="LOW">하</option>
                    </select>
                  </div>

                  {/* Exclusions toggle */}
                  <div className="space-y-1 flex items-end">
                    <label className="flex items-center gap-2 p-2.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 w-full cursor-pointer select-none rounded-lg focus-within:ring-2 focus-within:ring-blue-100 transition-all font-semibold">
                      <input
                        type="checkbox"
                        checked={excludeMastered}
                        onChange={(e) => setExcludeMastered(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      체화완료(✓) 자동 제외
                    </label>
                  </div>
                </div>

                {/* Secondary counts filters toggler */}
                <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider mb-1">최소 틀린 횟수 (X)</label>
                    <input
                      type="number"
                      min={0}
                      value={minXCount || ''}
                      onChange={(e) => setMinXCount(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider mb-1">최소 회독수</label>
                    <input
                      type="number"
                      min={0}
                      value={minReviewCount || ''}
                      onChange={(e) => setMinReviewCount(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  {selectedFolderId !== null && (
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 p-2.5 text-xs text-gray-600 cursor-pointer font-semibold select-none">
                        <input
                          type="checkbox"
                          checked={includeSubfolders}
                          onChange={(e) => setIncludeSubfolders(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        하위 폴더 포함
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Problem selection lists */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="font-sans font-bold text-xs text-gray-800">
                    선택 가능한 문항 목록 (<strong className="text-blue-600">{availableProblems.length}</strong>개)
                  </span>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[10px] text-blue-600 hover:underline cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <CheckSquare size={12} /> 전체 선택
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-[10px] text-gray-400 hover:underline cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <MinusSquare size={12} /> 전체 해제
                    </button>
                  </div>
                </div>

                {availableProblems.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    조건에 해당하는 복습 문항이 없습니다. 필터를 완화해 보세요.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {availableProblems.map(p => {
                      const isSelected = selectedProblemIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleSelectProblem(p.id)}
                          className={`p-3.5 border rounded-xl transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                            isSelected ? 'bg-blue-50/20 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent div click
                              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <img 
                              src={getProblemImageSrc(p.problemImageUrls[0])} 
                              className="w-11 h-11 object-cover border border-gray-200 rounded-lg flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-800 truncate">{p.title}</div>
                              <div className="flex gap-1.5 mt-1 text-[9px] text-gray-400 font-semibold">
                                <span>{getFolderPathName(p.folderId)}</span>
                                <span>|</span>
                                <span className={`font-bold ${
                                  p.difficulty === 'HIGH' ? 'text-red-500' : p.difficulty === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                                }`}>
                                  난이도 {p.difficulty === 'HIGH' ? '상' : p.difficulty === 'MEDIUM' ? '중' : '하'}
                                </span>
                                <span>|</span>
                                <span>누적 회독 {p.reviewHistory.length}회</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: PDF Configurations */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-4">
                <span className="font-sans font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                  <Settings size={13} className="text-gray-400" />
                  학습지 제본 인쇄 설정
                </span>

                {/* PDF Name */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-gray-700 block">시험지 제목 (PDF 이름)</label>
                  <input
                    type="text"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* 1 Column vs 2 Column */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-gray-700 block">레이아웃 배치 단수</label>
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setColumnLayout('1')}
                      className={`flex-1 text-xs py-2 cursor-pointer ${columnLayout === '1' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold'}`}
                    >
                      1단 배치 (A4 세로)
                    </button>
                    <button
                      type="button"
                      onClick={() => setColumnLayout('2')}
                      className={`flex-1 text-xs py-2 cursor-pointer ${columnLayout === '2' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold'}`}
                    >
                      2단 배치 (수능 시험지형)
                    </button>
                  </div>
                </div>

                {/* Image Scale Size */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-gray-700 block">문제 크기 비율</label>
                  <select
                    value={problemSize}
                    onChange={(e) => setProblemSize(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    <option value="small">작게 (용량 절약)</option>
                    <option value="medium">중간 (기본 크기)</option>
                    <option value="large">크게 (고화질 정밀)</option>
                  </select>
                </div>

                {/* Workspace solving spaces (dotted lines) height */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-gray-700 block">문제별 수기 풀이 공간 ({solvingSpaceHeight}px)</label>
                  <input
                    type="range"
                    min={50}
                    max={350}
                    step={10}
                    value={solvingSpaceHeight}
                    onChange={(e) => setSolvingSpaceHeight(parseInt(e.target.value))}
                    className="w-full cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                    <span>좁게 (암기용)</span>
                    <span>넓게 (수학 풀이용)</span>
                  </div>
                </div>

                {/* Spacing Gap */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-gray-700 block">문항 사이 간격</label>
                  <select
                    value={gapSize}
                    onChange={(e) => setGapSize(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    <option value="narrow">좁음</option>
                    <option value="normal">보통</option>
                    <option value="wide">넓음</option>
                  </select>
                </div>

                {/* Checkbox settings */}
                <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-600 font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showProblemNumbers}
                      onChange={(e) => setShowProblemNumbers(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    문제 일련 번호 자동 매기기
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none font-semibold">
                    <input
                      type="checkbox"
                      checked={showPageNumbers}
                      onChange={(e) => setShowPageNumbers(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    하단 페이지 번호 매기기
                  </label>
                </div>

                {/* Submit action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePrintPdfAndCreateSession}
                    className="w-full py-3.5 bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 border border-blue-600 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm rounded-xl transition-colors"
                  >
                    <Printer size={14} /> PDF 인쇄 및 복습 세션 생성
                  </button>
                  <div className="text-[10px] text-gray-400 mt-2.5 text-center flex items-center gap-1 justify-center leading-relaxed">
                    <Info size={11} className="flex-shrink-0" />
                    PDF 생성을 눌러 제본 후 인쇄하더라도 즉시 회독수는 늘지 않고 복습세션으로 이관됩니다.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* 2. Full Screen Print Preview Template (Hidden in normal screen, styled specifically for @media print) */
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
                  className="px-4 py-2 border border-gray-200 text-xs font-semibold bg-white cursor-pointer hover:bg-gray-50 rounded-lg transition-all"
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
              <h1 className="text-2xl font-bold font-serif uppercase tracking-wider">{pdfName}</h1>
              <div className="flex items-center justify-center gap-12 text-sm">
                <span>성명: __________________</span>
                <span>오답 회독 복습 평가 지본</span>
              </div>
            </div>

            {/* Problems list */}
            <div className={columnLayout === '2' ? 'grid grid-cols-2 gap-8 gap-y-12' : 'space-y-12'}>
              {selectedProblemIds.map((probId, idx) => {
                const prob = problems.find(p => p.id === probId);
                if (!prob) return null;

                return (
                  <div 
                    key={prob.id} 
                    className={`page-break-avoid ${gapClasses[gapSize]} border-b border-gray-100 pb-6`}
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    {/* Header line */}
                    <div className="flex items-start justify-between font-bold text-xs mb-3 border-b border-black pb-1">
                      <span>
                        {showProblemNumbers ? `[문항 ${idx + 1}] ` : ''}
                        {prob.title}
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
                        className={`w-full object-contain filter grayscale contrast-125 ${sizeClasses[problemSize]}`}
                      />
                    </div>

                    {/* Handwriting Solve area dotted box */}
                    <div 
                      style={{ height: `${solvingSpaceHeight}px` }}
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
            {showPageNumbers && (
              <div className="text-center text-xs text-gray-400 pt-12 border-t border-gray-100">
                - {pdfName} 수험 학습지 종료 - 
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
