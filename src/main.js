const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const DATA_FILE = 'journal-data.json';

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

async function getDataPath() {
  const base = app.getPath('userData');
  return path.join(base, DATA_FILE);
}

ipcMain.handle('journal:load', async () => {
  const dataPath = await getDataPath();
  try {
    const raw = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { matches: [] };
    }
    throw error;
  }
});

ipcMain.handle('journal:save', async (_event, payload) => {
  const dataPath = await getDataPath();
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(payload, null, 2), 'utf-8');
  return { ok: true };
});

ipcMain.handle('journal:exportCsv', async (_event, files) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Choose export folder',
    properties: ['openDirectory', 'createDirectory']
  });

  if (canceled || filePaths.length === 0) {
    return { canceled: true };
  }

  const [targetDir] = filePaths;
  const writes = Object.entries(files).map(([name, content]) => {
    const filePath = path.join(targetDir, name);
    return fs.writeFile(filePath, content, 'utf-8');
  });

  await Promise.all(writes);
  return { canceled: false, folder: targetDir, files: Object.keys(files) };
});
