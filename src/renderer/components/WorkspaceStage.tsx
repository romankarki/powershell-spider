import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { useSettingsStore } from '../state/settings-store';
import { WorkspaceView } from './SplitContainer';
import { AmbientLayer } from './AmbientLayer';

/** Accumulated horizontal scroll (px) needed to switch workspace. */
const COMMIT_DISTANCE = 160;
/** A gesture ends after this long without wheel events (also swallows touchpad inertia). */
const GESTURE_END_MS = 160;
/** How far (px) the content follows the fingers at full progress. */
const FOLLOW_PX = 90;
const DOTS_LINGER_MS = 1300;

type Direction = 'left' | 'right';

/**
 * The main workspace area. Handles two-finger horizontal touchpad swipes to
 * switch workspaces (the view follows the fingers, then slides in the next
 * workspace), and shows page dots while switching.
 */
export const WorkspaceStage: React.FC = () => {
  const workspaces = useTerminalStore((s) => s.workspaces);
  const activeIndex = useTerminalStore((s) => s.activeWorkspaceIndex);
  const setActiveWorkspace = useTerminalStore((s) => s.setActiveWorkspace);
  const swipeEnabled = useSettingsStore((s) => s.swipeWorkspaces);
  const activeId = workspaces[activeIndex]?.id;

  const stageRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // -1..1 while a swipe is in progress
  const [dragging, setDragging] = useState(false);
  const [dotsVisible, setDotsVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Direction of the most recent workspace change, computed during render so
  // the incoming workspace mounts with its slide-in animation already applied.
  const lastId = useRef(activeId);
  const lastIndex = useRef(activeIndex);
  const enterFrom = useRef<Direction | null>(null);
  if (lastId.current !== activeId) {
    enterFrom.current = activeIndex >= lastIndex.current ? 'right' : 'left';
    lastId.current = activeId;
  }
  lastIndex.current = activeIndex;

  const flashDots = useCallback(() => {
    setDotsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setDotsVisible(false), DOTS_LINGER_MS);
  }, []);

  // Show the dots whenever the workspace changes (swipe, Alt+N, sidebar click, ...)
  useEffect(() => {
    if (enterFrom.current) flashDots();
  }, [activeId, flashDots]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !swipeEnabled) return;

    let acc = 0;
    let active = false;
    let locked = false; // switched already; ignore the rest of this gesture
    let endTimer: ReturnType<typeof setTimeout> | undefined;

    const endGesture = () => {
      if (active && !locked) {
        // Not far enough: spring back
        setDragging(false);
        setProgress(0);
      }
      acc = 0;
      active = false;
      locked = false;
    };

    const onWheel = (e: WheelEvent) => {
      // Ctrl+wheel is pinch-zoom; Shift+wheel is a deliberate horizontal scroll
      if (e.ctrlKey || e.shiftKey) return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) >= 1;
      if (!active && !locked && !horizontal) return;

      // Ours from here on: keep xterm from scrolling during the swipe
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(endTimer);
      endTimer = setTimeout(endGesture, GESTURE_END_MS);
      if (locked) return;

      const store = useTerminalStore.getState();
      if (store.workspaces.length < 2) return;
      acc += e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX;
      active = true;

      // Fingers moving left scroll content right (deltaX > 0): go to the next workspace
      const target = store.activeWorkspaceIndex + Math.sign(acc);
      const canGo = target >= 0 && target < store.workspaces.length;
      const p = Math.max(-1, Math.min(1, acc / COMMIT_DISTANCE));
      setDragging(true);
      setDotsVisible(true);
      clearTimeout(hideTimer.current);
      setProgress(canGo ? p : p * 0.2); // rubber-band at the first/last workspace

      if (canGo && Math.abs(acc) >= COMMIT_DISTANCE) {
        locked = true;
        setDragging(false);
        setProgress(0);
        store.setActiveWorkspace(target);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => {
      el.removeEventListener('wheel', onWheel, { capture: true });
      clearTimeout(endTimer);
    };
  }, [swipeEnabled]);

  // Leaving a drag without switching: let the dots fade out
  useEffect(() => {
    if (!dragging && dotsVisible && progress === 0) flashDots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const target = progress === 0 ? -1 : activeIndex + Math.sign(progress);
  const showDots = workspaces.length > 1 && (dotsVisible || dragging);

  return (
    <main ref={stageRef} className="ws-stage">
      <div
        key={activeId}
        className={`ws-page ${enterFrom.current ? `ws-enter-${enterFrom.current}` : ''}`}
        style={{
          transform: progress ? `translateX(${-progress * FOLLOW_PX}px)` : undefined,
          opacity: progress ? 1 - Math.abs(progress) * 0.3 : undefined,
          transition: dragging ? 'transform 60ms linear, opacity 60ms linear' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s ease',
        }}
      >
        <WorkspaceView />
      </div>
      <AmbientLayer />

      <div className={`ws-dots ${showDots ? 'visible' : ''}`} aria-hidden={!showDots}>
        {workspaces.map((ws, i) => {
          const isActive = i === activeIndex;
          const isTarget = i === target;
          return (
            <button
              key={ws.id}
              className={`ws-dot ${isActive ? 'active' : ''}`}
              style={isTarget ? { transform: `scale(${1 + Math.abs(progress) * 0.6})`, opacity: 0.4 + Math.abs(progress) * 0.6 } : undefined}
              onClick={() => setActiveWorkspace(i)}
              title={ws.name}
              tabIndex={showDots ? 0 : -1}
            />
          );
        })}
        <span className="ws-dots-label">{workspaces[activeIndex]?.name}</span>
      </div>

      <style>{`
        .ws-stage {
          position: relative;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .ws-page {
          width: 100%;
          height: 100%;
          will-change: transform;
        }
        .ws-enter-right { animation: ws-enter-right 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .ws-enter-left { animation: ws-enter-left 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes ws-enter-right {
          from { transform: translateX(80px); opacity: 0.15; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes ws-enter-left {
          from { transform: translateX(-80px); opacity: 0.15; }
          to { transform: translateX(0); opacity: 1; }
        }
        .ws-dots {
          position: absolute;
          left: 50%;
          bottom: 14px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--bg-secondary) 88%, transparent);
          border: 1px solid var(--border);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          opacity: 0;
          transform: translate(-50%, 10px);
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .ws-dots.visible {
          opacity: 1;
          transform: translate(-50%, 0);
          pointer-events: auto;
        }
        .ws-dot {
          width: 7px;
          height: 7px;
          padding: 0;
          border: none;
          border-radius: 999px;
          background: var(--text-secondary);
          opacity: 0.45;
          cursor: pointer;
          transition: width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s, opacity 0.2s, transform 0.1s;
        }
        .ws-dot:hover {
          opacity: 0.9;
        }
        .ws-dot.active {
          width: 22px;
          opacity: 1;
          background: var(--green);
          box-shadow: 0 0 8px var(--green-glow);
        }
        .ws-dots-label {
          margin-left: 4px;
          padding-left: 10px;
          border-left: 1px solid var(--border);
          font-size: 11px;
          color: var(--text-primary);
          white-space: nowrap;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </main>
  );
};
