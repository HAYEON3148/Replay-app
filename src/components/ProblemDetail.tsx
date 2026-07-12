/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Problem, Folder, Difficulty, MistakeReason } from '../types';
import { 
  X, 
  Folder as FolderIcon, 
  Calendar, 
  Trash2, 
  Edit, 
  Check, 
  BookmarkCheck, 
  Upload, 
  History, 
  Plus,
  BookOpen
} from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { getProblemImageSrc } from '../utils/placeholders';

interface ProblemDetailProps {
  problem: Problem;
  folders: Folder[];
  onClose: () => void;
  onUpdate: (updated: Problem) => void;
  onDelete: (problemId: string) => void;
}

export default function ProblemDetail({
  problem,
  folders,
  onClose,
  onUpdate,
  onDelete
}: ProblemDetailProps) {
  // Editing Mode
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [title, setTitle] = useState(problem.title);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(problem.folderId);
  const [tagsInput, setTagsInput] = useState(problem.tags.join(', '));
  const [difficulty, setDifficulty] = useState<Difficulty>(problem.difficulty);
  const [mistakeReason, setMistakeReason] = useState<MistakeReason>(problem.mistakeReason);
  const [memo, setMemo] = useState(problem.memo);

  // Tab state for switching between Problem Image and Solution/Answer key
  const [activeImageTab, setActiveImageTab] = useState<'problem' | 'solution'>('problem');

  // Load Folder Path name helper
  const getFolderPathName = (folderId: string | null): string => {
    if (!folderId) return '루트 보관함';
    const matched = folders.find(f => f.id === folderId);
    return matched ? matched.name : '루트 보관함';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

    try {
      const updated = await firebaseService.updateProblem(problem.id, {
        title: title.trim(),
        folderId: selectedFolderId,
        tags: parsedTags,
        difficulty,
        mistakeReason,
        memo: memo.trim()
      });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || '저장에 실패했습니다.');
    }
  };

  const handleAddExplanationFile = () => {
    const el = document.createElement('input');
    el.type = 'file';
    el.accept = 'image/*';
    el.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const updated = await firebaseService.updateProblem(problem.id, {
            solutionImageUrls: [...problem.solutionImageUrls, base64]
          });
          onUpdate(updated);
        } catch (err: any) {
          alert(err.message || '업로드 중 오류가 발생했습니다.');
        }
      };
      reader.readAsDataURL(file);
    };
    el.click();
  };

  const handleDeleteExplanationImage = async (imgUrl: string) => {
    if (problem.solutionImageUrls.length <= 1) {
      alert('최소 1개의 해설 이미지가 있어야 합니다.');
      return;
    }
    if (!window.confirm('선택하신 해설 이미지를 삭제하시겠습니까?')) return;

    try {
      const updated = await firebaseService.updateProblem(problem.id, {
        solutionImageUrls: problem.solutionImageUrls.filter(u => u !== imgUrl)
      });
      onUpdate(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProblem = () => {
    if (window.confirm('이 문제를 오답노트에서 영구히 삭제하시겠습니까? (삭제된 데이터는 복구 불가능합니다)')) {
      onDelete(problem.id);
      onClose();
    }
  };

  // Modify historical evaluations to support real-time state recalculation (Step 7)
  const handleModifyEvaluationHistory = async (recordIndex: number, newResult: 'X' | 'TRIANGLE' | 'CHECK') => {
    const updatedHistory = [...problem.reviewHistory];
    updatedHistory[recordIndex] = {
      ...updatedHistory[recordIndex],
      result: newResult,
      reviewedAt: new Date().toISOString() // refresh timestamp
    };

    try {
      const updated = await firebaseService.updateProblem(problem.id, {
        reviewHistory: updatedHistory
      });
      onUpdate(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveHistoryItem = async (recordIndex: number) => {
    if (!window.confirm('이 회독 평가 기록을 삭제하시겠습니까? (상태가 자동 재조정됩니다.)')) return;
    const updatedHistory = problem.reviewHistory.filter((_, i) => i !== recordIndex);
    
    try {
      const updated = await firebaseService.updateProblem(problem.id, {
        reviewHistory: updatedHistory
      });
      onUpdate(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div id="problem-detail-overlay" className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-none shadow-xl">
        
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 border ${
              problem.mastered 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {problem.mastered ? '체화 완료 (✓)' : '복습 대상 (미체화)'}
            </span>
            <span className="text-[10px] text-gray-400">등록일: {formatDate(problem.createdAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                id="edit-problem-btn"
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 bg-white cursor-pointer"
              >
                <Edit size={12} /> 정보 수정
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Container Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT: Image views and Tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveImageTab('problem')}
                className={`flex-1 text-center py-2 text-xs font-semibold border-b-2 ${
                  activeImageTab === 'problem' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                문제 이미지 ({problem.problemImageUrls.length})
              </button>
              <button
                onClick={() => setActiveImageTab('solution')}
                className={`flex-1 text-center py-2 text-xs font-semibold border-b-2 ${
                  activeImageTab === 'solution' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                답안 및 해설지 ({problem.solutionImageUrls.length})
              </button>
            </div>

            {/* Display Box */}
            <div className="bg-gray-50 border border-gray-200 p-3 min-h-[300px] flex items-center justify-center relative">
              {activeImageTab === 'problem' ? (
                <div className="w-full space-y-2">
                  <img 
                    src={getProblemImageSrc(problem.problemImageUrls[0])} 
                    alt="Problem Canvas" 
                    className="w-full h-auto object-contain max-h-[350px] bg-white border border-gray-100"
                  />
                </div>
              ) : (
                /* Multiple Solution Images list */
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-1 gap-4 max-h-[350px] overflow-y-auto pr-1">
                    {problem.solutionImageUrls.map((solUrl, i) => (
                      <div key={i} className="relative group border border-gray-100 bg-white p-2">
                        <img 
                          src={getProblemImageSrc(solUrl)} 
                          alt={`Solution ${i+1}`} 
                          className="w-full h-auto object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteExplanationImage(solUrl)}
                          className="absolute top-3 right-3 bg-red-600 text-white p-1 text-[10px] opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          해설 페이지 삭제
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddExplanationFile}
                    className="w-full py-2 bg-white hover:bg-gray-50 border border-dashed border-gray-300 text-gray-500 hover:text-gray-800 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={13} /> 새로운 해설 및 풀이 추가 업로드
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Meta info Form / Detail display */}
          <div className="space-y-6">
            {isEditing ? (
              /* Editable Info Form */
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">문제 제목 *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs p-2 bg-gray-50 border border-gray-250 focus:outline-none focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">폴더</label>
                  <select
                    value={selectedFolderId || ''}
                    onChange={(e) => setSelectedFolderId(e.target.value || null)}
                    className="w-full text-xs p-2 bg-gray-50 border border-gray-250 focus:outline-none"
                  >
                    <option value="">폴더 없음</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">태그들 (쉼표 구분)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full text-xs p-2 bg-gray-50 border border-gray-250 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">체감 난이도</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                      className="w-full text-xs p-2 bg-gray-50 border border-gray-250"
                    >
                      <option value="HIGH">상</option>
                      <option value="MEDIUM">중</option>
                      <option value="LOW">하</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">오답 원인</label>
                    <select
                      value={mistakeReason}
                      onChange={(e) => setMistakeReason(e.target.value)}
                      className="w-full text-xs p-2 bg-gray-50 border border-gray-250"
                    >
                      <option value="CONCEPT">개념 불완전</option>
                      <option value="CALCULATION">계산 실수</option>
                      <option value="READING_ERROR">발문/조건 오독</option>
                      <option value="COMPREHENSION">문제 이해 부족</option>
                      <option value="OTHER">기타 원인</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">개인 메모</label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-2 bg-gray-50 border border-gray-250 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-xs hover:bg-blue-700 border border-blue-600 cursor-pointer flex items-center gap-1"
                  >
                    <Check size={12} /> 저장 완료
                  </button>
                </div>
              </form>
            ) : (
              /* Display Info panel */
              <div className="space-y-5">
                <div>
                  <h3 className="font-sans font-semibold text-base text-gray-900 tracking-tight">{problem.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-100 flex items-center gap-1">
                      <FolderIcon size={10} />
                      {getFolderPathName(problem.folderId)}
                    </span>
                    {problem.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 border border-gray-200">#{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-3 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-1">체감 난이도</span>
                    <span className={`font-semibold ${
                      problem.difficulty === 'HIGH' ? 'text-red-500' : problem.difficulty === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                    }`}>
                      {problem.difficulty === 'HIGH' ? '상 (킬러 문항)' : problem.difficulty === 'MEDIUM' ? '중 (준킬러)' : '하 (기초 문항)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">오답 분석 원인</span>
                    <span className="text-gray-700 font-medium">
                      {problem.mistakeReason === 'CONCEPT' ? '개념 불완전/보완 필요' : problem.mistakeReason === 'CALCULATION' ? '수식 계산 실수' : problem.mistakeReason === 'READING_ERROR' ? '발문 오독 / 조건 누락' : problem.mistakeReason === 'COMPREHENSION' ? '문제 아이디어 실패' : '기타 실수'}
                    </span>
                  </div>
                </div>

                {/* Memo section */}
                <div className="space-y-1">
                  <span className="text-[11px] text-gray-400 font-semibold block">개인 오답 노트 메모</span>
                  <div className="bg-gray-50 border border-gray-100 p-3.5 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {problem.memo || '작성된 오답 노트 메모가 없습니다. 정보 수정 버튼을 눌러 피드백을 기록해 보세요.'}
                  </div>
                </div>

                {/* Review logs and evaluation modifier (Step 7) */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <span className="font-sans font-semibold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <History size={14} className="text-gray-400" />
                    누적 회독 이력 ({problem.reviewHistory.length}회)
                  </span>

                  {problem.reviewHistory.length === 0 ? (
                    <div className="text-[10px] text-gray-400 py-2">아직 복습 평가를 수행하지 않았습니다. PDF 세션 평가나 앱 내 시험을 시작해 오답을 기록해 보세요!</div>
                  ) : (
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {problem.reviewHistory.map((h, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-55 border border-gray-100 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1 py-0.5 text-[9px] font-medium border ${
                                h.sessionType === 'PDF' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                              }`}>
                                {h.sessionType === 'PDF' ? 'PDF 세션' : '앱 시험'}
                              </span>
                              <span className="text-gray-400 text-[10px]">{formatDate(h.reviewedAt)}</span>
                            </div>
                          </div>

                          {/* Evaluation modification switcher */}
                          <div className="flex items-center gap-2">
                            <div className="flex border border-gray-200 bg-white">
                              <button
                                type="button"
                                onClick={() => handleModifyEvaluationHistory(idx, 'X')}
                                className={`px-2 py-1 text-[10px] cursor-pointer ${h.result === 'X' ? 'bg-red-500 text-white font-bold' : 'hover:bg-gray-50 text-red-500'}`}
                                title="X로 재평가"
                              >
                                X
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModifyEvaluationHistory(idx, 'TRIANGLE')}
                                className={`px-2 py-1 text-[10px] cursor-pointer ${h.result === 'TRIANGLE' ? 'bg-amber-500 text-white font-bold' : 'hover:bg-gray-50 text-amber-500'}`}
                                title="△로 재평가"
                              >
                                △
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModifyEvaluationHistory(idx, 'CHECK')}
                                className={`px-2 py-1 text-[10px] cursor-pointer ${h.result === 'CHECK' ? 'bg-emerald-500 text-white font-bold' : 'hover:bg-gray-50 text-emerald-500'}`}
                                title="✓로 재평가"
                              >
                                ✓
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveHistoryItem(idx)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="평가 이력 삭제"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destructive actions */}
                <div className="pt-4 border-t border-gray-100 flex justify-between">
                  <button
                    type="button"
                    onClick={handleDeleteProblem}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 border border-red-150 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} /> 문제 삭제
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
