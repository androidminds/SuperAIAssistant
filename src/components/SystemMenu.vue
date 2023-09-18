<template>
    <AppMenu menubar>
        <AppMenu :title="t('Menu.file')" shortcut="F">
            <AppMenu :title="t('Menu.import')">
                <MenuItem :title="t('Menu.importPrompts')" @command="onImportPrompts"/>
            </AppMenu>
            <AppMenu :title="t('Menu.export')">
                <MenuItem :title="t('Menu.exportPrompts')" @command="onExportPrompts"/>
                <MenuItem :title="t('Menu.exportDialogs')" @command="onExportDialogs"/>
            </AppMenu>
            <div class="appmenu-divide"/>
            <MenuItem :title="t('Menu.setting')" shortcut="Ctrl+S" @command="onSetting"/>
            <div class="appmenu-divide"/>
            <MenuItem :title="t('Menu.quit')" @command="onQuit"/>
        </AppMenu>
        <AppMenu :title="t('Menu.view')" shortcut="V">
            <MenuItem :title="t('Menu.reload')" shortcut="Ctrl+R" @command="onReload"/>
            <MenuItem :title="t('Menu.toggleDevTool')" shortcut="Ctrl+Shift+I" @command="onToggleDevTool"/>
            <div class="appmenu-divide"/>
            <MenuItem :title="t('Menu.realSize')" shortcut="Ctrl+0" @command="onRealSize"/>
            <MenuItem :title="t('Menu.zoomIn')" shortcut="Ctrl++" @command="onZoomIn"/>
            <MenuItem :title="t('Menu.zoomOut')" shortcut="Ctrl+-" @command="onZoomOut"/>
            <div class="appmenu-divide"/>
            <MenuItem v-if="showChatList" :title="t('Menu.closeChatList')" @command="onShowChatList(false)"/>
            <MenuItem v-else :title="t('Menu.showChatList')" @command="onShowChatList(true)"/>
            <MenuItem v-if="showStatusBar" :title="t('Menu.closeStatusBar')" @command="onShowStatusBar(false)"/>
            <MenuItem v-else :title="t('Menu.showStatusBar')" @command="onShowStatusBar(true)"/>
        </AppMenu>
        <AppMenu :title="t('Menu.help')" shortcut="H">
            <MenuItem :title="t('Menu.update')" @command="onUpdate"/>
            <MenuItem :title="t('Menu.about')" @command="onAbout"/>
        </AppMenu>
    </AppMenu>

</template>

<script setup lang="ts">

import {getCurrentInstance, onMounted, ref} from 'vue'
import { ipcRenderer, webFrame} from 'electron'
import {useI18n} from 'vue-i18n';
const { t } = useI18n()
import bus from "@/lib/bus"
import {createCheckVersionDialog, createAboutDialog } from "@/lib/dialog"
import { getConfigPath, getConfigure, saveConfigure } from '@/lib/backend';

const globalProperties = getCurrentInstance()?.appContext.config.globalProperties;

let showStatusBar = ref<any>(true)
let showChatList = ref<any>(true)

onMounted(async() =>{
    showStatusBar.value = await getConfigure("View.showStatusBar", true)
    showChatList.value = await getConfigure("View.showChatList", true)
})

function onQuit() {
    ipcRenderer.send("systemCommand", "quit")
}

function onImportPrompts() {
    ipcRenderer.send("getPromptSetFile")
}

function onExportPrompts() {
    ipcRenderer.send("getNewPromptSetFile")
}

function onExportDialogs() {
    ipcRenderer.send("getNewDialogsFile")
}

function onSetting() {
    bus.$emit("showSettings")
}

function onReload() {
    ipcRenderer.send("systemCommand", "reload")
}

function onToggleDevTool() {
    ipcRenderer.send("systemCommand", "toggleDevTool")
}

function onRealSize() {
    webFrame.setZoomLevel(0)
}

function onZoomIn() {
    webFrame.setZoomLevel(webFrame.getZoomLevel() + 1);
}

function onZoomOut() {
    webFrame.setZoomLevel(webFrame.getZoomLevel() - 1);
}

function onUpdate() {
    createCheckVersionDialog()
}

function onAbout() {
    createAboutDialog(globalProperties?.$version)
}

async function onShowStatusBar(show: boolean) {
    showStatusBar.value = show
    await saveConfigure("View.showStatusBar", show)
    bus.$emit("showStatusBar", show)
}

async function onShowChatList(show: boolean) {
    showChatList.value = show
    await saveConfigure("View.showChatList", show)
    bus.$emit("showChatList", show)
}

</script>../lib/dialog