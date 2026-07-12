/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { firebaseService } from '../services/firebase';
import { ShieldCheck, HardDrive, Sparkles } from 'lucide-react';

interface StorageUsageProps {
  onRefresh: () => void;
}

export default function StorageUsage({ onRefresh }: StorageUsageProps) {
  const user = firebaseService.getCurrentUser();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const usagePercent = Math.min(100, (user.storageUsage / user.storageLimit) * 100);
  const isNearLimit = usagePercent > 80;
  
  // Format sizes nicely
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = 2;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleTogglePlan = () => {
    setLoading(true);
    setTimeout(() => {
      const nextPlan = user.plan === 'FREE' ? 'PREMIUM' : 'FREE';
      firebaseService.updateUserPlan(nextPlan);
      setLoading(false);
      onRefresh();
    }, 400);
  };

  return (
    <div id="storage-usage-panel" className="bg-white border border-gray-200 p-5 mb-6 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-gray-50 text-gray-400 rounded-lg border border-gray-200">
            <HardDrive size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-medium text-xs text-gray-800">개인 클라우드 용량</span>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                user.plan === 'PREMIUM' 
                  ? 'bg-blue-50 text-blue-700 border-blue-100' 
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                {user.plan === 'PREMIUM' ? '프리미엄 요금제' : '무료 요금제'}
              </span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              현재 사용량: {formatBytes(user.storageUsage)} / 전체 {formatBytes(user.storageLimit)} ({usagePercent.toFixed(1)}%)
            </div>
          </div>
        </div>

        <button
          id="plan-toggle-btn"
          disabled={loading}
          onClick={handleTogglePlan}
          className={`px-3 py-1.5 text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer rounded-lg border ${
            user.plan === 'PREMIUM'
              ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm'
          }`}
        >
          {user.plan === 'PREMIUM' ? (
            <>
              <ShieldCheck size={14} />
              무료 등급으로 복귀
            </>
          ) : (
            <>
              <Sparkles size={14} className="animate-pulse" />
              월 2,000원 프리미엄 구독 체험
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-1.5 mt-3 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            isNearLimit ? 'bg-red-500' : 'bg-blue-600'
          }`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      {isNearLimit && (
        <div className="text-xs text-red-500 mt-2 bg-red-50/50 border border-red-100 p-3 rounded-lg">
          ⚠️ 클라우드 스토리지가 가득 찼습니다. 새 문제를 추가하려면 무료 복귀 후 다시 구독해 프리미엄 등급(100MB)으로 업그레이드하거나 기존 고용량 문제 이미지를 일부 정리해 주세요.
        </div>
      )}
    </div>
  );
}
