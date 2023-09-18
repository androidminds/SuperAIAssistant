
import {saveConfigure, getConfigure} from './server'

export async function saveWindowPosition(winRect: any) {
    await saveConfigure("Common.windowPosition", JSON.stringify(winRect))
}
 
export async function getWindowPosition() {
  const position = await getConfigure("Common.windowPosition") as string
  if(position) {
    return JSON.parse(position)
  } else {
    const { screen } = require('electron');
    const {width, height} = screen.getPrimaryDisplay().workAreaSize
    return {
      x: (width*0.1 | 0),
      y: (height*0.2 | 0),
      width: (width*0.9 | 0),
      height: (height*0.8 | 0)
    }
  }
}

  
export function registerKeepPositionFunctions(win:any) {
    win.on('resized', () => {
        if(win) saveWindowPosition(win)
      })
    
      win.on('moved', () => {
        if(win) saveWindowPosition(win)
      })
    
}