'use client';

import Link from 'next/link';
import { useState } from 'react';

export type SidebarVideoItem = {
  id: number;
  title: string;
  order_index: number;
  is_completed: boolean;
  locked: boolean;
};

export type SidebarSection = {
  id: number;
  title: string;
  order_index: number;
  videos: SidebarVideoItem[];
};

type SidebarSectionItemProps = {
  section: SidebarSection;
  subjectId: string;
  activeVideoId: number | null;
};

export default function SidebarSectionItem({ section, subjectId, activeVideoId }: SidebarSectionItemProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-zinc-800"
      >
        <span>
          {section.order_index}. {section.title}
        </span>
        <span className="text-xs text-zinc-500">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen ? (
        <ul className="space-y-1 px-2 pb-2">
          {section.videos.map((video) => {
            const isActive = activeVideoId === video.id;

            return (
              <li key={video.id}>
                <Link
                  href={`/subjects/${subjectId}/video/${video.id}`}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                    isActive ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
                  } ${video.locked ? 'opacity-70' : ''}`}
                >
                  <span className="truncate">
                    {video.order_index}. {video.title}
                  </span>
                  <span className="ml-2 shrink-0">
                    {video.locked ? '🔒' : video.is_completed ? '✓' : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
