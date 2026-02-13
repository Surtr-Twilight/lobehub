'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useElectronStore } from '@/store/electron';
import { electronStylish } from '@/styles/electron';

import { useResolvedTabs } from './hooks/useResolvedTabs';
import { useStyles } from './styles';
import TabItem from './TabItem';

const TabBar = memo(() => {
  const styles = useStyles;
  const navigate = useNavigate();
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

  if (tabs.length < 2) return null;

  return (
    <Flexbox
      horizontal
      align="center"
      className={`${electronStylish.nodrag} ${styles.container}`}
      gap={2}
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
    </Flexbox>
  );
});

TabBar.displayName = 'TabBar';

export default TabBar;
