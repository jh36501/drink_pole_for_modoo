import React from 'react';
import { UserRole, ViewMode } from '../types';
import { downloadOfflineHtml } from '../utils/downloadOffline';
import { 
  Users, 
  ShieldCheck, 
  Share2, 
  MessageSquare, 
  CalendarDays, 
  TableProperties, 
  UserCheck, 
  FileJson,
  Plus,
  CloudSun,
  Download
} from 'lucide-react';

interface NavbarProps {
  role: UserRole;
  onToggleRole: () => void;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  onOpenShareModal: () => void;
  onOpenAnnouncementModal: () => void;
  onOpenJsonModal: () => void;
  onOpenVoteModal: () => void;
  onOpenWeatherModal?: () => void;
  totalVoters: number;
  isVotingDisabled?: boolean;
  syncStatus?: 'connected' | 'connecting' | 'offline';
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  onToggleRole,
  viewMode,
  onSelectViewMode,
  onOpenShareModal,
  onOpenAnnouncementModal,
  onOpenJsonModal,
  onOpenVoteModal,
  onOpenWeatherModal,
  totalVoters,
  isVotingDisabled = false,
  syncStatus = 'connected',
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold shadow-sm">
              🍻
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                모두의 회식
              </span>
              <span className="text-xs text-slate-500 font-medium">
                팀 회식 일정 투표기
              </span>
            </div>
          </div>

          {/* Zone 2: View Switcher (Segmented button control) */}
          <nav className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => onSelectViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              주간 캘린더 뷰
            </button>
            <button
              onClick={() => onSelectViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              참여 매트릭스 표
            </button>
            <button
              onClick={() => onSelectViewMode('members')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                viewMode === 'members'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              참여자 명단 ({totalVoters})
            </button>
          </nav>

          {/* Zone 3: Actions & Role Mode Switch */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Share & Announce & Weather Quick Buttons */}
            {onOpenWeatherModal && (
              <button
                onClick={onOpenWeatherModal}
                title="저녁 날씨 조회 및 검색 (기상청 연동)"
                className="p-2 text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <CloudSun className="w-4 h-4" />
                <span className="text-xs font-bold hidden sm:inline">저녁 날씨</span>
              </button>
            )}

            <button
              onClick={onOpenShareModal}
              title="투표 링크 공유"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAnnouncementModal}
              title="슬랙/카톡 공지 생성"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenJsonModal}
              title="데이터 백업 및 초기화"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <FileJson className="w-4 h-4" />
            </button>

            {/* Offline Version Download Button (Direct client-side blob download, zero server cookies needed) */}
            <button
              type="button"
              onClick={downloadOfflineHtml}
              title="인터넷이 없는 회사 내부망 PC에서도 열리는 단일 HTML 파일 내려받기"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>내부망 ver 내려받기</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Team Shared Live Sync Indicator */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100/80 rounded-md"
              title="서버 파일 기반으로 팀원 간 실시간 데이터가 공유됩니다 (별도 DBMS 불필요)"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : syncStatus === 'connecting'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              <span>
                {syncStatus === 'connected'
                  ? '팀 공유 활성'
                  : syncStatus === 'connecting'
                  ? '동기화 중'
                  : '로컬 모드'}
              </span>
            </div>

            {/* Role switch toggle */}
            <button
              onClick={onToggleRole}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                role === 'admin'
                  ? 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
              }`}
            >
              {role === 'admin' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>총무 모드</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>팀원 모드</span>
                </>
              )}
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenVoteModal}
              disabled={isVotingDisabled}
              title={isVotingDisabled ? '투표가 마감되었습니다' : '투표하기'}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-xs whitespace-nowrap ${
                isVotingDisabled
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'text-white bg-sky-600 hover:bg-sky-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isVotingDisabled ? '투표 마감됨' : '투표하기'}</span>
            </button>
          </div>

        </div>

        {/* Mobile secondary bar for switching views */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 bg-slate-50/50 -mx-4 px-4 overflow-x-auto">
          <button
            onClick={() => onSelectViewMode('calendar')}
            className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
              viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            주간 캘린더
          </button>
          <button
            onClick={() => onSelectViewMode('matrix')}
            className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
              viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            매트릭스 표
          </button>
          <button
            onClick={() => onSelectViewMode('members')}
            className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
              viewMode === 'members' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            참여자 ({totalVoters})
          </button>
        </div>

      </div>
    </header>
  );
};
