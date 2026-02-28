'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
// @ts-ignore - react-grid-layout ESM types are incomplete
import { Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAppStore, WidgetLayout } from '@/store/useAppStore';
import { Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardGridProps {
    widgetComponents: Record<string, React.FC<any>>;
}

export function DashboardGrid({ widgetComponents }: DashboardGridProps) {
    const { config, updateConfig } = useAppStore();
    const [isEditing, setIsEditing] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [width, setWidth] = useState(1200);
    const containerRef = useRef<HTMLDivElement>(null);

    // Measure container width with ResizeObserver
    useEffect(() => {
        setMounted(true);
        const node = containerRef.current;
        if (!node) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });
        observer.observe(node);
        setWidth(node.offsetWidth);

        return () => observer.disconnect();
    }, []);

    if (!config || !mounted) return null;

    const currentLayout = config.layout.filter(l => config.widgets.includes(l.i));

    const handleLayoutChange = (layout: any[]) => {
        if (!isEditing) return;

        const newLayouts = layout.map(l => {
            const existing = config.layout.find(cl => cl.i === l.i);
            return {
                ...existing,
                i: l.i,
                x: l.x,
                y: l.y,
                w: l.w,
                h: l.h,
            } as WidgetLayout;
        });

        updateConfig({ layout: newLayouts });
    };

    const activeWidgets = config.widgets.filter(id => widgetComponents[id.split('-')[0]]);

    return (
        <div className="relative min-h-[calc(100vh-4rem)] md:min-h-screen pb-20 md:pb-0 md:pl-20 w-full">
            {/* Header Bar */}
            <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 md:px-8 bg-black/40 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white/90">
                        Dashboard
                    </h1>
                    {isEditing && (
                        <button
                            onClick={() => {
                                if (confirm('Reset dashboard to default layout?')) {
                                    localStorage.removeItem('lyfe_client_id');
                                    window.location.reload();
                                }
                            }}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                        >
                            Reset App
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all shadow-lg backdrop-blur-md",
                        isEditing
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white"
                    )}
                >
                    {isEditing ? (
                        <>
                            <Check className="h-4 w-4" />
                            <span>Done Editing</span>
                        </>
                    ) : (
                        <>
                            <Edit2 className="h-4 w-4" />
                            <span>Edit Layout</span>
                        </>
                    )}
                </button>
            </div>

            {/* Grid Area */}
            <div ref={containerRef} className="p-2 md:p-4 w-full">
                {activeWidgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-white/5 bg-white/[0.02]">
                        <p className="text-white/40 mb-2">No widgets added yet.</p>
                        <p className="text-xs text-white/30">Use the + button to add some widgets to your dashboard.</p>
                    </div>
                ) : (
                    <Responsive
                        className={cn("layout transition-colors", isEditing && "bg-white/[0.02] rounded-3xl p-2 border border-white/10 border-dashed")}
                        width={width}
                        layouts={{ lg: currentLayout, md: currentLayout, sm: currentLayout }}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 }}
                        rowHeight={50}
                        onLayoutChange={(layout: any) => handleLayoutChange(Array.isArray(layout) ? layout : [])}
                        isDraggable={isEditing}
                        isResizable={isEditing}
                        margin={[16, 16]}
                        useCSSTransforms={mounted}
                        compactType={null}
                        allowOverlap={true}
                        preventCollision={false}
                        draggableHandle=".widget-drag-handle"
                    >
                        {activeWidgets.map(widgetId => {
                            const widgetType = widgetId.split('-')[0];
                            const Component = widgetComponents[widgetType];
                            if (!Component) return null;

                            return (
                                <div
                                    key={widgetId}
                                    className={cn(
                                        "group relative rounded-3xl overflow-hidden bg-black border",
                                        isEditing ? "border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-move widget-drag-handle" : "border-white/10 shadow-2xl hover:border-white/20 transition-colors"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[2px] pointer-events-none" />

                                    {isEditing && (
                                        <div className="absolute top-2 right-2 z-50 flex gap-2">
                                            <button
                                                className="p-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 backdrop-blur-md transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newWidgets = config.widgets.filter(w => w !== widgetId);
                                                    updateConfig({ widgets: newWidgets });
                                                }}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div className={cn("h-full w-full relative z-10", isEditing && "opacity-80 pointer-events-none")}>
                                        <Component id={widgetId} isEditing={isEditing} />
                                    </div>
                                </div>
                            );
                        })}
                    </Responsive>
                )}
            </div>
        </div>
    );
}
