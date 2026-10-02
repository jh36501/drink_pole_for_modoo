import React, { useState } from 'react';
import { PollConfig } from '../types';
import { X, Copy, Check, Link2, ShieldCheck, Users, MessageSquare } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PollConfig;
  onNotify: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  config,
  onNotify,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin + window.location.pathname;
  const voterLink = `${currentOrigin}?mode=voter`;
  const adminLink = `${currentOrigin}?mode=admin`;

  const copyToClipboard = async (text: string, type: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      onNotify(message);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      onNotify('복사에 실패했습니다. 직접 복사해주세요.');
    }
  };

  const inviteMessage = `[📢 ${config.title}]
안녕하세요, 팀원 여러분! 팀 회식 일정 투표가 시작되었습니다.
아래 링크에서 참여 가능한 날짜를 선택해주세요! (다중 선택 가능)

🔗 투표 링크: ${voterLink}
⏰ 마감 일시: ${config.deadline}
주최: ${config.organizer}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                투표 링크 공유하기
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                팀원들이 바로 투표할 수 있는 전용 링크를 공유하세요.
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
          
          {/* Member Voting Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>팀원 전용 투표 링크</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={voterLink}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-600 font-mono select-all"
              />
              <button
                onClick={() => copyToClipboard(voterLink, 'voter', '팀원 투표 링크가 복사되었습니다!')}
                className="px-3 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                {copiedType === 'voter' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>복사</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              * 팀원들이 접속하여 본인 이름을 입력하고 투표할 수 있습니다.
            </p>
          </div>

          {/* Admin Management Link */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>총무(관리자) 관리 링크</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={adminLink}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-600 font-mono select-all"
              />
              <button
                onClick={() => copyToClipboard(adminLink, 'admin', '총무 관리 링크가 복사되었습니다!')}
                className="px-3 py-2 text-xs font-bold text-sky-950 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                {copiedType === 'admin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>복사</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              * 후보일 설정 및 회식일 최종 확정이 가능한 관리자 모드로 즉시 열립니다.
            </p>
          </div>

          {/* Slack / Kakao Invite Template */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>슬랙 / 카카오톡 초대 메시지 복사</span>
            </label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans max-h-32 overflow-y-auto">
              {inviteMessage}
            </div>
            <button
              onClick={() => copyToClipboard(inviteMessage, 'invite', '초대 메시지가 복사되었습니다!')}
              className="w-full py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedType === 'invite' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>초대 메시지 전체 복사</span>
            </button>
          </div>

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
