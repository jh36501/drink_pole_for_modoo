import React, { useState } from 'react';
import { PollConfig, DateVoteSummary } from '../types';
import { formatDateKorean, getDayOfWeekKorean, getDaysInWeek } from '../utils/dateUtils';
import { 
  X, 
  Check, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  Settings2,
  Trash2
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: PollConfig;
  daySummaries: DateVoteSummary[];
  onUpdateConfig: (newConfig: PollConfig) => void;
  onSelectConfirmedDate: (date: string | null) => void;
  tiedDates?: DateVoteSummary[];
  onOpenRevoteModal?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  config,
  daySummaries,
  onUpdateConfig,
  onSelectConfirmedDate,
  tiedDates = [],
  onOpenRevoteModal,
}) => {
  const [title, setTitle] = useState(config.title);
  const [description, setDescription] = useState(config.description);
  const [organizer, setOrganizer] = useState(config.organizer);
  const [deadline, setDeadline] = useState(config.deadline);
  const [confirmedTimeLocation, setConfirmedTimeLocation] = useState(config.confirmedTimeLocation);
  const [candidateDates, setCandidateDates] = useState<string[]>(config.candidateDates);
  const [confirmedDate, setConfirmedDate] = useState<string | null>(config.confirmedDate);

  if (!isOpen) return null;

  const currentWeekDays = getDaysInWeek(config.weekStartDate);

  const handleToggleCandidate = (date: string) => {
    setCandidateDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const handleSelectWeekdays = () => {
    // Mon - Fri (first 5 days)
    setCandidateDates(currentWeekDays.slice(0, 5));
  };

  const handleSelectAllDays = () => {
    setCandidateDates([...currentWeekDays]);
  };

  const handleClearCandidates = () => {
    setCandidateDates([]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...config,
      title: title.trim() || config.title,
      description: description.trim(),
      organizer: organizer.trim() || config.organizer,
      deadline: deadline.trim(),
      confirmedTimeLocation: confirmedTimeLocation.trim(),
      candidateDates,
      confirmedDate,
      lastUpdated: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-amber-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                총무(관리자) 일정 및 후보일 관리
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                투표 대상 요일 활성화 및 회식 세부 설정을 변경합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-6">
          
          {/* Tie Detected Banner for Admin */}
          {tiedDates.length >= 2 && onOpenRevoteModal && (
            <div className="p-4 bg-orange-50 border border-orange-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-orange-900 block">
                  ⚔️ 최다 득표일 동점 발생 ({tiedDates.length}개 일자 각 {tiedDates[0]?.voterCount}표)
                </span>
                <span className="text-[11px] text-orange-800 mt-0.5 block">
                  {tiedDates.map((d) => `${formatDateKorean(d.date)}`).join(', ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRevoteModal();
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto"
              >
                결선 재투표 설정 열기 →
              </button>
            </div>
          )}

          {/* 1. Candidate Dates Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>해당 주차 투표 후보일 설정 (요일별 ON / OFF)</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectWeekdays}
                  className="text-slate-600 hover:text-slate-900 font-semibold"
                >
                  평일만 (월~금)
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className="text-slate-600 hover:text-slate-900 font-semibold"
                >
                  전체 선택
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={handleClearCandidates}
                  className="text-slate-600 hover:text-slate-900 font-semibold"
                >
                  초기화
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {currentWeekDays.map((dateStr) => {
                const isSelected = candidateDates.includes(dateStr);
                const dow = getDayOfWeekKorean(dateStr);
                const isWeekend = dow === '토' || dow === '일';

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleToggleCandidate(dateStr)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-sky-500 text-white border-sky-600 shadow-2xs font-bold'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span
                      className={`text-[11px] ${
                        isSelected
                          ? 'text-sky-100'
                          : isWeekend
                          ? dow === '일'
                            ? 'text-rose-500'
                            : 'text-blue-500'
                          : 'text-slate-500'
                      }`}
                    >
                      {dow}
                    </span>
                    <span className="text-xs mt-0.5">
                      {dateStr.split('-')[2]}일
                    </span>
                    <span className="text-[10px] mt-1">
                      {isSelected ? '활성' : '제외'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              * 활성화된 날짜만 팀원 투표 화면에 선택 가능한 옵션으로 노출됩니다.
            </p>
          </div>

          {/* 2. Final Date Confirmation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>회식일 최종 확정하기</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-600 block mb-1">확정 날짜 선택:</span>
                <select
                  value={confirmedDate || ''}
                  onChange={(e) => setConfirmedDate(e.target.value ? e.target.value : null)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="">-- 아직 미정 (투표 진행 중) --</option>
                  {candidateDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDateKorean(date, true)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-xs text-slate-600 block mb-1">장소 및 시간 안내:</span>
                <input
                  type="text"
                  value={confirmedTimeLocation}
                  onChange={(e) => setConfirmedTimeLocation(e.target.value)}
                  placeholder="예: 18:30 / 역삼역 마장동 김씨"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              확정하면 팀원 화면 상단에 초록색 축하 배너와 함께 장소/시간이 즉시 공지됩니다.
            </p>
          </div>

          {/* 3. Basic Event Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                회식 이벤트 제목
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                상세 설명 및 전달 사항
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  주최자 (총무) 이름
                </label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>투표 마감 일시 설정</span>
                  <span className="text-[11px] text-amber-700 font-normal">타이머 연동</span>
                </label>
                <input
                  type="datetime-local"
                  value={deadline.includes(' ') && !deadline.includes('T') ? deadline.replace(' ', 'T') : deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                
                {/* Quick preset buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">빠른 마감 설정:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(18, 0, 0, 0);
                      const yr = d.getFullYear();
                      const mo = String(d.getMonth() + 1).padStart(2, '0');
                      const da = String(d.getDate()).padStart(2, '0');
                      setDeadline(`${yr}-${mo}-${da}T18:00`);
                    }}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    내일 18:00
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      d.setHours(18, 0, 0, 0);
                      const yr = d.getFullYear();
                      const mo = String(d.getMonth() + 1).padStart(2, '0');
                      const da = String(d.getDate()).padStart(2, '0');
                      setDeadline(`${yr}-${mo}-${da}T18:00`);
                    }}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    3일 뒤 18:00
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      d.setHours(18, 0, 0, 0);
                      const yr = d.getFullYear();
                      const mo = String(d.getMonth() + 1).padStart(2, '0');
                      const da = String(d.getDate()).padStart(2, '0');
                      setDeadline(`${yr}-${mo}-${da}T18:00`);
                    }}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    1주일 뒤 18:00
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
            >
              설정 저장하기
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
