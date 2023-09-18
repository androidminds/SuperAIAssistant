<template>
    <div class="space-y-2">
        <div id="OpenaiAccount" class="bg-base-200 text-lg font-bold p-1">{{ t('TitleOpenAIAccount') }}</div>
        <div class="p-1 space-y-4">
            <div>{{ t('OpenaiPrompt') }}</div>
                <button :disabled="showEditor" class="btn btn-primary w-fit" @click="onShowEditor">
                    {{t('BtnAddOpenai') }}
                </button>
            <div v-if="showEditor" class="flex flex-col space-y-1">
                <div class="text-sm font-bold">{{ t('InputKeyPompt') }}</div>
                <div class="space-x-2 flex items-center">
                    <textarea id="keyEditor" spellcheck="false" class="input input-primary h-8 w-6/12 mr-2 overflow-hidden" v-model="openAIKey" type="text" />
                    <button class="btn btn-primary" :disabled="openAIKey.length === 0" @click="onAdd(true)">{{ t('Ok') }}</button>
                    <button class="btn btn-primary" @click="onAdd(false)">{{ t('Cancel') }}</button>
                </div>
            </div>

            <table class="w-full border table-spacing-x-4">
                <caption class="caption-top font-bold text-sm text-left pb-2">{{ t('OpenaiAccountList') }}</caption>
                <thead>
                    <tr class="text-sm text-left">
                        <th class="p-2"></th>
                        <th class="p-2">{{ t('Key') }}</th>
                        <th class="p-2">{{ t('Model') }}</th>
                        <th class="p-2">{{ t('Proxy') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for='(item, index) in accountList' :key="index" class="border-t">
                        <td class="p-2"><input class="accent-primary" type="radio" :value="item['id']" v-model="selectdAccount"
                                @change="onEnabled" /></td>
                        <td class="p-2">{{ maskKey(item['key'], 11) }}</td>
                        <td class="p-2">{{ item['models'] }}</td>
                        <td class="p-2"> 
                            <Select class="border bg-base-100 text-sm" v-model="item['proxy']"
                                @change="onChangedProxy(index)">
                                <Option :value=null>None</Option>
                                <Option v-for="(proxy, index) in proxyList" :key="index" :value="proxy['id']">
                                    {{ proxy['url'] }}
                                </Option>
                            </Select>
                        </td>
                        <td class="p-2">
                            <button class="btn btn-primary" @click="onDelete($event.target, index)">{{ t('Delete')}}</button>
                        </td>
                    </tr>
                </tbody>
            </table>
          
            <table class="w-full border table-spacing-x-4">
                <caption class="caption-top font-bold text-sm text-left pb-2">{{t("OpenAIParameters")}}</caption>
                <thead>
                    <tr class="text-sm text-left">
                        <th class="p-2">suffix</th>
                        <th class="p-2">max_token</th>
                        <th class="p-2">temperature</th>
                        <th class="p-2">top_p</th>
                        <th class="p-2">n</th>
                        <th class="p-2">stop</th>
                        <th class="p-2">presence_penalty</th>
                        <th class="p-2">frequency_penalty</th>                     
                        <th class="p-2">logit_bias</th>
                        <th class="p-2">user</th> 
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-t ">
                        <td class="p-2"><textarea class="input input-primary w-24 h-8 overflow-hidden" v-model="params.suffix"/></td>
                        <td class="p-2"><textarea class="input input-primary w-8 h-8 overflow-hidden" v-model="params.max_token"/></td>
                        <td class="p-2"><textarea class="input input-primary w-8 h-8 overflow-hidden" v-model="params.temperature"/></td>
                        <td class="p-2"><textarea class="input input-primary w-8 h-8 overflow-hidden" v-model="params.top_p"/></td>
                        <td class="p-2"><textarea class="input input-primary w-8 h-8 overflow-hidden" v-model="params.n"/></td>
                        <td class="p-2"><textarea class="input input-primary w-12 h-8 overflow-hidden" v-model="params.stop"/></td>
                        <td class="p-2"><textarea class="input input-primary w-12 h-8 overflow-hidden" v-model="params.presence_penalty"/></td>
                        <td class="p-2"><textarea class="input input-primary w-12 h-8 overflow-hidden" v-model="params.frequency_penalty"/></td>
                        <td class="p-2"><textarea class="input input-primary w-24 h-8 overflow-hidden" v-model="params.logit_bias"/></td>
                        <td class="p-2"><textarea class="input input-primary w-24 h-8 overflow-hidden" v-model="params.user"/></td>
                       
                    </tr>
                </tbody>
            </table>
            <div class = "flex space-x-4">
                <button class="btn btn-primary w-auto" @click="onSetToDefault">{{t("SetToDefault")}}</button>
                <div class="italic text-sm text-gray-500 p-1">{{ t("ParamWarning") }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import { onBeforeUnmount, onMounted, ref, watchEffect } from "vue";
import { useI18n } from 'vue-i18n';
const { t } = useI18n()

import { createDeleteConfirmDialog } from "@/lib/dialog"
import { maskKey, encrypt } from '@/lib/crypto'
import { getConfigure, saveConfigure, getOpenaiKeyList, getProxyList, addOpenaiKey, deleteOpenaiKey, updateOpenaiKey } from '@/lib/backend'
import bus from '@/lib/bus'

let accountList = ref<any[]>([])
let proxyList = ref([])
let selectdAccount = ref(0)

const defaultParams : Record<string, any> = {
  suffix : null,
  max_token : null,
  temperature : 1,
  top_p : 1,
  n : 1,
  stop : "",
  presence_penalty : 0,
  frequency_penalty : 0,                      
  logit_bias : null,
  user : null, 
}

let params = ref<any>({})

function findAccount(list:any[], id:number)  {
    for(const item of list) {
        if(item.id == id) 
            return true
    }
    return false
}

async function updateAccountList() {
    accountList.value = await getOpenaiKeyList()
    proxyList.value = await getProxyList()
    selectdAccount.value = await getConfigure("Common.openaiAccount", 0)

    if(selectdAccount.value == null  || !findAccount(accountList.value, selectdAccount.value )) {
        if(accountList.value.length > 0) {
            selectdAccount.value = accountList.value[0].id
            await saveConfigure("Common.openaiAccount", selectdAccount.value)
        }
    }

    const configure : Record<string, any> = await getConfigure("OpenaiParameters", {})

    params.value = {
        ...defaultParams,
        ...configure
    }
}

let stopWatch:any = null

onMounted(async () => {
    await updateAccountList()
    bus.$on("ProxyChanged", updateAccountList)

    stopWatch = watchEffect(async () => {
        await saveConfigure("OpenaiParameters", params.value)
    })
})

onBeforeUnmount(() => {
    bus.$off("ProxyChanged", updateAccountList)
    if(stopWatch) stopWatch()
})

async function onSetToDefault() {
    params.value = {...defaultParams}
}



function onShowEditor() {
    showEditor.value = true
    setTimeout(() => {
        const editor = document.getElementById("keyEditor");
        editor?.focus()
    }, 200)
}


async function onEnabled() {
    await saveConfigure("Common.openaiAccount", selectdAccount.value)
    bus.$emit("openaiAccountChanged")
}

async function onChangedProxy(index: number) {
    if (await updateOpenaiKey(accountList.value[index]['id'], accountList.value[index]['proxy'])) {
        bus.$emit("openaiAccountChanged")
    }
}

let showEditor = ref(false)
let openAIKey = ref("")
async function onAdd(result: boolean) {
    showEditor.value = false

    let key = openAIKey.value
    if (openAIKey.value.length > 11) {
        const key1 = key.slice(0, 11)
        const key2 = key.slice(11, key.length)
        key = key1 + encrypt(key2)
    }

    if (result && openAIKey.value.length > 0) {
        const id = await addOpenaiKey(key, ['gpt-3.5-turbo'], null)
        if (id != null && !findAccount(accountList.value, selectdAccount.value)) {
            await saveConfigure("Common.openaiAccount", id)
        }
    }

    openAIKey.value = ""
    await updateAccountList()
    bus.$emit("openaiAccountChanged")
}


function onDelete(button: any, index: number) {
    createDeleteConfirmDialog(
        (button.getBoundingClientRect().left - 160) + 'px',
        (button.getBoundingClientRect().top + 30) + 'px',
        async () => {
            await deleteOpenaiKey(accountList.value[index]['id'])
            updateAccountList()
            bus.$emit("openaiAccountChanged")
        })
}


</script>