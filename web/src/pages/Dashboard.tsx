import { Box, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import {
  Cable as CableIcon,
  Contacts as ContactsIcon,
  Message as MessageIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { ReactElement } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../hooks/useUserStats';

interface StatCardProps {
  icon: ReactElement;
  label: string;
  value: number;
  color: string;
  loading: boolean;
}

const StatCard = ({ icon, label, value, color, loading }: StatCardProps) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Box className="flex items-center gap-3">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${color}15`,
            color,
          }}
        >
          {icon}
        </Box>
        <Box className="flex-1">
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={32} />
          ) : (
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { stats, loading } = useUserStats(user?.uid ?? null);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Bem-vindo de volta, {user?.email}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<CableIcon />}
            label="Conexões"
            value={stats.connections}
            color="#1976d2"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<ContactsIcon />}
            label="Contatos"
            value={stats.contacts}
            color="#9c27b0"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<MessageIcon />}
            label="Total de mensagens"
            value={stats.messages}
            color="#0288d1"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<SendIcon />}
            label="Mensagens enviadas"
            value={stats.sent}
            color="#2e7d32"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<ScheduleIcon />}
            label="Mensagens agendadas"
            value={stats.scheduled}
            color="#ed6c02"
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
