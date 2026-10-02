import React, { useState } from 'react';
import { PollConfig, VoterRecord, DateVoteSummary } from '../types';
import { formatDateKorean } from '../utils/dateUtils';
import { X, Copy, Check, MessageSquare, Sparkles } from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PollConfig;
  votes: VoterRecord[];
  topSummary: DateVoteSummary | null;
  onNotify: (msg: string) => void;
  tiedDates?: DateVoteSummary[];
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  config,
  votes,
  topSummary,
  onNotify,
  tiedDates = [],
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isConfirmed = Boolean(config.confirmedDate);
  const isRunoff = Boolean(config.isRunoff);
  const hasTie = tiedDates.length >= 2;
  const targetDate = config.confirmedDate || topSummary?.date;
  const targetAttendees = targetDate
    ? votes.filter((v) => v.selectedDates.includes(targetDate))
    : [];

  // Menu popularity count
  const menuCounts: Record<string, number> = {};
  votes.forEach((v) => {
    if (v.preferredMenu && v.preferredMenu !== '상관없음 (모두 좋아요)') {
      menuCounts[v.preferredMenu] = (menuCounts[v.preferredMenu] || 0) + 1;
    }
  });
  const topMenu = Object.entries(menuCounts).sort((a, b) => b[1] - a[1])[0];

  // Notes summary
  const notableNotes = votes
    .filter((v) => v.note && v.note.trim())
    .slice(0, 3)
    .map((v) => `· ${v.name}: ${v.note}`);

  let formattedText = '';

  if (isConfirmed) {
    formattedText = `[📢 팀 회식 일정 최종 확정 안내]

안녕하세요 팀원 여러분! ${config.organizer}입니다.
팀원분들의 일정을 취합하여 이번 회식 일정을 최종 확정하였습니다.

🍗 확정 일자: ${targetDate ? formatDateKorean(targetDate, true) : '추후 공지'}
📍 장소 및 시간: ${config.confirmedTimeLocation || '18:30 / 추후 안내'}
👥 참석 가능 인원 (${targetAttendees.length}명 / 총 ${votes.length}명):
${targetAttendees.map((a) => a.name).join(', ')}

${topMenu ? `🥩 인기 선호 메뉴: ${topMenu[0]} (${topMenu[1]}명 선호)\n` : ''}${
      notableNotes.length > 0 ? `💬 전달 메모:\n${notableNotes.join('\n')}\n` : ''
    }
모두 일정 캘린더에 등록 부탁드리며, 예약 완료 후 식당 링크를 추가 공유하겠습니다. 감사합니다!`;
  } else if (isRunoff) {
    formattedText = `[📢 팀 회식 ${config.round || 2}차 결선 재투표 안내]

안녕하세요 팀원 여러분! ${config.organizer}입니다.
이전 투표에서 최다 득표 일자들의 동점이 발생하여, 해당 일자들만으로 [${config.round || 2}차 결선 재투표]를 진행합니다.

⚔️ 결선 후보 일자:
${config.candidateDates.map((d) => `· ${formatDateKorean(d, true)}`).join('\n')}

⏰ 결선 투표 마감: ${config.deadline}
최종 회식일을 결정하기 위해 링크에서 꼭 다시 투표에 참여해주세요!`;
  } else if (hasTie) {
    formattedText = `[📊 팀 회식 일정 투표 결과: 동점 발생 안내]

안녕하세요 팀원 여러분! ${config.organizer}입니다.
투표 마감 결과 최다 득표일이 동률을 기록하였습니다.

⚔️ 동점 일자 (${tiedDates.length}개):
${tiedDates.map((d) => `· ${formatDateKorean(d.date, true)} (각 ${d.voterCount}명 가능)`).join('\n')}

최종 회식일 선정을 위해 동점 일자들만을 대상으로 결선 재투표가 진행될 예정입니다.`;
  } else {
    formattedText = `[📊 팀 회식 일정 투표 중간 현황 안내]

안녕하세요 팀원 여러분! ${config.organizer}입니다.
현재까지 총 ${votes.length}명의 팀원이 회식 일정 투표에 참여해주셨습니다.

👑 현재 1위 후보일: ${targetDate ? formatDateKorean(targetDate, true) : '투표 집계 중'}
👥 현재 참여 가능 인원: ${targetAttendees.length}명
참여자 명단: ${targetAttendees.map((a) => a.name).join(', ')}

아직 투표하지 않으신 팀원분들은 ${config.deadline}까지 참여 가능 일자를 꼭 선택해주세요!`;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      onNotify('공지 텍스트가 클립보드에 복사되었습니다!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify('복사에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                슬랙 / 카카오톡 공지문 생성기
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                메신저에 바로 복사하여 팀원들에게 공지할 수 있는 완성형 텍스트입니다.
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

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              {isConfirmed ? '🎉 확정 공지 템플릿' : '📊 중간 집계 안내 템플릿'}
            </span>
            <span className="text-[11px] text-slate-400">마크다운 및 줄바꿈 지원</span>
          </div>

          <textarea
            readOnly
            rows={10}
            value={formattedText}
            className="w-full p-3.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl font-mono leading-relaxed select-all focus:outline-none"
          />

          <button
            onClick={handleCopy}
            className="w-full py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-sky-200" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사 완료!' : '공지문 클립보드에 1초 복사'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
