<template>
     <Dialog :ok="stage === 1?onOk:undefined" :cancel="onCancel" :visible="visible">
        <div class="">
            <div  v-if="stage === 0" class="flex space-x-4">
                <div>{{t('Checking')}}</div><SvgIcon class= "animate-spin h-6 w-6 text-primary" src="cycle"/>
            </div>
            <div  v-if="stage === 1"> {{t('NewVersionFound', {version})}}</div>
            <div  v-if="stage === 2">{{t('NoVersionFound')}}</div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">

import { ipcRenderer } from 'electron'
import { ref, onMounted, onBeforeUnmount} from 'vue';
import {getGlobalProxy} from '@/lib/backend'
import {createDownloadProgress } from "@/lib/dialog"

import {useI18n} from 'vue-i18n';
const { t } = useI18n()

defineProps({
    visible: { type: Boolean, required: true }
})

let stage = ref(0)
let version = ref("")
let url = ""


onMounted(async () =>{
    ipcRenderer.send("manualCheckNewVersion", await getGlobalProxy())
    ipcRenderer.on("FoundNewVersion", onFoundVersion)
})

onBeforeUnmount(() =>{
    ipcRenderer.removeListener("FoundNewVersion", onFoundVersion)
})

function onFoundVersion(_event:any, found:boolean, _version: string, _url: string) {
    if(found) {
        stage.value = 1
        version.value = _version
        url = _url
    } else {
        stage.value = 2
    }
}

const emits = defineEmits(["update:visible"])

function onCancel() {
    emits("update:visible", false);
};

function onOk() {
    setTimeout(() => {          
        createDownloadProgress(version.value, url);
    }, 20)
    emits("update:visible", false);
};

</script>