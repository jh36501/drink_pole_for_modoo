import React, { useState } from 'react';
import { PollConfig, VoterRecord } from '../types';
import { X, Copy, Check, Download, Upload, RotateCcw, AlertTriangle, FileJson } from 'lucide-react';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PollConfig;
  votes: VoterRecord[];
  onImportData: (data: { config: PollConfig; votes: VoterRecord[] }) => void;
  onResetData: () => void;
  onNotify: (msg: string) => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({
  isOpen,
  onClose,
  config,
  votes,
  onImportData,
  onResetData,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isImportMode, setIsImportMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentPayload = {
    exportedAt: new Date().toISOString(),
    config,
    votes,
  };
  const currentJsonString = JSON.stringify(currentPayload, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentJsonString);
      setCopied(true);
      onNotify('JSON 데이터가 복사되었습니다!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify('복사에 실패했습니다.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-dinner-schedule-${config.weekStartDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('JSON 파일이 다운로드되었습니다.');
  };

  const handleImport = () => {
    try {
      setErrorMsg('');
      const parsed = JSON.parse(jsonInput);
      if (!parsed.config || !Array.isArray(parsed.votes)) {
        throw new Error('올바른 형식의 회식 투표 JSON 데이터가 아닙니다. (config와 votes 배열 필요)');
      }
      onImportData({ config: parsed.config, votes: parsed.votes });
      onNotify('성공적으로 데이터를 가져왔습니다!');
      setIsImportMode(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'JSON 파싱 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                JSON 데이터 관리 및 팀 공유
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                별도 DBMS 없이 서버의 가벼운 파일 저장소를 통해 팀원 간 실시간 공유됩니다.
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
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
            <button
              onClick={() => {
                setIsImportMode(false);
                setErrorMsg('');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                !isImportMode
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              내보내기 (Export)
            </button>
            <button
              onClick={() => {
                setIsImportMode(true);
                setErrorMsg('');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                isImportMode
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              가져오기 (Import)
            </button>
          </div>

          {!isImportMode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>현재 투표 상태 (후보일 {config.candidateDates.length}개, 투표자 {votes.length}명)</span>
                <span className="font-mono">JSON</span>
              </div>

              <textarea
                readOnly
                rows={9}
                value={currentJsonString}
                className="w-full p-3 text-xs bg-slate-900 text-slate-100 rounded-xl font-mono leading-relaxed select-all"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>JSON 클립보드 복사</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>.json 파일 다운로드</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <label className="block text-xs font-bold text-slate-700">
                가져올 JSON 텍스트 붙여넣기
              </label>
              <textarea
                rows={9}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"config": {...}, "votes": [...]}'
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <button
                onClick={handleImport}
                disabled={!jsonInput.trim()}
                className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>데이터 적용하기</span>
              </button>
            </div>
          )}

          {/* Reset button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                if (window.confirm('기본 샘플 데이터로 복원하시겠습니까? 현재 입력된 내용은 대체됩니다.')) {
                  onResetData();
                  onNotify('기본 샘플 데이터로 복원되었습니다.');
                  onClose();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>기본 샘플 데이터로 초기화</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
