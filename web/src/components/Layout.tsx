import { useState, useEffect, useMemo } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Tooltip,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Cable as CableIcon,
  Contacts as ContactsIcon,
  Message as MessageIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useMatch, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnections } from '../hooks/useConnections';
import { logout } from '../services/auth';

const DRAWER_WIDTH = 240;

const ACTIVE_SX = {
  '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: 'rgba(25,118,210,0.12)' },
};

const Layout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const { connections, loading: connectionsLoading } = useConnections(user?.uid ?? null);

  const connectionMatch = useMatch('/connections/:connectionId/*');
  const connectionId = connectionMatch?.params.connectionId ?? null;
  const currentConnection = connections.find((c) => c.id === connectionId) ?? null;

  // Redirect em useEffect — chamar navigate durante render gera warning do React
  useEffect(() => {
    if (connectionId && !connectionsLoading && !currentConnection) {
      navigate('/connections', { replace: true });
    }
  }, [connectionId, connectionsLoading, currentConnection, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignora falha de signOut — força navegação para login
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const closeMobileDrawer = () => isMobile && setMobileOpen(false);

  const isDashboardActive = pathname === '/dashboard' || pathname === '/';
  const isConnectionsActive = pathname === '/connections';
  const isContactsActive = pathname === `/connections/${connectionId}/contacts`;
  const isMessagesActive = pathname === `/connections/${connectionId}/messages`;

  const drawerContent = (
    <>
      <Toolbar />
      <Box className="overflow-auto flex flex-col h-full">
        <List dense>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/dashboard"
              selected={isDashboardActive}
              sx={ACTIVE_SX}
              onClick={closeMobileDrawer}
            >
              <ListItemIcon>
                <DashboardIcon color={isDashboardActive ? 'primary' : 'action'} />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/connections"
              selected={isConnectionsActive}
              sx={ACTIVE_SX}
              onClick={closeMobileDrawer}
            >
              <ListItemIcon>
                <CableIcon color={isConnectionsActive ? 'primary' : 'action'} />
              </ListItemIcon>
              <ListItemText primary="Conexões" />
            </ListItemButton>
          </ListItem>
        </List>

        {currentConnection && (
          <>
            <Divider />
            <Box className="px-4 pt-3 pb-1">
              <Box className="flex items-center gap-1 mb-1">
                <IconButton
                  size="small"
                  onClick={() => {
                    navigate('/connections');
                    closeMobileDrawer();
                  }}
                  aria-label="Voltar para conexões"
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" color="text.secondary" noWrap>
                  Conexão
                </Typography>
              </Box>
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                title={currentConnection.name}
              >
                {currentConnection.name}
              </Typography>
            </Box>
            <List dense>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to={`/connections/${connectionId}/contacts`}
                  selected={isContactsActive}
                  sx={ACTIVE_SX}
                  onClick={closeMobileDrawer}
                >
                  <ListItemIcon>
                    <ContactsIcon color={isContactsActive ? 'primary' : 'action'} />
                  </ListItemIcon>
                  <ListItemText primary="Contatos" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to={`/connections/${connectionId}/messages`}
                  selected={isMessagesActive}
                  sx={ACTIVE_SX}
                  onClick={closeMobileDrawer}
                >
                  <ListItemIcon>
                    <MessageIcon color={isMessagesActive ? 'primary' : 'action'} />
                  </ListItemIcon>
                  <ListItemText primary="Mensagens" />
                </ListItemButton>
              </ListItem>
            </List>
          </>
        )}
      </Box>
    </>
  );

  return (
    <Box className="flex h-screen">
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
        elevation={1}
      >
        <Toolbar className="flex justify-between">
          <Box className="flex items-center gap-1">
            {isMobile && (
              <IconButton
                color="inherit"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menu"
                edge="start"
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={700} letterSpacing={0.5}>
              📡 Broadcast
            </Typography>
          </Box>
          <Box className="flex items-center gap-2">
            <Tooltip title={user?.email ?? ''}>
              <Avatar
                sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}
              >
                {user?.email?.[0]?.toUpperCase()}
              </Avatar>
            </Tooltip>
            <Tooltip title="Sair">
              <IconButton
                color="inherit"
                onClick={handleLogout}
                size="small"
                aria-label="Sair da conta"
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        className="flex-1 overflow-auto"
        sx={{ ml: isMobile ? 0 : `${DRAWER_WIDTH}px`, width: '100%' }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Outlet context={useMemo(() => ({ connectionName: currentConnection?.name ?? null }), [currentConnection?.name])} />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
