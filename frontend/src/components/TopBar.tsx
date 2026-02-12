/**
 * Top navigation bar component
 */
import { Group, Text, Button, ActionIcon } from '@mantine/core';
import { IconSettings, IconLogout } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  username: string;
  onLogout: () => void;
  onSettingsClick: () => void;
}

export function TopBar({ username, onLogout, onSettingsClick }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div style={{
      height: '60px',
      borderBottom: '1px solid #e0e0e0',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#fff'
    }}>
      <Group>
        <Text size="xl" fw={700} style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          BotherApp
        </Text>
      </Group>

      <Group>
        <Text size="sm" fw={500}>{username}</Text>
        <ActionIcon variant="subtle" onClick={onSettingsClick}>
          <IconSettings size={20} />
        </ActionIcon>
        <Button variant="subtle" leftSection={<IconLogout size={16} />} onClick={onLogout}>
          Logout
        </Button>
      </Group>
    </div>
  );
}
