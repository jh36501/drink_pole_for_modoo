import { PollConfig, VoterRecord } from '../types';
import { loadPollData, savePollData } from './storage';

export interface PollApiResponse {
  config: PollConfig;
  votes: VoterRecord[];
  version?: number;
  lastModified?: string;
}

export async function fetchSharedPoll(): Promise<PollApiResponse> {
  try {
    const res = await fetch('/api/poll');
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data: PollApiResponse = await res.json();
    // Cache to localStorage as local offline backup
    savePollData(data.config, data.votes);
    return data;
  } catch (err) {
    console.warn('API fetch failed, falling back to local cache:', err);
    return loadPollData();
  }
}

export async function submitSharedVote(
  voterData: Omit<VoterRecord, 'id' | 'updatedAt'>,
  existingId?: string
): Promise<PollApiResponse> {
  try {
    const res = await fetch('/api/poll/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...voterData,
        existingId,
      }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || '투표 제출에 실패했습니다.');
    }
    const data: PollApiResponse = await res.json();
    savePollData(data.config, data.votes);
    return data;
  } catch (err) {
    console.warn('Network submission failed, using local storage fallback:', err);
    throw err;
  }
}

export async function deleteSharedVote(voteId: string): Promise<PollApiResponse> {
  const res = await fetch(`/api/poll/vote/${encodeURIComponent(voteId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('투표 삭제에 실패했습니다.');
  }
  const data: PollApiResponse = await res.json();
  savePollData(data.config, data.votes);
  return data;
}

export async function updateSharedConfig(
  newConfig: PollConfig,
  updatedVotes?: VoterRecord[]
): Promise<PollApiResponse> {
  const res = await fetch('/api/poll/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...newConfig,
      updatedVotes,
    }),
  });
  if (!res.ok) {
    throw new Error('설정 업데이트에 실패했습니다.');
  }
  const data: PollApiResponse = await res.json();
  savePollData(data.config, data.votes);
  return data;
}

export async function resetSharedPoll(): Promise<PollApiResponse> {
  const res = await fetch('/api/poll/reset', {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('데이터 초기화에 실패했습니다.');
  }
  const data: PollApiResponse = await res.json();
  savePollData(data.config, data.votes);
  return data;
}

export async function importSharedPoll(payload: {
  config: PollConfig;
  votes: VoterRecord[];
}): Promise<PollApiResponse> {
  const res = await fetch('/api/poll/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('데이터 가져오기에 실패했습니다.');
  }
  const data: PollApiResponse = await res.json();
  savePollData(data.config, data.votes);
  return data;
}

/**
 * Real-time synchronization helper:
 * Uses Server-Sent Events (SSE) for instant push updates,
 * with periodic polling as resilient fallback.
 */
export function subscribeToSharedPoll(
  onUpdate: (data: PollApiResponse) => void,
  onStatusChange?: (status: 'connected' | 'connecting' | 'offline') => void
): () => void {
  let eventSource: EventSource | null = null;
  let pollInterval: NodeJS.Timeout | null = null;
  let isMounted = true;
  let lastKnownVersion: number | null = null;

  const handleNewData = (incoming: PollApiResponse) => {
    if (!isMounted || !incoming || !incoming.config || !Array.isArray(incoming.votes)) return;
    if (incoming.version !== undefined && lastKnownVersion !== null) {
      if (incoming.version === lastKnownVersion) {
        // No version bump, skip re-render
        return;
      }
    }
    if (incoming.version !== undefined) {
      lastKnownVersion = incoming.version;
    }
    onUpdate(incoming);
  };

  const connectSSE = () => {
    try {
      if (typeof window === 'undefined' || !window.EventSource) {
        startPolling();
        return;
      }

      onStatusChange?.('connecting');
      eventSource = new EventSource('/api/poll/events');

      eventSource.onopen = () => {
        if (!isMounted) return;
        onStatusChange?.('connected');
      };

      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const parsed = JSON.parse(event.data);
          handleNewData(parsed);
        } catch (e) {
          console.error('Failed to parse SSE payload:', e);
        }
      };

      eventSource.onerror = () => {
        if (!isMounted) return;
        onStatusChange?.('offline');
        // If SSE fails or drops, start gentle background polling fallback
        startPolling();
      };
    } catch {
      startPolling();
    }
  };

  const startPolling = () => {
    if (pollInterval) return;
    pollInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const data = await fetchSharedPoll();
        handleNewData(data);
      } catch {
        // Ignore background polling network glitches
      }
    }, 4000);
  };

  // Start with immediate connection
  connectSSE();
  // Also poll every 10s to guarantee sync even if browser tabs sleep
  const backupPoll = setInterval(async () => {
    if (!isMounted) return;
    try {
      const data = await fetchSharedPoll();
      handleNewData(data);
    } catch {
      // Ignore
    }
  }, 10000);

  return () => {
    isMounted = false;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    clearInterval(backupPoll);
  };
}
