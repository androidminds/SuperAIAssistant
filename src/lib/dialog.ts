import { createApp, h } from 'vue'
import i18n from '@/locales/index'
import CheckVersion from '@com/update/CheckVersion.vue'
import DownloadProgress from '@com/update/DownloadProgress.vue'
import AboutDialog from '@com/About.vue'
import PromptManager from '@com/chat/PromptManager.vue'
import halcyonui from 'halcyonui'
import {createConfirmDialog, createDialog} from 'halcyonui'

export function createDeleteConfirmDialog(left:string, top:string, yes: Function) {
    createConfirmDialog(i18n.global.t('DeleteConfirm'), left, top, yes, i18n)
}

export function createUninstallConfirmDialog(left:string, top:string, yes: Function) {
    createConfirmDialog(i18n.global.t('DeleteConfirm'), left, top, yes, i18n)
}

export function createDownloadProgress(version:string, url:string) {
    const div = document.createElement('div')
    document.body.appendChild(div)

    const app = createApp({
        render() {
            return h(DownloadProgress, {
                visible: true,
                'onUpdate:visible': (newVisible) => {
                    if (newVisible === false) {
                        app.unmount()
                        div.remove()
                    }
                },
                version,
                url
            }, { default() { return null } })
        }
    })
    app.use(i18n).use(halcyonui).mount(div)
}

export function createCheckVersionDialog() {
    const div = document.createElement('div')
    document.body.appendChild(div)

    const app = createApp({
        render() {
            return h(CheckVersion, {
                visible: true,
                'onUpdate:visible': (newVisible) => {
                    if (newVisible === false) {
                        app.unmount()
                        div.remove()
                    }
                }
            }, { default() { return null } })
        }
    })
    app.use(i18n).use(halcyonui).mount(div)
}



export function createAboutDialog(version: string) {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const app = createApp({
        render() {
            return h(AboutDialog, {
                visible: true,
                version: version,
                'onUpdate:visible': (newVisible: boolean) => {
                    if (newVisible === false) {
                        app.unmount();
                        div.remove();
                    }
                },
            }, { default() { return null; } });
        },
    });
    app.use(i18n).use(halcyonui).mount(div);
}


export function createPromptManager() {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const app = createApp({
        render() {
            return h(PromptManager, {
                visible: true,
                'onUpdate:visible': (newVisible: boolean) => {
                    if (newVisible === false) {
                        app.unmount();
                        div.remove();
                    }
                },
            }, { default() { return null; } });
        },
    });

    app.use(i18n).use(halcyonui).mount(div);
}


import { ipcRenderer } from 'electron'

export function createUpdateDialog(version: string, filePath: string) {
    createDialog(i18n.global.t('AskAboutUpdate', {version}), 
    // ok
    ()=> { ipcRenderer.send('execUpdate', filePath) },
    // cancel, do nothing
    ()=>{}
    ,i18n
  )
}