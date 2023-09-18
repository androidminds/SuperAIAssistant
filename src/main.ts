import { createApp } from 'vue'
import App from '@/App.vue'
import i18n from '@/locales/index'
import halcyonui, { popupToast } from 'halcyonui'
import '@/css/style.css'

import Settings from '@com/settings/Settings.vue'
import Chat from '@com/chat/Chat.vue'

import { ipcRenderer } from 'electron'

import 'virtual:svg-icons-register'

import { setBackendUrl, getConfigure, saveConfigure, getGlobalProxy } from '@/lib/backend'
import { importPrompts, exportPrompts, exportDialogs } from '@/lib/backend'
import {createUpdateDialog} from '@/lib/dialog'

import {createRouter, createWebHashHistory} from 'vue-router'

const routes = [
  { path: '/', component: Chat },
  { path: '/settings', component: Settings},
]

const router = createRouter({
  history: createWebHashHistory(),
  routes, // `routes: routes` 的缩写
})

let t:any

ipcRenderer.on('startRenderProcess', async (_event, isPackaged:boolean, version:string, url:string) => {

  setBackendUrl(url)

  if (await getConfigure("Common") == null) {
      await saveConfigure("Common", {
        pluginIndexUrl1: "https://raw.githubusercontent.com/androidminds/aichatfree/main/",
        //pluginIndexUrl2: "https://gitee.com/codeminds/aichatfree/raw/main/"
    })
  }

  let app = createApp(App)

  app.use(i18n)
  app.use(halcyonui)
  app.use(router)
  app.config.globalProperties.$url = url
  app.config.globalProperties.$isPackaged = isPackaged
  app.config.globalProperties.$version = version

  app.mount('#app').$nextTick(async () => {
    t = i18n.global.t;
    postMessage({ payload: 'removeLoading' }, '*') 
    checkNewVersion(version)
  })

})

async function checkNewVersion(version:string) {
  const update =  await getConfigure("Update", {})

    if(update.foundNewVersion && update.newVersion == "v"+version) {
      await saveConfigure("Update", {
        ...update,
        foundNewVersion:false, 
        downloaded:false
      })
    }

    if(update.autoUpdate && update.downloaded) {
      createUpdateDialog(update.newVersion, update.filePath)
    }

    if(!update.foundNewVersion && update.autoCheck ) {
      ipcRenderer.send('autoCheckNewVersion', getGlobalProxy(), update.autoDownload)
    }

}


ipcRenderer.on('importPrompts', async (_event, path:string) => {
  const result = await importPrompts(path)
  popupToast(result ? t("ImportPromptSuccess") : t("ImportPromptfail"), result ? "info" : "error")
})

ipcRenderer.on('exportPrompts', async (_event, path:string) => {
  const result = await exportPrompts(path)
  popupToast(result ? t("ExportPromptSuccess") : t("ExortPromptfail"), result ? "info" : "error")
})

ipcRenderer.on('exportDialogs', async (_event, path:string) => {
  const result = await exportDialogs(path)
  popupToast(result ? t("ExportDialogSuccess") : t("ExportDialogfail"), result ? "info" : "error")
})
