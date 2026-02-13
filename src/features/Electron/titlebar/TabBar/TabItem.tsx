'use client';

import { ActionIcon, Flexbox, Icon } from '@lobehub/ui';
import { cx } from 'antd-style';
import { X } from 'lucide-react';
import { memo, useCallback } from 'react';

import { type ResolvedPageData } from '@/features/Electron/titlebar/RecentlyViewed/types';

import { useStyles } from './styles';

interface TabItemProps {
  isActive: boolean;
  item: ResolvedPageData;
  onActivate: (id: string, url: string) => void;
  onClose: (id: string) => void;
}

const TabItem = memo<TabItemProps>(({ item, isActive, onActivate, onClose }) => {
  const styles = useStyles;

  const handleClick = useCallback(() => {
    if (!isActive) {
      onActivate(item.reference.id, item.url);
    }
  }, [isActive, onActivate, item.reference.id, item.url]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose(item.reference.id);
    },
    [onClose, item.reference.id],
  );

  return (
    <Flexbox
      horizontal
      align="center"
      className={cx(styles.tab, isActive && styles.tabActive)}
      gap={6}
      onClick={handleClick}
    >
      {item.icon && <Icon className={styles.tabIcon} icon={item.icon} size="small" />}
      <span className={styles.tabTitle}>{item.title}</span>
      <ActionIcon
        className={cx('closeIcon', styles.closeIcon)}
        icon={X}
        size="small"
        onClick={handleClose}
      />
    </Flexbox>
  );
});

TabItem.displayName = 'TabItem';

export default TabItem;
