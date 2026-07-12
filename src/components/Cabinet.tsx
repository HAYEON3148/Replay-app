/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Problem, Folder, Difficulty } from '../types';
import { 
  FolderPlus, 
  Trash2, 
  Folder as FolderIcon, 
  ChevronRight, 
  Search, 
  SlidersHorizontal, 
  Grid, 
  List, 
  FileText, 
  MoveRight,
  Sparkles,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';
import { getProblemImageSrc } from '../utils/placeholders';

interface CabinetProps {
  problems: Problem[];
  folders: Folder[];
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onUpdateProblemFolder: (problemId: string, folderId: string | null) => void;
  onSelectProblem: (problem: Problem) => void;
}

export default function Cabinet({
  problems,
  folders,
  onCreateFolder,
  onDeleteFolder,
  onUpdateProblemFolder,
  onSelectProblem
}: CabinetProps) {
  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Folder navigator states
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Moving problem states
  const [movingProblemId, setMovingProblemId] = useState<string | null>(null);

  // Advanced Filter states
  const [includeSubfolders, setIncludeSubfolders] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [hasXRecord, setHasXRecord] = useState(false);
  const [hasTriangleRecord, setHasTriangleRecord] = useState(false);
  const [masteryStatus, setMasteryStatus] = useState<'ALL' | 'UNMASTERED' | 'MASTERED'>('ALL');

  // Unique tags list and mistake reasons list for filtering
  const allTags = Array.from(new Set(problems.flatMap(p => p.tags)));
  const allReasons = Array.from(new Set(problems.map(p => p.mistakeReason).filter(Boolean)));

  // Subfolder helper: recursive check
  const getSubfolderIds = (folderId: string): string[] => {
    let ids = [folderId];
    const children = folders.filter(f => f.parentId === folderId);
    children.forEach(c => {
      ids = [...ids, ...getSubfolderIds(c.id)];
    });
    return ids;
  };

  // 1. FILTER LOGIC
  const filteredProblems = problems.filter(p => {
    // 1. Search Query (Title, tags, memo, tags)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(query);
      const matchMemo = p.memo.toLowerCase().includes(query);
      const matchTags = p.tags.some(t => t.toLowerCase().includes(query));
      if (!matchTitle && !matchMemo && !matchTags) return false;
    }

    // 2. Folder filter
    if (selectedFolderId !== null) {
      if (includeSubfolders) {
        const allowedFolderIds = getSubfolderIds(selectedFolderId);
        if (!p.folderId || !allowedFolderIds.includes(p.folderId)) return false;
      } else {
        if (p.folderId !== selectedFolderId) return false;
      }
    }

    // 3. Tag filter
    if (selectedTag && !p.tags.includes(selectedTag)) return false;

    // 4. Difficulty filter
    if (selectedDifficulty && p.difficulty !== selectedDifficulty) return false;

    // 5. Mistake reason filter
    if (selectedReason && p.mistakeReason !== selectedReason) return false;

    // 6. X records history helper
    if (hasXRecord) {
      const containsX = p.reviewHistory.some(h => h.result === 'X');
      if (!containsX) return false;
    }

    // 7. Triangle records history helper
    if (hasTriangleRecord) {
      const containsTriangle = p.reviewHistory.some(h => h.result === 'TRIANGLE');
      if (!containsTriangle) return false;
    }

    // 8. Mastery status
    if (masteryStatus === 'UNMASTERED' && p.mastered) return false;
    if (masteryStatus === 'MASTERED' && !p.mastered) return false;

    return true;
  });

  // Folder breadcrumb / path finder
  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return '루트 보관함';
    const path: string[] = [];
    let currentId: string | null = folderId;
    while (currentId) {
      const f = folders.find(f => f.id === currentId);
      if (f) {
        path.unshift(f.name);
        currentId = f.parentId;
      } else {
        break;
      }
    }
    return path.join(' > ');
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderParentId);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  // Recursive folders tree renderer
  const renderFolderNode = (folder: Folder, depth = 0) => {
    const isSelected = selectedFolderId === folder.id;
    const children = folders.filter(f => f.parentId === folder.id);

    return (
      <div key={folder.id} className="space-y-1">
        <div 
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          className={`group flex items-center justify-between text-xs py-1.5 transition-all cursor-pointer border-l-2 ${
            isSelected 
              ? 'bg-blue-50/50 text-blue-700 border-blue-500 font-medium' 
              : 'text-gray-600 border-transparent hover:bg-gray-50'
          }`}
          onClick={() => setSelectedFolderId(folder.id)}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <FolderIcon size={14} className={isSelected ? 'text-blue-500' : 'text-gray-400'} />
            <span className="truncate">{folder.name}</span>
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`'${folder.name}' 폴더와 그 아래 모든 하위 폴더를 삭제하시겠습니까? (폴더에 포함된 문제는 루트 보관함으로 이동합니다.)`)) {
                onDeleteFolder(folder.id);
                if (selectedFolderId === folder.id) setSelectedFolderId(null);
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity cursor-pointer"
            title="폴더 삭제"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {children.map(child => renderFolderNode(child, depth + 1))}
      </div>
    );
  };

  const handleMoveProblem = (problemId: string, destFolderId: string | null) => {
    onUpdateProblemFolder(problemId, destFolderId);
    setMovingProblemId(null);
  };

  return (
    <div id="cabinet-tab-content" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* 1. Left Sidebar: Folders Tree & Filter Parameters */}
      <div id="cabinet-sidebar-panel" className="lg:col-span-1 space-y-6">
        
        {/* Folders Management */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
            <span className="font-sans font-bold text-xs text-gray-800 uppercase tracking-wider">학습 폴더</span>
            <button 
              id="new-folder-toggle-btn"
              onClick={() => {
                setNewFolderParentId(selectedFolderId);
                setIsCreatingFolder(!isCreatingFolder);
              }}
              className="text-gray-400 hover:text-blue-600 p-1 cursor-pointer transition-colors"
              title="새 폴더 생성"
            >
              <FolderPlus size={15} />
            </button>
          </div>

          {/* Create Folder Form */}
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolderSubmit} className="mb-3 p-3 border border-blue-100 bg-blue-50/20 rounded-lg space-y-2">
              <div className="text-[10px] text-blue-600 font-semibold">
                {newFolderParentId ? `'${folders.find(f => f.id === newFolderParentId)?.name}' 하위에 폴더 추가` : '루트 폴더 추가'}
              </div>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="폴더 이름 입력..."
                className="w-full text-xs p-2 bg-white border border-gray-200 focus:outline-none focus:border-blue-500 rounded-lg transition-all focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
              <div className="flex items-center gap-1.5 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsCreatingFolder(false)}
                  className="text-[10px] text-gray-500 px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="text-[10px] bg-blue-600 text-white px-2.5 py-1.5 border border-blue-600 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  생성
                </button>
              </div>
            </form>
          )}

          {/* Folders List */}
          <div className="space-y-1">
            <div 
              className={`flex items-center gap-1.5 text-xs py-1.5 px-1.5 transition-all cursor-pointer border-l-2 ${
                selectedFolderId === null 
                  ? 'bg-blue-50/50 text-blue-700 border-blue-500 font-medium' 
                  : 'text-gray-600 border-transparent hover:bg-gray-50'
              }`}
              onClick={() => setSelectedFolderId(null)}
            >
              <FolderIcon size={14} className={selectedFolderId === null ? 'text-blue-500' : 'text-gray-400'} />
              <span>전체 루트 보관함</span>
            </div>

            <div className="space-y-1">
              {folders.filter(f => f.parentId === null).map(f => renderFolderNode(f, 0))}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="font-sans font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal size={12} />
              상세 검색 필터
            </span>
            <button
              onClick={() => {
                setSelectedTag('');
                setSelectedDifficulty('');
                setSelectedReason('');
                setHasXRecord(false);
                setHasTriangleRecord(false);
                setMasteryStatus('ALL');
              }}
              className="text-[10px] text-gray-400 hover:text-blue-600 font-semibold cursor-pointer"
            >
              필터 초기화
            </button>
          </div>

          {/* Subfolders Switch */}
          {selectedFolderId !== null && (
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSubfolders}
                onChange={(e) => setIncludeSubfolders(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              하위 폴더 내용 포함
            </label>
          )}

          {/* Mastery status */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">체화 상태</span>
            <select
              value={masteryStatus}
              onChange={(e) => setMasteryStatus(e.target.value as any)}
              className="w-full text-xs p-2 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="ALL">전체 상태 보기</option>
              <option value="UNMASTERED">미체화 문제만</option>
              <option value="MASTERED">체화 완료 문제만</option>
            </select>
          </div>

          {/* Difficulty */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">체감 난이도</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full text-xs p-2 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="">전체 난이도</option>
              <option value="HIGH">상 (킬러문항)</option>
              <option value="MEDIUM">중 (준킬러)</option>
              <option value="LOW">하 (기본문항)</option>
            </select>
          </div>

          {/* Mistake Reasons */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">오답 원인</span>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full text-xs p-2 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="">전체 원인</option>
              {allReasons.map(r => {
                let text = r;
                if (r === 'CONCEPT') text = '개념 부족';
                if (r === 'CALCULATION') text = '단순 계산 실수';
                if (r === 'READING_ERROR') text = '발문/조건 오독';
                if (r === 'COMPREHENSION') text = '이해 부족';
                if (r === 'OTHER') text = '기타 원인';
                return <option key={r} value={r}>{text}</option>;
              })}
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">태그 필터</span>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full text-xs p-2 bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="">전체 태그</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>

          {/* Custom evaluations checkboxes */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">특이 평가 이력</span>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={hasXRecord}
                onChange={(e) => setHasXRecord(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              틀린 이력(X)이 한 번이라도 있는 문제
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={hasTriangleRecord}
                onChange={(e) => setHasTriangleRecord(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              불안한 이력(△)이 한 번이라도 있는 문제
            </label>
          </div>
        </div>
      </div>

      {/* 2. Main Problems Grid / List Area */}
      <div className="lg:col-span-3 space-y-4">
        
        {/* Navigation Breadcrumbs, Search and View Modes */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-[10px] text-blue-600 font-bold tracking-wide flex items-center gap-1 uppercase">
              <BookOpen size={10} />
              Error Note Vault
            </div>
            <div className="font-sans font-bold text-sm text-gray-800 truncate">
              {getFolderPath(selectedFolderId)}
            </div>
          </div>

          {/* Search bar & Buttons */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목, 메모, 태그 검색..."
                className="text-xs pl-8 pr-3.5 py-2 w-48 sm:w-64 bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white rounded-full transition-all focus:ring-2 focus:ring-blue-100"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            </div>

            <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 cursor-pointer ${viewMode === 'grid' ? 'bg-gray-100 text-gray-700 font-semibold' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                title="그리드 보기"
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 cursor-pointer ${viewMode === 'list' ? 'bg-gray-100 text-gray-700 font-semibold' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                title="리스트 보기"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Problems Result Summary */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-gray-400">
            검색 결과: <strong className="text-gray-700">{filteredProblems.length}</strong>개 문제 보관 중
          </span>
        </div>

        {/* Problems Viewer Grid */}
        {filteredProblems.length === 0 ? (
          <div className="bg-white border border-gray-200 py-16 text-center text-xs text-gray-400 rounded-xl shadow-sm">
            조건에 부합하는 오답노트 문제가 없습니다.
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProblems.map(p => {
              const reviewCount = p.reviewHistory.length;
              return (
                <div 
                  key={p.id}
                  className="bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden rounded-xl shadow-sm"
                >
                  <div 
                    className="cursor-pointer flex-1"
                    onClick={() => onSelectProblem(p)}
                  >
                    {/* Thumbnail banner */}
                    <div className="h-32 bg-gray-50 border-b border-gray-100 overflow-hidden relative">
                      <img 
                        src={getProblemImageSrc(p.problemImageUrls[0])} 
                        alt="Problem image" 
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                      <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 border rounded-md shadow-xs ${
                        p.mastered 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {p.mastered ? '체화 완료' : '미체화'}
                      </span>
                    </div>

                    {/* Metadata Content */}
                    <div className="p-4 space-y-2">
                      <div className="text-xs font-bold text-gray-800 line-clamp-1">{p.title}</div>
                      <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                        <FolderIcon size={10} />
                        {getFolderPath(p.folderId)}
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {p.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>

                      {/* Info badges */}
                      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-gray-50 text-[10px]">
                        <div>
                          <span className="text-gray-400 block font-medium">체감 난이도</span>
                          <span className={`font-bold ${
                            p.difficulty === 'HIGH' ? 'text-red-500' : p.difficulty === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                          }`}>
                            {p.difficulty === 'HIGH' ? '상' : p.difficulty === 'MEDIUM' ? '중' : '하'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-medium">오답 원인</span>
                          <span className="text-gray-600 font-semibold truncate block">
                            {p.mistakeReason === 'CONCEPT' ? '개념 부족' : p.mistakeReason === 'CALCULATION' ? '계산 실수' : p.mistakeReason === 'READING_ERROR' ? '조건 오독' : p.mistakeReason === 'COMPREHENSION' ? '이해 부족' : '기타'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom details action (Move Folder / Review Counts) */}
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                    <span>누적 회독수: <strong className="text-gray-700">{reviewCount}회</strong></span>
                    
                    {/* Folder Mover Selector */}
                    <div className="relative">
                      {movingProblemId === p.id ? (
                        <select
                          value={p.folderId || ''}
                          onChange={(e) => handleMoveProblem(p.id, e.target.value || null)}
                          className="bg-white border border-gray-200 px-1.5 py-0.5 text-[9px] focus:outline-none rounded"
                          onBlur={() => setMovingProblemId(null)}
                          autoFocus
                        >
                          <option value="">루트 보관함</option>
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setMovingProblemId(p.id)}
                          className="text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                        >
                          폴더 이동 <MoveRight size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List Layout */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-3.5 w-16">이미지</th>
                    <th className="p-3.5">문제 제목</th>
                    <th className="p-3.5">폴더 경로</th>
                    <th className="p-3.5 w-28">난이도 / 원인</th>
                    <th className="p-3.5 w-20 text-center">회독수</th>
                    <th className="p-3.5 w-24 text-center">상태</th>
                    <th className="p-3.5 w-24 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredProblems.map(p => {
                    const reviewCount = p.reviewHistory.length;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3.5">
                          <img 
                            src={getProblemImageSrc(p.problemImageUrls[0])} 
                            alt="Problem Image" 
                            className="w-10 h-10 object-cover border border-gray-200 rounded"
                          />
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="truncate cursor-pointer hover:text-blue-600 font-bold text-gray-800" onClick={() => onSelectProblem(p)}>
                            {p.title}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {p.tags.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="text-[9px] text-gray-400">#{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 text-gray-400 truncate max-w-[150px]">
                          {getFolderPath(p.folderId)}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col">
                            <span className={`font-bold ${
                              p.difficulty === 'HIGH' ? 'text-red-500' : p.difficulty === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                            }`}>
                              {p.difficulty === 'HIGH' ? '상' : p.difficulty === 'MEDIUM' ? '중' : '하'}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {p.mistakeReason === 'CONCEPT' ? '개념 부족' : p.mistakeReason === 'CALCULATION' ? '계산 실수' : p.mistakeReason === 'READING_ERROR' ? '조건 오독' : p.mistakeReason === 'COMPREHENSION' ? '이해 부족' : '기타'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center text-gray-700 font-bold">
                          {reviewCount}회
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                            p.mastered 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {p.mastered ? '체화완료' : '미체화'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="relative inline-block text-left">
                            {movingProblemId === p.id ? (
                              <select
                                value={p.folderId || ''}
                                onChange={(e) => handleMoveProblem(p.id, e.target.value || null)}
                                className="bg-white border border-gray-200 px-1.5 py-0.5 text-[9px] focus:outline-none rounded"
                                onBlur={() => setMovingProblemId(null)}
                                autoFocus
                              >
                                <option value="">루트 보관함</option>
                                {folders.map(f => (
                                  <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                              </select>
                            ) : (
                              <button
                                onClick={() => setMovingProblemId(p.id)}
                                className="text-[10px] text-blue-600 hover:underline cursor-pointer font-semibold"
                              >
                                폴더 이동
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
