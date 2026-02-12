/**
 * Left sidebar with multiple views
 */
import { useState } from 'react';
import { Stack, Tabs } from '@mantine/core';
import { IconUsers, IconMessage, IconHistory, IconSettings } from '@tabler/icons-react';

export type SidebarView = 'friends' | 'message-sets' | 'history' | 'settings';

interface LeftSidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  children: React.ReactNode;
}

export function LeftSidebar({ activeView, onViewChange, children }: LeftSidebarProps) {
  return (
    <div style={{
      width: '350px',
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fafafa'
    }}>
      <Tabs value={activeView} onChange={(value) => onViewChange(value as SidebarView)}>
        <Tabs.List grow>
          <Tabs.Tab value="friends" leftSection={<IconUsers size={16} />}>
            Friends
          </Tabs.Tab>
          <Tabs.Tab value="message-sets" leftSection={<IconMessage size={16} />}>
            Sets
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
            History
          </Tabs.Tab>
          <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
            Settings
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {children}
      </div>
    </div>
  );
}
