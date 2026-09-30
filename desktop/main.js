const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const LIVE_URL = 'https://my-hrm-rosy.vercel.app/';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'HRM Pro — Enterprise Suite',
    icon: path.join(__dirname, '..', 'assets', 'icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    autoHideMenuBar: false
  });

  win.loadURL(LIVE_URL);

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://my-hrm-rosy.vercel.app/')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Simple clean desktop menu
  const menuTemplate = [
    {
      label: 'HRM Pro',
      submenu: [
        { label: 'Reload Portal', accelerator: 'CmdOrCtrl+R', click: () => win.reload() },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', click: () => win.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'Exit Application', accelerator: 'Alt+F4', click: () => app.quit() }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Full Screen', accelerator: 'F11', click: () => win.setFullScreen(!win.isFullScreen()) },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'HRM Pro Online Documentation', click: () => shell.openExternal('https://my-hrm-rosy.vercel.app/#faq') },
        { label: 'Check for Updates', click: () => shell.openExternal('https://github.com/Mghullam65/MY-HRM/releases') }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
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
