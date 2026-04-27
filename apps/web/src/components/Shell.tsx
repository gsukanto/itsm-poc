import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Badge, Menu, MenuItem, ListSubheader,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, ConfirmationNumber, ShoppingCart,
  BugReport, Build, Storage, MenuBook, Speed, NotificationsActive, EventAvailable,
  Assessment, RocketLaunch, Devices, RestartAlt, Business, AttachMoney, ApprovalRounded,
  AccountCircle, Logout, Notifications,
} from '@mui/icons-material';
import { useMeQuery, useNotificationsQuery, useMarkNotificationReadMutation } from '../services/api';
import { logout } from '../auth';

const drawerWidth = 240;

const groups: { header: string; items: { to: string; label: string; icon: React.ReactNode }[] }[] = [
  { header: 'Service', items: [
    { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/incidents', label: 'Incidents', icon: <ConfirmationNumber /> },
    { to: '/service-requests', label: 'Service Requests', icon: <ShoppingCart /> },
    { to: '/catalog', label: 'Service Catalog', icon: <ShoppingCart /> },
    { to: '/problems', label: 'Problems', icon: <BugReport /> },
    { to: '/changes', label: 'Changes', icon: <Build /> },
    { to: '/changes/calendar', label: 'Change Calendar', icon: <EventAvailable /> },
    { to: '/approvals', label: 'My Approvals', icon: <ApprovalRounded /> },
  ]},
  { header: 'Knowledge', items: [
    { to: '/knowledge', label: 'Knowledge Base', icon: <MenuBook /> },
  ]},
  { header: 'Configuration', items: [
    { to: '/cmdb', label: 'CMDB', icon: <Storage /> },
    { to: '/assets', label: 'Assets', icon: <Devices /> },
  ]},
  { header: 'Service Assurance', items: [
    { to: '/slm', label: 'SLM', icon: <Speed /> },
    { to: '/events', label: 'Events', icon: <NotificationsActive /> },
    { to: '/availability', label: 'Availability', icon: <Assessment /> },
    { to: '/capacity', label: 'Capacity', icon: <Assessment /> },
  ]},
  { header: 'Lifecycle', items: [
    { to: '/releases', label: 'Releases', icon: <RocketLaunch /> },
    { to: '/continuity', label: 'Continuity', icon: <RestartAlt /> },
    { to: '/suppliers', label: 'Suppliers', icon: <Business /> },
    { to: '/financial', label: 'Financial', icon: <AttachMoney /> },
  ]},
  { header: 'Admin', items: [
    { to: '/admin/workflows', label: 'Workflows', icon: <Build /> },
  ]},
];

export function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const { pathname } = useLocation();
  const { data: me } = useMeQuery();
  const { data: notifications = [] } = useNotificationsQuery(undefined, { pollingInterval: 30_000 });
  const [markRead] = useMarkNotificationReadMutation();
  const unread = notifications.filter((n: any) => n.status !== 'read').length;

  const drawer = (
    <Box>
      <Toolbar><Typography variant="h6" noWrap>ITSM</Typography></Toolbar>
      <List dense>
        {groups.map((g) => (
          <React.Fragment key={g.header}>
            <ListSubheader>{g.header}</ListSubheader>
            {g.items.map((it) => (
              <ListItemButton key={it.to} component={RouterLink} to={it.to} selected={pathname === it.to}>
                <ListItemIcon>{it.icon}</ListItemIcon>
                <ListItemText primary={it.label} />
              </ListItemButton>
            ))}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" sx={{ mr: 2, display: { sm: 'none' } }} onClick={() => setMobileOpen(!mobileOpen)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>IT Service Management</Typography>
          <IconButton color="inherit" onClick={(e) => setNotifAnchor(e.currentTarget)}>
            <Badge badgeContent={unread} color="error"><Notifications /></Badge>
          </IconButton>
          <Menu anchorEl={notifAnchor} open={!!notifAnchor} onClose={() => setNotifAnchor(null)}>
            {notifications.length === 0 && <MenuItem disabled>No notifications</MenuItem>}
            {notifications.slice(0, 10).map((n: any) => (
              <MenuItem key={n.id} onClick={() => { markRead(n.id); setNotifAnchor(null); }}>
                <Box>
                  <Typography variant="subtitle2">{n.subject}</Typography>
                  <Typography variant="caption" color="text.secondary">{(n.body ?? '').slice(0, 80)}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
          <IconButton color="inherit" onClick={(e) => setMenuAnchor(e.currentTarget)}><AccountCircle /></IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled>{me?.email ?? 'guest'}</MenuItem>
            <MenuItem onClick={() => logout()}><Logout fontSize="small" sx={{ mr: 1 }} /> Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" open
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
