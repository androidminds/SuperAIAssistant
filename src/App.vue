<template>
    <div class="h-screen flex flex-col overflow-hidden bg-base-100">
        <SystemBar class="w-full h-12" />
        <Chat v-if="page === 'chat'" class="flex-1 w-full " />
        <Settings class="flex-1 w-full" v-if="page === 'settings'"></Settings>
        <div v-if="page === 'error'" class="w-full h-full flex justify-center pt-36 space-x-2">
            <SvgIcon src="warnning" class="w-8 h-8 text-red-600" />
            <div class="font-bold text-lg text-base-content">{{t('BackendFail')}}</div>
        </div>
        <StatusBar v-if="showStatusBar" class="h-8 w-full"/>
    </div>
</template>


<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { getConfigPath, getConfigure } from '@/lib/backend'

import { useI18n } from 'vue-i18n';
const { t } = useI18n()

import Chat from "@com/chat/Chat.vue"
import SystemBar from '@com/SystemBar.vue'
import StatusBar from '@com/StatusBar.vue'
import Settings from '@com/settings/Settings.vue'
import bus from "./lib/bus"
let page = ref("chat")

let showStatusBar= ref<any>(true)

onMounted(async () =>{
    bus.$on("showSettings", onShowSettings)
    bus.$on("showChat", onShowChat)
    bus.$on("showStatusBar", onShowStatusBar)

    showStatusBar.value = await getConfigure("View.showStatusBar", true)
    if (await getConfigPath() == null) {
      page.value = "error"
    } else {
      page.value = "chat"
    }
})

onBeforeUnmount(() =>{
    bus.$off("showSettings", onShowSettings)
    bus.$off("showChat", onShowChat)
    bus.$off("showStatusBar", onShowStatusBar)
})

function onShowSettings() {
    page.value = "settings"
}

function onShowChat() {
    page.value = "chat"
}

function onShowStatusBar(show:any) {
    showStatusBar.value = show
}


</script>