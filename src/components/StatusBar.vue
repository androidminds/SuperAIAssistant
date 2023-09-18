<template>
    <div class="bg-base-400 flex justify-end">

        <div class="px-2 text-base-content cursor-pointer flex flex-row items-center" v-if="foundNewVersion"
            @click="onClickNewVersion">
            <span>{{ t('NewVersion') }}</span>
            <div class="w-4 h-4 bg-primary rounded-full text-center text-xs">1</div>
        </div>
    </div>
</template>

<script setup lang="ts">

import { ref, onMounted, onBeforeUnmount } from 'vue'

import { getConfigure } from '@/lib/backend';

import { ipcRenderer } from 'electron'

import { createCheckVersionDialog } from '@/lib/dialog'

import { useI18n } from 'vue-i18n';
const { t } = useI18n()

let foundNewVersion = ref(false)

onMounted(async () => {
    foundNewVersion.value = await getConfigure("Update.foundNewVersion", false)
    ipcRenderer.on("FoundNewVersion", onFoundNewVersion)
})

onBeforeUnmount(() => {
    ipcRenderer.removeListener("FoundNewVersion", onFoundNewVersion)
})

function onFoundNewVersion(_event: any, found: boolean) {
    foundNewVersion.value = found
}

function onClickNewVersion() {
    createCheckVersionDialog()
}


</script>