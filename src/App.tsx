import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PollConfig, VoterRecord, DateVoteSummary, ViewMode, UserRole, DayWeatherInfo } from './types';
import { 
  loadPollData, 
  savePollData, 
  resetPollData,
  getDefaultPollConfig 
} from './utils/storage';
import {
  fetchSharedPoll,
  submitSharedVote,
  deleteSharedVote,
  updateSharedConfig,
  resetSharedPoll,
  importSharedPoll,
  subscribeToSharedPoll
} from './utils/api';
import { 
  getDaysInWeek, 
  getDayOfWeekKorean, 
  shiftWeek, 
  getMondayOfWeek,
  formatDateKorean,
  parseDeadline,
  calculateRemainingTime,
  formatDateTimeLocal
} from './utils/dateUtils';
import { Navbar } from './components/Navbar';
import { HeroSummary } from './components/HeroSummary';
import { DeadlineTimer } from './components/DeadlineTimer';
import { WeeklyCalendarView } from './components/WeeklyCalendarView';
import { MatrixView } from './components/MatrixView';
import { MembersView } from './components/MembersView';
import { VoteModal } from './components/VoteModal';
import { AdminPanel } from './components/AdminPanel';
import { DateDetailModal } from './components/DateDetailModal';
import { ShareModal } from './components/ShareModal';
import { AnnouncementModal } from './components/AnnouncementModal';
import { JsonModal } from './components/JsonModal';
import { RevoteModal } from './components/RevoteModal';
import { WeatherModal } from './components/WeatherModal';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  // Load initial poll data from local cache or defaults (instant first paint)
  const [data, setData] = useState<{ config: PollConfig; votes: VoterRecord[] }>(() => loadPollData());
  const { config, votes } = data;

  // Real-time team shared synchronization status
  const [syncStatus, setSyncStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');

  // Real-time ticking clock for deadline countdown (updates every 1s)
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync team poll data with server in real time (No heavy DBMS needed, lightweight file store)
  useEffect(() => {
    // 1. Initial fetch from server
    fetchSharedPoll()
      .then((res) => {
        setData({ config: res.config, votes: res.votes });
      })
      .catch((err) => {
        console.warn('Initial server fetch failed, using local cache:', err);
      });

    // 2. Real-time push updates via SSE and background polling fallback
    const unsubscribe = subscribeToSharedPoll(
      (updated) => {
        setData({ config: updated.config, votes: updated.votes });
      },
      (status) => {
        setSyncStatus(status);
      }
    );

    return () => unsubscribe();
  }, []);

  // View state & navigation
  const [role, setRole] = useState<UserRole>('voter');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  // Modals state
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [editingVote, setEditingVote] = useState<VoterRecord | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isRevoteModalOpen, setIsRevoteModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [weatherMap, setWeatherMap] = useState<Record<string, DayWeatherInfo>>({});

  // Fetch weather forecast whenever current weekStartDate changes
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/weather?weekStartDate=${config.weekStartDate}`)
      .then((r) => r.json())
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.items)) {
          const map: Record<string, DayWeatherInfo> = {};
          res.items.forEach((item: DayWeatherInfo) => {
            map[item.date] = item;
          });
          setWeatherMap(map);
        }
      })
      .catch((err) => {
        console.warn('Weather fetch failed:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [config.weekStartDate]);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync role with query parameter '?mode=admin' or '?mode=voter'
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      if (modeParam === 'admin') {
        setRole('admin');
      } else if (modeParam === 'voter') {
        setRole('voter');
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Save to shared server & local cache
  const updateData = async (newConfig: PollConfig, newVotes?: VoterRecord[]) => {
    const currentVotes = newVotes !== undefined ? newVotes : votes;
    setData({ config: newConfig, votes: currentVotes });
    savePollData(newConfig, currentVotes);

    try {
      const res = await updateSharedConfig(newConfig, newVotes);
      setData({ config: res.config, votes: res.votes });
    } catch (err) {
      console.warn('Failed to sync config with server, saved locally:', err);
    }
  };

  // Days in current selected week
  const weekDays = useMemo(() => {
    return getDaysInWeek(config.weekStartDate);
  }, [config.weekStartDate]);

  // Deadline & Countdown calculations
  const deadlineDate = useMemo(() => parseDeadline(config.deadline), [config.deadline]);
  const remainingTime = useMemo(() => calculateRemainingTime(deadlineDate, now), [deadlineDate, now]);
  const isVotingDisabled = remainingTime.isExpired;

  // Extend deadline helper (for Admin or quick action)
  const handleExtendDeadline = (hoursToAdd: number) => {
    const base = deadlineDate && !remainingTime.isExpired ? deadlineDate : new Date();
    const newDeadline = new Date(base.getTime() + hoursToAdd * 3600 * 1000);
    const updatedConfig: PollConfig = {
      ...config,
      deadline: formatDateTimeLocal(newDeadline),
      lastUpdated: new Date().toISOString(),
    };
    updateData(updatedConfig, votes);
    addToast(`마감 시간이 ${hoursToAdd}시간 연장되었습니다. (새 마감: ${formatDateTimeLocal(newDeadline).replace('T', ' ')})`, 'success');
  };

  // Compute vote counts, attendees, and top date
  const daySummaries: DateVoteSummary[] = useMemo(() => {
    // Find the max count among candidates
    let maxCount = 0;
    config.candidateDates.forEach((date) => {
      const count = votes.filter((v) => v.selectedDates.includes(date)).length;
      if (count > maxCount) {
        maxCount = count;
      }
    });

    return weekDays.map((date) => {
      const isCandidate = config.candidateDates.includes(date);
      const attendees = votes.filter((v) => v.selectedDates.includes(date));
      const absentees = votes.filter((v) => !v.selectedDates.includes(date));
      const voterCount = attendees.length;
      const totalVoters = votes.length;
      const percentage = totalVoters > 0 ? Math.round((voterCount / totalVoters) * 100) : 0;
      const isTop = isCandidate && maxCount > 0 && voterCount === maxCount;
      const isConfirmed = config.confirmedDate === date;

      return {
        date,
        dayOfWeek: getDayOfWeekKorean(date),
        isCandidate,
        voterCount,
        totalVoters,
        percentage,
        attendees,
        absentees,
        isTop,
        isConfirmed,
      };
    });
  }, [weekDays, config.candidateDates, config.confirmedDate, votes]);

  // Summaries of candidate dates only
  const candidateSummaries = useMemo(() => {
    return daySummaries.filter((d) => d.isCandidate);
  }, [daySummaries]);

  // Top overall candidate summary
  const topSummary = useMemo(() => {
    return candidateSummaries.find((d) => d.isTop && d.voterCount > 0) || null;
  }, [candidateSummaries]);

  // Find all tied top dates
  const tiedDates = useMemo(() => {
    return candidateSummaries.filter((d) => d.isTop && d.voterCount > 0);
  }, [candidateSummaries]);

  // Start runoff revote on tied dates
  const handleStartRevote = ({
    newTitle,
    newCandidateDates,
    newDeadline,
    resetVotes,
  }: {
    newTitle: string;
    newCandidateDates: string[];
    newDeadline: string;
    resetVotes: boolean;
  }) => {
    const nextRound = (config.round || 1) + 1;
    const updatedConfig: PollConfig = {
      ...config,
      title: newTitle,
      candidateDates: newCandidateDates,
      deadline: newDeadline,
      confirmedDate: null,
      status: 'active',
      round: nextRound,
      isRunoff: true,
      previousCandidates: config.candidateDates,
      lastUpdated: new Date().toISOString(),
    };

    let updatedVotes: VoterRecord[];
    if (resetVotes) {
      updatedVotes = votes.map((v) => ({
        ...v,
        selectedDates: [],
        updatedAt: new Date().toISOString(),
      }));
    } else {
      updatedVotes = votes.map((v) => ({
        ...v,
        selectedDates: v.selectedDates.filter((d) => newCandidateDates.includes(d)),
        updatedAt: new Date().toISOString(),
      }));
    }

    updateData(updatedConfig, updatedVotes);
    addToast(`동점 일자(${newCandidateDates.length}개)로 ${nextRound}차 결선 재투표가 시작되었습니다!`, 'success');
  };

  // Selected date summary for detail modal
  const selectedDateSummary = useMemo(() => {
    if (!selectedDateForModal) return null;
    return daySummaries.find((d) => d.date === selectedDateForModal) || null;
  }, [selectedDateForModal, daySummaries]);

  // Switch role handler
  const handleToggleRole = () => {
    const nextRole = role === 'admin' ? 'voter' : 'admin';
    setRole(nextRole);
    addToast(
      nextRole === 'admin' 
        ? '총무(관리자) 모드로 전환되었습니다. 후보일 설정 및 회식일 확정이 가능합니다.' 
        : '팀원 모드로 전환되었습니다. 이름 입력 후 일정 투표에 참여하세요.',
      'info'
    );
  };

  // Week navigation
  const handleShiftWeek = (offset: number) => {
    const newMonday = shiftWeek(config.weekStartDate, offset);
    // When changing week, make Mon-Fri candidates for that week if not set
    const newWeekDays = getDaysInWeek(newMonday);
    const newCandidates = newWeekDays.slice(1, 5); // Tue - Fri default

    const updatedConfig: PollConfig = {
      ...config,
      weekStartDate: newMonday,
      candidateDates: newCandidates,
      confirmedDate: null,
      lastUpdated: new Date().toISOString(),
    };
    updateData(updatedConfig, votes);
    addToast(`${newMonday} 주차로 이동했습니다.`, 'info');
  };

  const handleResetToCurrentWeek = () => {
    const defaultCfg = getDefaultPollConfig();
    const updatedConfig: PollConfig = {
      ...config,
      weekStartDate: defaultCfg.weekStartDate,
      candidateDates: defaultCfg.candidateDates,
      lastUpdated: new Date().toISOString(),
    };
    updateData(updatedConfig, votes);
    addToast('기본 주차로 이동했습니다.', 'info');
  };

  // Toggle single candidate date (Admin)
  const handleToggleCandidate = (date: string) => {
    const isCurrentlyCandidate = config.candidateDates.includes(date);
    const newCandidates = isCurrentlyCandidate
      ? config.candidateDates.filter((d) => d !== date)
      : [...config.candidateDates, date];

    const updatedConfig: PollConfig = {
      ...config,
      candidateDates: newCandidates,
      confirmedDate: config.confirmedDate === date && isCurrentlyCandidate ? null : config.confirmedDate,
      lastUpdated: new Date().toISOString(),
    };
    updateData(updatedConfig, votes);
    addToast(
      isCurrentlyCandidate
        ? `${formatDateKorean(date)}이(가) 후보일에서 제외되었습니다.`
        : `${formatDateKorean(date)}이(가) 후보일로 활성화되었습니다.`,
      'info'
    );
  };

  // Finalize or toggle confirmed date (Admin)
  const handleSelectConfirmedDate = (date: string | null) => {
    const newConfirmed = config.confirmedDate === date ? null : date;
    const updatedConfig: PollConfig = {
      ...config,
      confirmedDate: newConfirmed,
      lastUpdated: new Date().toISOString(),
    };
    updateData(updatedConfig, votes);
    if (newConfirmed) {
      addToast(`🎉 ${formatDateKorean(newConfirmed, true)}로 회식이 최종 확정되었습니다!`, 'success');
    } else {
      addToast('회식일 확정이 취소되었습니다.', 'info');
    }
  };

  // Submit vote to shared team server
  const handleSubmitVote = async (
    voterData: Omit<VoterRecord, 'id' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (isVotingDisabled) {
      addToast('투표 마감 시간이 경과하여 일정을 제출하거나 수정할 수 없습니다.', 'error');
      return;
    }

    try {
      const res = await submitSharedVote(voterData, existingId);
      setData({ config: res.config, votes: res.votes });
      addToast(`🎉 ${voterData.name}님의 투표가 팀 공유 투표함에 안전하게 등록되었습니다!`, 'success');
    } catch (err: any) {
      addToast(err.message || '투표 제출에 실패했습니다.', 'error');
    }
    setEditingVote(null);
  };

  // Edit vote trigger
  const handleEditVote = (voter: VoterRecord) => {
    setEditingVote(voter);
    setIsVoteModalOpen(true);
  };

  // Delete vote from shared team server
  const handleDeleteVote = async (voteId: string, name: string) => {
    if (isVotingDisabled) {
      addToast('투표 마감 시간이 경과하여 삭제할 수 없습니다.', 'error');
      return;
    }
    if (window.confirm(`'${name}' 님의 투표를 삭제하시겠습니까?`)) {
      try {
        const res = await deleteSharedVote(voteId);
        setData({ config: res.config, votes: res.votes });
        addToast(`${name}님의 투표가 삭제되었습니다.`, 'info');
      } catch {
        addToast('삭제에 실패했습니다.', 'error');
      }
    }
  };

  // Import / Reset JSON on shared server
  const handleImportData = async (imported: { config: PollConfig; votes: VoterRecord[] }) => {
    try {
      const res = await importSharedPoll(imported);
      setData({ config: res.config, votes: res.votes });
      addToast('성공적으로 팀 투표 데이터를 가져왔습니다!', 'success');
    } catch {
      addToast('가져오기에 실패했습니다.', 'error');
    }
  };

  const handleResetData = async () => {
    try {
      const res = await resetSharedPoll();
      setData({ config: res.config, votes: res.votes });
      addToast('기본 데이터로 초기화되었습니다.', 'info');
    } catch {
      const res = resetPollData();
      setData(res);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        role={role}
        onToggleRole={handleToggleRole}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenAnnouncementModal={() => setIsAnnouncementModalOpen(true)}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        onOpenVoteModal={() => {
          setEditingVote(null);
          setIsVoteModalOpen(true);
        }}
        totalVoters={votes.length}
        isVotingDisabled={isVotingDisabled}
        syncStatus={syncStatus}
      />

      {/* Hero Summary & Top Candidate Highlight Banner */}
      <HeroSummary
        config={config}
        votes={votes}
        topSummary={topSummary}
        onOpenVoteModal={() => {
          setEditingVote(null);
          setIsVoteModalOpen(true);
        }}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        isAdmin={role === 'admin'}
        onDateClick={(date) => setSelectedDateForModal(date)}
        isVotingDisabled={isVotingDisabled}
        tiedDates={tiedDates}
        onOpenRevoteModal={() => setIsRevoteModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Real-time Deadline Countdown Timer Banner */}
        <DeadlineTimer
          deadlineStr={config.deadline}
          remainingTime={remainingTime}
          isAdmin={role === 'admin'}
          onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
          onExtendDeadline={handleExtendDeadline}
          tiedDates={tiedDates}
          onOpenRevoteModal={() => setIsRevoteModalOpen(true)}
          round={config.round || 1}
          isRunoff={config.isRunoff}
        />

        {viewMode === 'calendar' && (
          <WeeklyCalendarView
            currentWeekMonday={config.weekStartDate}
            onShiftWeek={handleShiftWeek}
            onResetToCurrentWeek={handleResetToCurrentWeek}
            daySummaries={daySummaries}
            isAdmin={role === 'admin'}
            onToggleCandidate={handleToggleCandidate}
            onSelectConfirmedDate={handleSelectConfirmedDate}
            onDateClick={(date) => setSelectedDateForModal(date)}
            weatherMap={weatherMap}
            onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
          />
        )}

        {viewMode === 'matrix' && (
          <MatrixView
            candidateSummaries={candidateSummaries}
            votes={votes}
            onEditVote={handleEditVote}
            onDeleteVote={handleDeleteVote}
            onOpenVoteModal={() => {
              setEditingVote(null);
              setIsVoteModalOpen(true);
            }}
            isVotingDisabled={isVotingDisabled}
          />
        )}

        {viewMode === 'members' && (
          <MembersView
            votes={votes}
            candidateDatesCount={config.candidateDates.length}
            onEditVote={handleEditVote}
            onDeleteVote={handleDeleteVote}
            onOpenVoteModal={() => {
              setEditingVote(null);
              setIsVoteModalOpen(true);
            }}
            isVotingDisabled={isVotingDisabled}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">모두의 회식</span>
            <span aria-hidden="true">·</span>
            <span>팀 회식 일정 조정 및 투표 시스템</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              투표 링크 공유
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsAnnouncementModalOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              결과 공지 복사
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              데이터 백업
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VoteModal
        isOpen={isVoteModalOpen}
        onClose={() => {
          setIsVoteModalOpen(false);
          setEditingVote(null);
        }}
        candidateSummaries={candidateSummaries}
        existingVote={editingVote}
        onSubmitVote={handleSubmitVote}
        allVoters={votes}
        isVotingDisabled={isVotingDisabled}
      />

      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        config={config}
        daySummaries={daySummaries}
        onUpdateConfig={(newConfig) => {
          updateData(newConfig, votes);
          addToast('총무 설정이 저장되었습니다.', 'success');
        }}
        onSelectConfirmedDate={handleSelectConfirmedDate}
        tiedDates={tiedDates}
        onOpenRevoteModal={() => setIsRevoteModalOpen(true)}
      />

      <DateDetailModal
        summary={selectedDateSummary}
        onClose={() => setSelectedDateForModal(null)}
        isAdmin={role === 'admin'}
        onConfirmDate={handleSelectConfirmedDate}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        config={config}
        onNotify={(msg) => addToast(msg, 'success')}
      />

      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        config={config}
        votes={votes}
        topSummary={topSummary}
        onNotify={(msg) => addToast(msg, 'success')}
        tiedDates={tiedDates}
      />

      <RevoteModal
        isOpen={isRevoteModalOpen}
        onClose={() => setIsRevoteModalOpen(false)}
        config={config}
        tiedDates={tiedDates}
        onStartRevote={handleStartRevote}
      />

      <JsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        config={config}
        votes={votes}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onNotify={(msg) => addToast(msg, 'success')}
      />

      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weekStartDate={config.weekStartDate}
        confirmedLocation={config.confirmedTimeLocation}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
