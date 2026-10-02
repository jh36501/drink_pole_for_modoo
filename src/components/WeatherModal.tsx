import React, { useState, useEffect } from 'react';
import { DayWeatherInfo } from '../types';
import { formatDateKorean, formatShortDate } from '../utils/dateUtils';
import { X, Search, CloudSun, RefreshCw, AlertCircle, MapPin, Sparkles, Umbrella, Thermometer } from 'lucide-react';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekStartDate: string;
  confirmedLocation?: string;
}

const QUICK_SEARCH_CHIPS = [
  '신논현',
  '강남',
  '종로',
  '여의도',
  '판교',
  '부산',
  '제주',
  '10/06',
  '화요일',
];

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weekStartDate,
  confirmedLocation,
}) => {
  const [query, setQuery] = useState('');
  const [weatherList, setWeatherList] = useState<DayWeatherInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchWeather = async (searchTerm = '') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const url = searchTerm.trim()
        ? `/api/weather/search?query=${encodeURIComponent(searchTerm.trim())}&weekStartDate=${weekStartDate}`
        : `/api/weather?weekStartDate=${weekStartDate}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {
        setWeatherList(data.items);
      } else {
        setWeatherList([]);
      }
      setHasSearched(true);
    } catch (e) {
      console.error('Failed to load weather:', e);
      setErrorMessage('날씨 정보를 불러오는 중 오류가 발생했습니다.');
      setWeatherList([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      fetchWeather('');
    }
  }, [isOpen, weekStartDate]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather(query);
  };

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    fetchWeather(chip);
  };

  const handleResetSearch = () => {
    setQuery('');
    fetchWeather('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-sky-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center shadow-sm ring-4 ring-sky-100">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  회식 주간 저녁 날씨 조회
                </h2>
                <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                  기상청 실시간 연동
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                퇴근 및 1·2차 이동 시간대(저녁 18:00~21:00)의 예상 기온과 날씨 이모티콘을 조회합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchWeather(query)}
              disabled={isLoading}
              title="날씨 데이터 새로고침"
              className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="지역, 회식 장소 또는 날짜 검색 (예: 신논현, 강남, 종로, 10/06, 화요일, 비)"
                className="w-full pl-10 pr-24 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium shadow-2xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                >
                  지우기
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>검색</span>
            </button>
          </form>

          {/* Quick search suggestion chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium text-[11px] mr-1">추천 검색어:</span>
            {QUICK_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  query === chip
                    ? 'bg-sky-500 text-white border-sky-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-700'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-600">
                기상청 공공데이터 포털에서 저녁 날씨 데이터를 조회하고 있습니다...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          ) : weatherList.length === 0 && hasSearched ? (
            /* EXACT "결과 없음" Requirement */
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">
                결과 없음
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                입력하신 검색어 <strong>&quot;{query}&quot;</strong>에 일치하는 날씨 예보 데이터가 없습니다.
              </p>
              <div className="mt-4">
                <button
                  onClick={handleResetSearch}
                  className="px-4 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                >
                  기본 회식 일정 날씨(전체) 보기
                </button>
              </div>
            </div>
          ) : (
            /* Results Table */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  총 <strong>{weatherList.length}개</strong>의 저녁 날씨 예보가 검색되었습니다.
                </span>
                {confirmedLocation && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    현재 회식 장소: <strong>{confirmedLocation}</strong>
                  </span>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-3.5 w-32">일자 (요일)</th>
                      <th className="py-3 px-3 w-36">시간대</th>
                      <th className="py-3 px-3 text-center w-28">날씨 상태</th>
                      <th className="py-3 px-3 text-center w-28">저녁 기온</th>
                      <th className="py-3 px-3 text-center w-28">일 최저 / 최고</th>
                      <th className="py-3 px-3 text-center w-24">강수확률</th>
                      <th className="py-3 px-4">회식 추천 팁 &amp; 비고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {weatherList.map((item) => {
                      const isRainy = item.weatherText.includes('비') || item.rainProbability >= 60;

                      return (
                        <tr
                          key={item.date}
                          className="hover:bg-sky-50/40 transition-colors"
                        >
                          {/* Date */}
                          <td className="py-3.5 px-3.5 font-bold whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                  item.dayOfWeek === '토'
                                    ? 'bg-blue-50 text-blue-700'
                                    : item.dayOfWeek === '일'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.dayOfWeek}
                              </span>
                              <span>{formatShortDate(item.date)}</span>
                            </div>
                          </td>

                          {/* TimeSlot */}
                          <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700">
                              {item.timeSlot}
                            </span>
                          </td>

                          {/* Weather Emoji & Text */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                              <span className="text-xl" title={item.weatherText}>
                                {item.emoji}
                              </span>
                              <span className="text-xs">{item.weatherText}</span>
                            </div>
                          </td>

                          {/* Evening Temp */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span className="text-base font-extrabold text-sky-950 font-mono">
                              {item.eveningTemp}°C
                            </span>
                          </td>

                          {/* Min / Max */}
                          <td className="py-3.5 px-3 text-center font-mono text-slate-500 whitespace-nowrap">
                            <span className="text-blue-600 font-semibold">{item.minTemp}°</span>
                            <span className="mx-1 text-slate-300">/</span>
                            <span className="text-rose-600 font-semibold">{item.maxTemp}°</span>
                          </td>

                          {/* Rain Prob */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                                isRainy
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Umbrella className="w-3 h-3" />
                              {item.rainProbability}%
                            </span>
                          </td>

                          {/* Tips */}
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-600 leading-relaxed">
                            {item.recommendationTip}
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>
              기상청 중기예보서비스(오후/저녁시간대) 기준이며, 주간 투표 시 비/기온 변화를 사전에 파악할 수 있습니다.
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
