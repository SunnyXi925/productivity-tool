const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopWidget', {
    isDesktop: true,
    getState: () => ipcRenderer.invoke('widget:get-state'),
    placeOnDesktop: () => ipcRenderer.invoke('widget:place-on-desktop'),
    toggleCollapse: () => ipcRenderer.invoke('widget:toggle-collapse'),
    onStateChanged: callback => ipcRenderer.on('widget:state-changed', (_event, state) => callback(state)),
    show: () => ipcRenderer.send('widget:show')
});
