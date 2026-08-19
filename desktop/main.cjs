const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen, shell } = require('electron');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const APP_NAME = 'Productivity Tool';
const DEFAULT_PORT = 47831;
const WINDOW_WIDTH = 430;
const WINDOW_HEIGHT = 720;
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
let saveTimer = null;

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

function scheduleBoundsSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        if (!widgetWindow || widgetWindow.isDestroyed()) return;
        persistSettings({ bounds: widgetWindow.getBounds() });
    }, 220);
}

function getInitialBounds() {
    const saved = settings.bounds;
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return saved;
    const { workArea } = screen.getPrimaryDisplay();
    return {
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        x: workArea.x + workArea.width - WINDOW_WIDTH - 18,
        y: workArea.y + 24
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

function setPinned(pinned) {
    const nextPinned = Boolean(pinned);
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.setAlwaysOnTop(nextPinned, nextPinned ? 'floating' : 'normal');
        widgetWindow.setVisibleOnAllWorkspaces(nextPinned, { visibleOnFullScreen: true });
    }
    persistSettings({ pinned: nextPinned });
    rebuildTrayMenu();
    return nextPinned;
}

function showWidget() {
    if (!widgetWindow || widgetWindow.isDestroyed()) return;
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
        { type: 'separator' },
        {
            label: '固定在最前面',
            type: 'checkbox',
            checked: settings.pinned !== false,
            click: item => setPinned(item.checked)
        },
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
    const traySvg = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><rect x="5" y="4" width="4" height="28" rx="2" fill="black"/><path d="M14 7h7c6 0 10 3 10 8.5S27 24 21 24h-3v8h-4V7Zm4 4v9h3c3.7 0 5.7-1.5 5.7-4.5S24.7 11 21 11h-3Z" fill="black"/></svg>';
    const trayImage = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(traySvg).toString('base64')}`).resize({ width: 18, height: 18 });
    trayImage.setTemplateImage(true);
    tray = new Tray(trayImage);
    tray.setToolTip(APP_NAME);
    tray.on('click', showWidget);
    rebuildTrayMenu();
}

async function createWindow() {
    const baseUrl = await createStaticServer();
    const pinned = settings.pinned !== false;
    widgetWindow = new BrowserWindow({
        ...getInitialBounds(),
        minWidth: 370,
        minHeight: 560,
        show: false,
        frame: false,
        transparent: true,
        hasShadow: true,
        resizable: true,
        fullscreenable: false,
        maximizable: false,
        backgroundColor: '#00000000',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    setPinned(pinned);
    widgetWindow.once('ready-to-show', showWidget);
    widgetWindow.webContents.once('did-finish-load', showWidget);
    widgetWindow.loadURL(`${baseUrl}/index.html?desktop=1&view=quadrant`);
    setTimeout(showWidget, 1500);
    widgetWindow.on('move', scheduleBoundsSave);
    widgetWindow.on('resize', scheduleBoundsSave);
    widgetWindow.on('close', event => {
        if (isQuitting) return;
        event.preventDefault();
        widgetWindow.hide();
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
    pinned: settings.pinned !== false,
    openAtLogin: getLoginItemSettings().openAtLogin
}));
ipcMain.handle('widget:toggle-pin', () => setPinned(settings.pinned === false));
ipcMain.on('widget:hide', () => widgetWindow?.hide());
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
    clearTimeout(saveTimer);
    staticServer?.close();
});
