const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen, shell } = require('electron');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const APP_NAME = 'Productivity Tool';
const DEFAULT_PORT = 47831;
const WINDOW_WIDTH = 430;
const WINDOW_HEIGHT = 720;
const COLLAPSED_HEIGHT = 62;
const PRIVATE_ROOTS = new Set(['.git', 'desktop', 'dist', 'node_modules', 'test-results']);
const MIME_TYPES = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.gif', 'image/gif'],
    ['.html', 'text/html; charset=utf-8'],
    ['.ico', 'image/x-icon'],
    ['.jpeg', 'image/jpeg'],
    ['.jpg', 'image/jpeg'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.mjs', 'text/javascript; charset=utf-8'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml; charset=utf-8'],
    ['.ttf', 'font/ttf'],
    ['.webp', 'image/webp'],
    ['.woff', 'font/woff'],
    ['.woff2', 'font/woff2']
]);

let widgetWindow = null;
let tray = null;
let staticServer = null;
let settings = {};
let isQuitting = false;
let isCollapsed = false;

app.setName(APP_NAME);

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();

function settingsPath() {
    return path.join(app.getPath('userData'), 'widget-settings.json');
}

function loadSettings() {
    try {
        settings = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
    } catch {
        settings = {};
    }
}

function persistSettings(nextSettings = {}) {
    settings = { ...settings, ...nextSettings };
    fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
    fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2));
}

function getDockedBounds(collapsed = false) {
    const { workArea } = screen.getPrimaryDisplay();
    const width = Math.min(WINDOW_WIDTH, workArea.width - 16);
    const height = collapsed ? COLLAPSED_HEIGHT : Math.min(WINDOW_HEIGHT, workArea.height - 16);
    return {
        width,
        height,
        x: workArea.x + 8,
        y: workArea.y + 8
    };
}

function createStaticServer(port = settings.port || DEFAULT_PORT) {
    const contentRoot = app.isPackaged ? app.getAppPath() : path.resolve(__dirname, '..');
    return new Promise((resolve, reject) => {
        const server = http.createServer((request, response) => {
            let pathname;
            try {
                pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
            } catch {
                response.writeHead(400).end('Bad request');
                return;
            }

            if (pathname === '/') pathname = '/index.html';
            const firstSegment = pathname.split('/').filter(Boolean)[0];
            if (PRIVATE_ROOTS.has(firstSegment)) {
                response.writeHead(404).end('Not found');
                return;
            }

            const filePath = path.resolve(contentRoot, `.${pathname}`);
            if (filePath !== contentRoot && !filePath.startsWith(`${contentRoot}${path.sep}`)) {
                response.writeHead(403).end('Forbidden');
                return;
            }

            fs.stat(filePath, (statError, stat) => {
                const resolvedPath = !statError && stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
                fs.readFile(resolvedPath, (readError, data) => {
                    if (readError) {
                        response.writeHead(readError.code === 'ENOENT' ? 404 : 500).end('Not found');
                        return;
                    }
                    const type = MIME_TYPES.get(path.extname(resolvedPath).toLowerCase()) || 'application/octet-stream';
                    response.writeHead(200, {
                        'Cache-Control': 'no-store',
                        'Content-Type': type,
                        'X-Content-Type-Options': 'nosniff'
                    });
                    response.end(data);
                });
            });
        });

        server.once('error', error => {
            if (error.code === 'EADDRINUSE' && port < DEFAULT_PORT + 10) {
                createStaticServer(port + 1).then(resolve, reject);
            } else {
                reject(error);
            }
        });
        server.listen(port, '127.0.0.1', () => {
            staticServer = server;
            persistSettings({ port });
            resolve(`http://127.0.0.1:${port}`);
        });
    });
}

function placeOnDesktop() {
    if (!widgetWindow || widgetWindow.isDestroyed()) return;
    widgetWindow.setAlwaysOnTop(false);
    widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
    widgetWindow.setBounds(getDockedBounds(isCollapsed), true);
}

function setCollapsed(collapsed) {
    isCollapsed = Boolean(collapsed);
    placeOnDesktop();
    widgetWindow?.webContents.send('widget:state-changed', { collapsed: isCollapsed });
    rebuildTrayMenu();
    return isCollapsed;
}

function showWidget() {
    if (!widgetWindow || widgetWindow.isDestroyed()) return;
    placeOnDesktop();
    widgetWindow.show();
    widgetWindow.focus();
}

function getLoginItemSettings() {
    if (app.isPackaged) return app.getLoginItemSettings();
    return app.getLoginItemSettings({
        path: process.execPath,
        args: [path.resolve(__dirname, '..')]
    });
}

function setOpenAtLogin(openAtLogin) {
    const options = { openAtLogin };
    if (!app.isPackaged) {
        options.path = process.execPath;
        options.args = [path.resolve(__dirname, '..')];
    }
    app.setLoginItemSettings(options);
}

function rebuildTrayMenu() {
    if (!tray) return;
    const openAtLogin = getLoginItemSettings().openAtLogin;
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: '显示小组件', click: showWidget },
        { label: '移到主屏幕左侧', click: placeOnDesktop },
        {
            label: isCollapsed ? '展开小组件' : '折叠小组件',
            click: () => setCollapsed(!isCollapsed)
        },
        { type: 'separator' },
        {
            label: '登录 Mac 后自动启动',
            type: 'checkbox',
            checked: openAtLogin,
            click: item => {
                setOpenAtLogin(item.checked);
                rebuildTrayMenu();
            }
        },
        { type: 'separator' },
        { label: '退出 Productivity Tool', click: () => { isQuitting = true; app.quit(); } }
    ]));
}

function createTray() {
    const traySvg = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><rect x="5" y="5" width="11" height="11" rx="2" fill="black"/><rect x="20" y="5" width="11" height="11" rx="2" fill="black"/><rect x="5" y="20" width="11" height="11" rx="2" fill="black"/><rect x="20" y="20" width="11" height="11" rx="2" fill="black"/><circle cx="18" cy="18" r="4" fill="white" stroke="black" stroke-width="2"/></svg>';
    const trayImage = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(traySvg).toString('base64')}`).resize({ width: 18, height: 18 });
    trayImage.setTemplateImage(true);
    tray = new Tray(trayImage);
    tray.setToolTip(APP_NAME);
    tray.on('click', showWidget);
    rebuildTrayMenu();
}

async function createWindow() {
    const baseUrl = await createStaticServer();
    widgetWindow = new BrowserWindow({
        ...getDockedBounds(),
        show: false,
        frame: false,
        transparent: true,
        hasShadow: true,
        movable: false,
        resizable: false,
        fullscreenable: false,
        maximizable: false,
        alwaysOnTop: false,
        skipTaskbar: true,
        backgroundColor: '#00000000',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    placeOnDesktop();
    widgetWindow.once('ready-to-show', showWidget);
    widgetWindow.webContents.once('did-finish-load', showWidget);
    widgetWindow.loadURL(`${baseUrl}/index.html?desktop=1&view=quadrant`);
    setTimeout(showWidget, 1500);
    widgetWindow.on('close', event => {
        if (isQuitting) return;
        event.preventDefault();
        setCollapsed(true);
    });
    widgetWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://')) shell.openExternal(url);
        return { action: 'deny' };
    });
    widgetWindow.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith(baseUrl)) event.preventDefault();
    });
}

ipcMain.handle('widget:get-state', () => ({
    collapsed: isCollapsed,
    desktopMode: true,
    alwaysOnTop: widgetWindow?.isAlwaysOnTop() || false,
    openAtLogin: getLoginItemSettings().openAtLogin
}));
ipcMain.handle('widget:place-on-desktop', () => {
    placeOnDesktop();
    return true;
});
ipcMain.handle('widget:toggle-collapse', () => setCollapsed(!isCollapsed));
ipcMain.on('widget:show', showWidget);

app.on('second-instance', showWidget);
app.on('before-quit', () => { isQuitting = true; });
app.on('activate', showWidget);
app.on('window-all-closed', () => {});

app.whenReady().then(async () => {
    loadSettings();
    app.dock?.hide();
    Menu.setApplicationMenu(null);
    createTray();
    await createWindow();
});

app.on('quit', () => {
    staticServer?.close();
});
