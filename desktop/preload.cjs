const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopWidget', {
    isDesktop: true,
    getState: () => ipcRenderer.invoke('widget:get-state'),
    togglePin: () => ipcRenderer.invoke('widget:toggle-pin'),
    hide: () => ipcRenderer.send('widget:hide'),
    show: () => ipcRenderer.send('widget:show')
});
