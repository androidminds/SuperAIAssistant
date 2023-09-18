<template v-if="props.visible">
    <Dialog :cancel="onCancel" :visible="visible">
        <div class="flex flex-col" v-if="downloadError">
            <div>{{t('DownloadError')}}: {{ errorMsg }}</div>
        </div>
        <div class="flex flex-col w-full px-2" v-else>
            <div class="h-8"> {{t('Downloading')}}</div>
            <div class="h-6 w-full bg-base-200">
                <div class="bg-primary h-full" :style="{'width': percentage}"></div>
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount} from 'vue'
import {useI18n} from 'vue-i18n';
const { t } = useI18n()
import { ipcRenderer } from 'electron'
import { getConfigure, getGlobalProxy } from '@/lib/backend';
import { createUpdateDialog } from '@/lib/dialog';

const props = defineProps({
    visible: { type: Boolean, required: true },
    url: { type: String, required: true},
    version: { type: String, required: true}
})

let percentage = ref('0%')

onMounted(async () =>{
    if(await getConfigure("Update.downloaded")) {
        percentage.value = "100%"
        finished(await getConfigure("Update.filePath"))
    } else {
        ipcRenderer.send('startDownload', props.url, await getGlobalProxy())
    }
    ipcRenderer.on("DownloadProgress", onDownloadProgress)
    ipcRenderer.on("DownloadError", onDownloadError)
})

onBeforeUnmount(() =>{
    ipcRenderer.removeListener("DownloadProgress", onDownloadProgress)
    ipcRenderer.removeListener("DownloadError", onDownloadError)
})

function onDownloadProgress(_event:any, progress:number, path:string) {
    percentage.value = progress + "%"
    if(progress == 100 && path.length > 0) {
        finished(path)
    }
}

let downloadError = ref(false)
let errorMsg = ref("")

function onDownloadError(_event:any, error:string) {
    console.log("here");
    downloadError.value = true;
    errorMsg.value = error
}

const emits = defineEmits(["update:visible"])

function onCancel() { 
    ipcRenderer.send('cancelDownload')
    emits("update:visible", false);
};

function finished(path:string) {
    emits("update:visible", false);
    setTimeout(() => {
        createUpdateDialog(props.version, path)
    })
};

</script>