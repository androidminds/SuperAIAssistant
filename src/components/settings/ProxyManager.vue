<template>
    <div class="space-y-4">
        <div id="ProxyManager" class="bg-base-200 text-lg font-bold p-1">{{ t('TitleProxyManager') }}</div>
        <div class="space-y-2">
            <div class="text-sm font-bold">{{ t('ProxyPrompt') }}</div>
            <div class="flex space-x-4">
                <textarea spellcheck="false" class="input input-primary h-8 w-72  bg-base-100 overflow-hidden" v-model="proxyUrl"
                    type="text" />
                <button class="btn btn-primary" @click="onAdd()" :disabled="proxyUrl.length === 0">{{ t('Add') }}</button>
            </div>
            <div class="italic text-sm text-gray-500 p-1">{{ t('ProxyExample') }}</div>
        </div>
        <table class=" border table-spacing-x-4 w-5/12">
            <thead>
                <tr class="text-left text-sm font-bold">
                    <th class="p-2">{{ t('ProxyURL') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for='(item, index) in proxyList' :key="index" class="border-t">
                    <td class="p-2">
                        <div class="w-72">{{ item['url'] }}</div>
                    </td>
                    <td class="p-2"><button class="btn btn-primary" @click="onDelete($event.target, index)">{{ t('Delete')
                    }}</button></td>
                </tr>
            </tbody>
        </table>

        <div class="bg-base-200 text-lg font-bold p-1">{{ t('setGlobalProxy') }}</div>
        <div>{{ t('setGlobalProxyPrompt') }}</div>
        <Select class="border bg-base-100 text-sm" v-model="globalProxy" @change="onChangeProxy()">
            <Option :value=null>None</Option>
            <Option v-for="(proxy, index) in proxyList" :key="index" :value="proxy['id']">
                {{ proxy['url'] }}
            </Option>
        </Select>
    </div>
</template>


<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import { useI18n } from 'vue-i18n';
const { t } = useI18n()

import { createDeleteConfirmDialog } from "@/lib/dialog"
import { deleteProxy, addProxy, getProxyList, saveConfigure, getConfigure } from '@/lib/backend'
import bus from '@/lib/bus'


let proxyList = ref<any[]>([])
let proxyUrl = ref("")
let globalProxy = ref<any>(null)

async function updateProxyList() {
    proxyList.value = await getProxyList()
    globalProxy.value = await getConfigure("Common.globalProxy", null)
}

onBeforeMount(() => {
    updateProxyList()
})


async function onAdd() {
    const proxy = proxyUrl.value.replace("：", ":")
    if (await addProxy(proxy)) {
        bus.$emit("ProxyChanged")
        proxyUrl.value = ""
        updateProxyList()
    }
}


function onDelete(button: any, index: number) {
    createDeleteConfirmDialog(
        (button.getBoundingClientRect().left - 160) + 'px',
        (button.getBoundingClientRect().top + 30) + 'px',
        async () => {
            await deleteProxy(proxyList.value[index].id)
            updateProxyList()
            bus.$emit("ProxyChanged")
        })
}


async function onChangeProxy() {
    await saveConfigure("Common.globalProxy", globalProxy.value)
}

</script>