import { app, BrowserWindow, shell, ipcMain, screen, dialog } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'

import path from 'node:path'

import { registerKeepPositionFunctions, getWindowPosition, saveWindowPosition } from './position'
import { startBackend as startBackend, endServer, getServerPort, getConfigure, saveConfigure, setBackendUrl } from './server'

import { downloadNewVersion, execUpdate, autoCheckVersion, manualCheckNewVersion, cancelDownload } from './update'

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')


//start backend
startBackend(app.isPackaged)
const backendUrl = "http://127.0.0.1:" + getServerPort()
setBackendUrl(backendUrl)

app.whenReady().then(createWindow)

async function createWindow() {
  win = new BrowserWindow({
    frame: false,
    show: false,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  registerKeepPositionFunctions(win)

  win.on("maximize", () => { win?.webContents.send("SystemInfo", "maximize") })
  win.on("minimize", () => { win?.webContents.send("SystemInfo", "minimize") })
  win.on("unmaximize", () => { win?.webContents.send("SystemInfo", "unmaximize") })


  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
   // win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // set postion of window
  if ((await getConfigure("Common.maximizeWindow", "false") == "false")) {
    const position = await getWindowPosition()

    const displays = screen.getAllDisplays()

    // check the saved position is if valid for current displays
    for (const dp of displays) {
      const bounds = dp.bounds
      if (position.x >= bounds.x && position.x <= bounds.x + bounds.width &&
        position.y >= bounds.y && position.y <= bounds.y + bounds.height) {
        win.setBounds(position)
        break;
      }
    }
  } else {
    win.maximize();
  }

  win.webContents.setZoomLevel(0)
  
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('startRenderProcess', app.isPackaged, app.getVersion(), backendUrl)
    win.show()
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

ipcMain.on('systemCommand', (_event, command: string) => {
  if (command == 'quit') {
    app.quit()
  } else if (command == 'reload') {
    win.webContents.reload()
  } else if (command == 'toggleDevTool') {
    win.webContents.toggleDevTools();
  } else if (command == 'minimize') {
    win.minimize();
  } else if (command == 'toggleMaximize') {
    if (win.isMaximized()) {
      saveConfigure("Common.maximizeWindow", "false")
      win.unmaximize();
    } else {
      saveConfigure("Common.maximizeWindow", "true")
      win.maximize();
    }
  }
})

// handle moving window
let winPosition: Electron.Rectangle
let startX: number
let startY: number
ipcMain.on("beginMoveWindow", (_event, x: number, y: number) => {
  winPosition = win.getBounds();
  startX = winPosition.x + x
  startY = winPosition.y + y
})

ipcMain.on("moveWindow", (_event, x: number, y: number) => {
  const position = win.getBounds();
  const endX = position.x + x
  const endY = position.y + y
  if (endX - startX != 0 && endY - startY != 0) {
    const rect = {
      x: winPosition.x + endX - startX,
      y: winPosition.y + endY - startY,
      width: winPosition.width,
      height: winPosition.height
    }
    win.setBounds(rect)
    saveWindowPosition(rect)
  }
})


// handle update
ipcMain.on('autoCheckNewVersion', async (_event, proxy: string, autoDownload:boolean) => {
  const result = await autoCheckVersion(proxy)

  //notify status bar
  if(result != null) {
    win?.webContents.send('FoundNewVersion', true);
  } else {
    win?.webContents.send('FoundNewVersion', false);
  }

  if(result != null && autoDownload) {
    downloadNewVersion(win, result.url, proxy)
  }
})


ipcMain.on('manualCheckNewVersion', async (_event, proxy: string) => {
  const result = await manualCheckNewVersion(proxy)
  if(result != null) {
    win?.webContents.send('FoundNewVersion', true, result.version, result.url);
  } else {
    win?.webContents.send('FoundNewVersion', false, "");
  }
})

// download
ipcMain.on('startDownload', (_event, url: string, proxy:string) => {
  downloadNewVersion(win, url, proxy)
})


ipcMain.on('cancelDownload', (_event) => {
  cancelDownload()
})


// update
ipcMain.on('execUpdate', (_event, filePath: string) => {
  if (execUpdate(filePath))
    app.quit()
})

// import and export

ipcMain.on('getPromptSetFile', (_event) => {
  dialog.showOpenDialog({
    defaultPath: '/',
    filters: [
      { name: 'Json', extensions: ['json'] }
    ],
    properties: ['openFile']
  }).then(result => {

    if(!result.canceled) {
      win?.webContents.send('importPrompts', result.filePaths[0]);
    }

  }).catch(err => {
    console.log(err)
  })

})

ipcMain.on('getNewPromptSetFile', (_event) => {
  dialog.showSaveDialog({
    defaultPath: '/',
    filters: [
      { name: 'Json', extensions: ['json'] }
    ],
    properties: ['createDirectory']
  }).then(result => {

    if(!result.canceled) {
      win?.webContents.send('exportPrompts', result.filePath);
    }

  }).catch(err => {
    console.log(err)
  })

})

ipcMain.on('getNewDialogsFile', (_event) => {
  dialog.showSaveDialog({
    defaultPath: '/',
    filters: [
      { name: 'text', extensions: ['txt'] }
    ],
    properties: ['createDirectory']
  }).then(result => {

    if(!result.canceled) {
      win?.webContents.send('exportDialogs', result.filePath);
    }

  }).catch(err => {
    console.log(err)
  })

})


// quit
app.on('before-quit', (_event) => {
  //if (app.isPackaged) {
    endServer()
  //}
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})
