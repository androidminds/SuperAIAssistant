<template>
    <div class="space-y-4">
        <div id="History" class="bg-base-200 text-lg font-bold p-1">{{ t('TitleHistory') }}</div>
        <div class="space-y-2 flex flex-col">
            <div class="flex">
                <input class="accent-primary mr-2" type="checkbox" v-model="enableByDefault" @change="onEnableByDefault"/>
                <div>{{ t('EnableChatHistory') }}</div>
            </div> 
        </div>
        <div class="space-y-2">
            <div class="flex">
                <input class="accent-primary mr-2" type="checkbox" v-model="useAllChats" @change="onEnableByDefault"/>
                <div>{{ t('UseAllChats') }}</div>
            </div> 
            <div class = "flex space-x-4 pl-8" v-if="useAllChats===false" >
                <div>{{ t('SetHistoryLength') }}</div>
                <Select class="w-16 h-8 bg-base-100 border pl-1" v-model="selected" @change="onChangeHistory() ">
                    <Option v-for="(length, index) in historyLengthList" :key="index" :value="length">
                        {{ length }}
                    </Option>
                </Select>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import { getConfigure, saveConfigure } from '@/lib/backend'
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

let historyLengthList = [1,2,3,4,5,6,7,8,9,10,11,12]

let selected = ref(3)

let enableByDefault = ref(false)
let useAllChats = ref(false)

onBeforeMount(async () => {
    enableByDefault.value = await getConfigure("ChatHistory.enableHistoryByDefault", false)
    useAllChats.value = await getConfigure("ChatHistory.useAllChats", false)
    selected.value = await getConfigure("ChatHistory.historyLength", 3)
})

async function onChangeHistory() {
    await saveConfigure("ChatHistory.historyLength", selected.value)
}

async function onEnableByDefault() {
    await saveConfigure("ChatHistory.enableHistoryByDefault", enableByDefault.value)
}


</script>