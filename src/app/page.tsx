'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StocksWidget } from '@/components/widgets/StocksWidget';
import { NewsWidget } from '@/components/widgets/NewsWidget';
import { StreamsWidget } from '@/components/widgets/StreamsWidget';
import { YoutubeWidget } from '@/components/widgets/YoutubeWidget';
import { CalendarWidget } from '@/components/widgets/CalendarWidget';
import { SocialsWidget } from '@/components/widgets/SocialsWidget';
import { Edit2, Check, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const WIDGET_REGISTRY: Record<string, { component: React.FC<any>; label: string; span: number; height?: string }> = {
  stocks: { component: StocksWidget, label: 'Markets', span: 1 },
  news: { component: NewsWidget, label: 'News Feed', span: 2 },
  streams: { component: StreamsWidget, label: 'Live Streams', span: 1 },
  youtube: { component: YoutubeWidget, label: 'YouTube', span: 2 },
  calendar: { component: CalendarWidget, label: 'Calendar', span: 1 },
  socials: { component: SocialsWidget, label: 'Shortcuts', span: 2 },
};

const ALL_WIDGET_IDS = ['stocks', 'news', 'streams', 'youtube', 'calendar', 'socials'];

export default function Home() {
  const { config, updateConfig } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);

  if (!config) return null;

  const activeWidgets = config.widgets.filter(id => WIDGET_REGISTRY[id]);
  const inactiveWidgets = ALL_WIDGET_IDS.filter(id => !config.widgets.includes(id));

  const moveWidget = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= activeWidgets.length) return;
    const arr = [...config.widgets];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    updateConfig({ widgets: arr });
  };

  const toggleWidget = (id: string) => {
    const isActive = config.widgets.includes(id);
    const newWidgets = isActive ? config.widgets.filter(w => w !== id) : [...config.widgets, id];
    updateConfig({ widgets: newWidgets });
  };

  // Group widgets into rows for better layout
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentSpan = 0;

  activeWidgets.forEach(id => {
    const w = WIDGET_REGISTRY[id];
    if (!w) return;
    if (currentSpan + w.span > 3 && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
      currentSpan = 0;
    }
    currentRow.push(id);
    currentSpan += w.span;
  });
  if (currentRow.length > 0) rows.push(currentRow);

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0 md:pl-20">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 md:px-8 bg-black/40 backdrop-blur-md border-b border-white/5">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white/90">
          Dashboard
        </h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all shadow-lg backdrop-blur-md",
            isEditing
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
              : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white"
          )}
        >
          {isEditing ? <><Check className="h-4 w-4" /><span>Done</span></> : <><Edit2 className="h-4 w-4" /><span>Edit Layout</span></>}
        </button>
      </div>

      {/* Edit Panel */}
      {isEditing && (
        <div className="mx-3 md:mx-5 mt-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Reorder & Toggle Widgets</p>
          <div className="space-y-2">
            {activeWidgets.map((id, idx) => {
              const w = WIDGET_REGISTRY[id];
              return (
                <div key={id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <GripVertical className="w-4 h-4 text-white/20 shrink-0" />
                  <span className="text-sm font-medium text-white/80 flex-1">{w.label}</span>
                  <span className="text-[10px] text-white/20 mr-2">{w.span > 1 ? 'Wide' : 'Normal'}</span>
                  <button onClick={() => moveWidget(idx, -1)} disabled={idx === 0} className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-all">
                    <ChevronUp className="w-4 h-4 text-white/50" />
                  </button>
                  <button onClick={() => moveWidget(idx, 1)} disabled={idx === activeWidgets.length - 1} className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-all">
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  </button>
                  <button onClick={() => toggleWidget(id)} className="p-1 rounded-lg hover:bg-red-500/10 transition-all" title="Hide widget">
                    <EyeOff className="w-4 h-4 text-white/30 hover:text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
          {inactiveWidgets.length > 0 && (
            <>
              <p className="text-[10px] text-white/25 uppercase tracking-wider">Hidden</p>
              <div className="space-y-2">
                {inactiveWidgets.map(id => {
                  const w = WIDGET_REGISTRY[id];
                  return (
                    <div key={id} className="flex items-center gap-3 bg-white/[0.02] border border-dashed border-white/5 rounded-xl px-4 py-3 opacity-50">
                      <span className="text-sm font-medium text-white/40 flex-1">{w.label}</span>
                      <button onClick={() => toggleWidget(id)} className="p-1 rounded-lg hover:bg-emerald-500/10 transition-all" title="Show widget">
                        <Eye className="w-4 h-4 text-white/30 hover:text-emerald-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Dashboard Grid - rendered row by row */}
      <div className="p-3 md:p-5 space-y-4">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-[minmax(380px,auto)]">
            {row.map(id => {
              const w = WIDGET_REGISTRY[id];
              if (!w) return null;
              return (
                <div
                  key={id}
                  className={cn(
                    "rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl",
                    w.span === 2 && "xl:col-span-2",
                    isEditing && "ring-2 ring-blue-500/20 ring-offset-2 ring-offset-black"
                  )}
                >
                  <w.component />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
