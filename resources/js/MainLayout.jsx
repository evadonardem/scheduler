import { ThemeProvider } from "@emotion/react";
import { Head, router, usePage } from "@inertiajs/react";
import { AccountCircle, Apartment, AssessmentTwoTone, CalendarMonthTwoTone, DashboardTwoTone, Description, ExpandLess, ExpandMore, FolderTwoTone, InfoTwoTone, ListAlt, ListAltTwoTone, Logout, Menu, People, School, SettingsTwoTone } from "@mui/icons-material";
import { Alert, AppBar, Avatar, Box, Collapse, Container, createTheme, Divider, Drawer, Icon, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, menuItemClasses, Snackbar, Stack, Toolbar, Typography } from "@mui/material";
import React from 'react';
import { includes } from 'lodash';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const MainLayout = ({ children, title }) => {

    const theme = createTheme({
        palette: {
            mode: 'light',
            primary: {
                main: '#960e21',
            },
            secondary: {
                main: '#f50057',
            },
        },
    });

    const { appName, appMenu, auth, flashMessage } = usePage().props;
    const { roles } = auth;
    const { id, email, name } = auth;
    const [openAppDrawer, setOpenAppDrawer] = React.useState(false);
    const [openUserDrawer, setOpenUserDrawer] = React.useState(false);
    const [currentFlashMessage, setCurrentFlashMessage] = React.useState(flashMessage);

    React.useEffect(() => {
        setCurrentFlashMessage(flashMessage);
    }, [flashMessage]);

    const handleCloseFlashMessage = (_event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setCurrentFlashMessage(null);
    };

    const toggleAppDrawer = (newOpenAppDrawer) => () => {
        setOpenAppDrawer(newOpenAppDrawer);
    };

    const toggleUserDrawer = (newOpenUserDrawer) => () => {
        setOpenUserDrawer(newOpenUserDrawer);
    };

    const [menuToggled, setMenuToggled] = React.useState(false);
    const [openedSubmenu, setOpenedSubmenu] = React.useState({});
    const toggleSubmenu = (event, key) => {
        event.stopPropagation();
        const currentOpenedSubmenu = openedSubmenu;
        if (openedSubmenu.hasOwnProperty(key)) {
            delete currentOpenedSubmenu[key];
            setOpenedSubmenu(currentOpenedSubmenu);
        } else {
            currentOpenedSubmenu[key] = true;
            setOpenedSubmenu(currentOpenedSubmenu);
        }
        setMenuToggled(!menuToggled);
    }

    const [openReports, setOpenReports] = React.useState(false);
    const toggleReports = (event) => {
        event.stopPropagation();
        setOpenReports(!openReports);
    };

    const [openSettings, setOpenSettings] = React.useState(false);
    const toggleSettings = (event) => {
        event.stopPropagation();
        setOpenSettings(!openSettings);
    };

    const routeToPage = (url) => () => {
        router.get(`/${url ?? ''}`);
    };

    const logout = () => {
        router.post('/logout');
    };

    const AppMenu = (
        <Box sx={{ width: 300 }} role="presentation" onClick={toggleAppDrawer(false)}>
            <img
                src="/images/logo-kcp-emblem.png"
                alt="KCP"
                height={180}
                style={{ margin: 'auto', display: 'block' }}
            />

            {appMenu.map((menuGroup, i) => (
                <div key={i}>
                    {menuGroup.map((menu, j) => (
                        !menu.submenu ? <List key={`${i}-${j}-menu`}>
                            <ListItem disablePadding>
                                <ListItemButton onClick={routeToPage(menu.route)}>
                                    <ListItemIcon>
                                        <Icon>{menu.icon}</Icon>
                                    </ListItemIcon>
                                    <ListItemText primary={menu.label} />
                                </ListItemButton>
                            </ListItem>
                        </List> : <List key={`${i}-${j}-menu`}>
                            <ListItem disablePadding>
                                <ListItemButton onClick={(event) => toggleSubmenu(event, `${i}-${j}-menu`) }>
                                    <ListItemIcon>
                                        <Icon>{menu.icon}</Icon>
                                    </ListItemIcon>
                                    <ListItemText primary={menu.label} />
                                    {openedSubmenu[`${i}-${j}`] ? <ExpandLess /> : <ExpandMore />}
                                </ListItemButton>
                            </ListItem>
                            <Collapse in={openedSubmenu[`${i}-${j}-menu`]} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {menu.submenu.map((submenu, k) => (
                                        <ListItem disablePadding key={`${i}-${j}-${k}`}>
                                            <ListItemButton onClick={routeToPage(submenu.route)} sx={{ pl: 6 }}>
                                                <ListItemIcon>
                                                    <Icon>{submenu.icon}</Icon>
                                                </ListItemIcon>
                                                <ListItemText primary={submenu.label} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Collapse>
                        </List>
                    ))}
                    {i < appMenu.length - 1 && <Divider />}
                </div>
            ))}
        </Box>
    );

    const UserMenu = (
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleUserDrawer(false)}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <AccountCircle />
                </Avatar>
                <Typography variant="h5">{name}</Typography>
                <Typography variant="caption">{email}</Typography>
            </Box>
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={routeToPage(`profile/${id}`)}>
                        <ListItemIcon>
                            <Description />
                        </ListItemIcon>
                        <ListItemText primary="My Profile" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={logout}>
                        <ListItemIcon>
                            <Logout />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Head>
                <title>{title}</title>
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/icon?family=Material+Icons"
                />
            </Head>
            <Box sx={{ flexGrow: 1 }}>
                <React.Fragment>
                    <AppBar position="fixed">
                        <Toolbar>
                            <IconButton
                                size="large"
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                                sx={{ mr: 2 }}
                                onClick={toggleAppDrawer(true)}
                            >
                                <Menu />
                            </IconButton>
                            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                {appName} | {title}
                            </Typography>
                            <Stack textAlign="center" marginRight={2}>
                                <Typography variant="body1">{name}</Typography>
                                <Typography variant="caption">{email}</Typography>
                            </Stack>
                            <IconButton
                                size="large"
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                                sx={{ mr: 2 }}
                                onClick={toggleUserDrawer(true)}
                            >
                                <AccountCircle />
                            </IconButton>
                        </Toolbar>
                    </AppBar>
                    <Toolbar />
                </React.Fragment>
            </Box>

            <Drawer anchor="left" open={openAppDrawer} onClose={toggleAppDrawer(false)}>
                {AppMenu}
            </Drawer>

            <Drawer anchor="right" open={openUserDrawer} onClose={toggleUserDrawer(false)}>
                {UserMenu}
            </Drawer>

            <Snackbar
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                autoHideDuration={3000}
                onClose={handleCloseFlashMessage}
                open={!!currentFlashMessage}
            >
                <Alert
                    onClose={handleCloseFlashMessage}
                    severity={currentFlashMessage?.severity || "info"}
                    sx={{ width: '100%' }}
                    variant="filled"
                >
                    {currentFlashMessage?.value}
                </Alert>
            </Snackbar>

            <Container
                maxWidth={false}
                sx={{ p: 2 }}
            >
                {children}
            </Container>
        </LocalizationProvider>
    </ThemeProvider>;
};

export default MainLayout;