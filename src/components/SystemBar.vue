<template>
    <div class="flex flex-row items-center bg-base-400">
        <img class="w-6 h-6 mx-2" src="/chatbot.png">
        <SystemMenu class="text-base-content"/>
        <div class="flex-1 h-full" @dblclick="onMaximize" @mousedown="onMouseDown"/>
        <div class="h-full flex text-base-content items-center">
            <div @click="onMinimize" class="w-12 h-full hover:bg-base-600 flex items-center justify-center"><SvgIcon class="w-4 h-4" src="SysMinimize"/></div>
            <div @click="onMaximize" class="w-12 h-full hover:bg-base-600 flex items-center justify-center"><SvgIcon class="w-4 h-4" :src="isMaximized ? 'SysRestore' : 'SysMaximize'"/></div>
            <div @click="onClose" class="w-12 h-full hover:bg-red-600 flex items-center justify-center"><SvgIcon class="w-4 h-4" src="SysClose"/></div>
        </div>
    </div>

</template>

<script setup lang="ts">

import { ref, onMounted, onBeforeUnmount } from 'vue'

import { ipcRenderer} from 'electron'

import SystemMenu from './SystemMenu.vue'

let isMaximized = ref(false);

onMounted(() =>{
    ipcRenderer.on("SystemInfo", onSystemInfo)
})

onBeforeUnmount(() =>{
    ipcRenderer.removeListener("SystemInfo", onSystemInfo)
})

function onMouseDown(e:MouseEvent) {
    ipcRenderer.send("beginMoveWindow", e.clientX, e.clientY)

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

function onMouseUp(e:MouseEvent) {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    e.stopPropagation()
}

function onMouseMove(e:MouseEvent) {
    ipcRenderer.send("moveWindow", e.clientX, e.clientY)
    e.stopPropagation()
}

function onMinimize() {
    ipcRenderer.send("systemCommand", 'minimize')
}

function onMaximize() {
    ipcRenderer.send("systemCommand", 'toggleMaximize')
}

function onClose() {
    ipcRenderer.send("systemCommand", 'quit')
}

function onSystemInfo (_event:any, info:string) {
    if(info == "maximize") {
        isMaximized.value = true;
    } else if (info == "unmaximize") {
        isMaximized.value = false;
    }
}

</script>