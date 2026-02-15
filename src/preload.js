const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('journalApi', {
  load: () => ipcRenderer.invoke('journal:load'),
  save: (payload) => ipcRenderer.invoke('journal:save', payload),
  exportCsv: (files) => ipcRenderer.invoke('journal:exportCsv', files)
});
