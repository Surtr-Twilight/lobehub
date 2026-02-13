'use client';

import { ScrollArea } from '@lobehub/ui';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useElectronStore } from '@/store/electron';
import { electronStylish } from '@/styles/electron';

import { useResolvedTabs } from './hooks/useResolvedTabs';
import { useStyles } from './styles';
import TabItem from './TabItem';

const TAB_WIDTH = 180;
const TAB_GAP = 2;

const TabBar = () => {
  const styles = useStyles;
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement>(null);
  const { tabs, activeTabId } = useResolvedTabs();
  const activateTab = useElectronStore((s) => s.activateTab);
  const removeTab = useElectronStore((s) => s.removeTab);

  const handleActivate = useCallback(
    (id: string, url: string) => {
      activateTab(id);
      navigate(url);
    },
    [activateTab, navigate],
  );

  const handleClose = useCallback(
    (id: string) => {
      const isActive = id === activeTabId;
      const nextActiveId = removeTab(id);

      if (isActive && nextActiveId) {
        const nextTab = tabs.find((t) => t.reference.id === nextActiveId);
        if (nextTab) {
          navigate(nextTab.url);
        }
      }

      if (!nextActiveId) {
        navigate('/');
      }
    },
    [activeTabId, removeTab, tabs, navigate],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !activeTabId) return;

    const activeIndex = tabs.findIndex((t) => t.reference.id === activeTabId);
    if (activeIndex < 0) return;

    const tabLeft = activeIndex * (TAB_WIDTH + TAB_GAP);
    const tabRight = tabLeft + TAB_WIDTH;
    const { scrollLeft, clientWidth } = viewport;

    if (tabLeft < scrollLeft) {
      viewport.scrollLeft = tabLeft;
    } else if (tabRight > scrollLeft + clientWidth) {
      viewport.scrollLeft = tabRight - clientWidth;
    }
  }, [activeTabId, tabs]);

  if (tabs.length < 2) return null;

  return (
    <ScrollArea
      className={`${electronStylish.nodrag} ${styles.container}`}
      viewportProps={{ ref: viewportRef }}
      contentProps={{
        style: { alignItems: 'center', flexDirection: 'row', gap: TAB_GAP },
      }}
    >
      {tabs.map((tab) => (
        <TabItem
          isActive={tab.reference.id === activeTabId}
          item={tab}
          key={tab.reference.id}
          onActivate={handleActivate}
          onClose={handleClose}
        />
      ))}
    </ScrollArea>
  );
};

export default TabBar;
