const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')

// Enable Web Speech API (microphone / voice recognition)
app.commandLine.appendSwitch('enable-features', 'WebSpeechAPI,AudioServiceOutOfProcess')
app.commandLine.appendSwitch('enable-speech-input')
app.commandLine.appendSwitch('allow-http-screen-capture')

function createWindow() {
  // Grant microphone permission automatically — no popup needed
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'microphone', 'notifications', 'audioCapture']
    callback(allowed.includes(permission))
  })

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const allowed = ['media', 'microphone', 'audioCapture']
    return allowed.includes(permission)
  })

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    frame: false,
    backgroundColor: '#050505',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  const serverUrl = process.env.JARVIS_SERVER || 'http://localhost:8000'
  win.loadURL(serverUrl)

  ipcMain.on('window-minimize', () => win.minimize())
  ipcMain.on('window-maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize())
  ipcMain.on('window-close', () => win.close())
  ipcMain.on('window-fullscreen', () => win.setFullScreen(!win.isFullScreen()))
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
