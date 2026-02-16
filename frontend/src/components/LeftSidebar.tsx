import { Tabs, ScrollArea } from '@mantine/core'
import { IconUsers, IconMessage, IconHistory } from '@tabler/icons-react'

export type SidebarView = 'friends' | 'message-sets' | 'history'

interface LeftSidebarProps {
  activeView: SidebarView
  onViewChange: (view: SidebarView) => void
  children: React.ReactNode
}

export default function LeftSidebar({ activeView, onViewChange, children }: LeftSidebarProps) {
  return (
    <div style={{ width: 320, borderRight: '1px solid var(--mantine-color-gray-3)', display: 'flex', flexDirection: 'column', background: 'white' }}>
      <Tabs value={activeView} onChange={(v) => onViewChange(v as SidebarView)}>
        <Tabs.List grow>
          <Tabs.Tab value="friends" leftSection={<IconUsers size={16} />}>Friends</Tabs.Tab>
          <Tabs.Tab value="message-sets" leftSection={<IconMessage size={16} />}>Sets</Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>History</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      <ScrollArea style={{ flex: 1 }} p="sm">
        {children}
      </ScrollArea>
    </div>
  )
}
