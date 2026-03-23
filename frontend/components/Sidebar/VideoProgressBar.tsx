'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useProgressStore } from '@/lib/progress';

type SubjectProgressResponse = {
  percent_complete: number;
};

type VideoProgressBarProps = {
  subjectId: string;
};

export default function VideoProgressBar({ subjectId }: VideoProgressBarProps) {
  const completionTick = useProgressStore((state) => state.completionTick);
  const [percentComplete, setPercentComplete] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      try {
        const response = await apiClient.get(`/api/progress/subjects/${subjectId}`);
        if (!cancelled) {
          const data = response.data as SubjectProgressResponse;
          setPercentComplete(Math.max(0, Math.min(100, data.percent_complete ?? 0)));
        }
      } catch {
        if (!cancelled) {
          setPercentComplete(0);
        }
      }
    };

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, [subjectId, completionTick]);

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200">
      <div
        className="h-full bg-zinc-900 transition-all"
        style={{ width: `${percentComplete}%` }}
        aria-label={`Subject progress ${Math.round(percentComplete)} percent`}
      />
    </div>
  );
}
