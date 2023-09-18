<template>
    <div class="p-2 flex justify-center">
        <div class="max-w-content h-full flex space-x-4">
            <DropdownButton v-if="openaiValid" class="h-11" :class="{
                'rounded bg-primary text-content-focus hover:bg-primary-focus': isCurrentSite('OpenAI'),
                'rounded bg-secondary text-secondary-content hover:bg-secondary-focus ': !isCurrentSite('OpenAI')
            }" @click="onSelect('OpenAI')" label="OpenAI" :items="getOpenaiModelList()"
                @changeSelected="onSelect('OpenAI')" v-model:selected="chatConfig['openai_channel']" 
                :title="maskKey(openaiConfig['key'],11)"/>

            <DropdownButton v-if="pluginValid" class="h-11" :class="{
                'rounded bg-primary text-content-focus  hover:bg-primary-focus': isCurrentSite('FreeSite'),
                'rounded bg-secondary text-secondary-content hover:bg-secondary-focus': !isCurrentSite('FreeSite')
            }" @click="onSelect('FreeSite')" :label="t('FreeSite')" :items="getFreeSiteTitleList()"
                @changeSelected="onSelect('FreeSite')" v-model:selected="chatConfig['freesite_channel']" />
        </div> 
    </div>
</template>
  
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import DropdownButton from './DropdownButton.vue'
import {getConfigure, getChatInfo, updateChatList, getFreeSiteList, getOpenaiKeyList} from '@/lib/backend'
import {maskKey} from "@/lib/crypto"

import bus from '@/lib/bus'

import { useI18n } from 'vue-i18n';
const { t } = useI18n()

let chatId = -1
let pluginValid = ref(false)
let openaiValid = ref(false)

let freesiteList = ref<Record<string, any>>({});
let openaiConfig = ref<Record<string, any>>({});
let chatConfig = ref<Record<string, any>>({});

onMounted(()=>{
    bus.$on("setCurrentChat", onSetCurrentChat)
    bus.$on("channelChanged", onUpdateChannel)
    bus.$on("openaiAccountChanged", onUpdateChannel)
    bus.$on("chatClean", onChatClear)
})

onBeforeUnmount(()=>{
    bus.$off("setCurrentChat", onSetCurrentChat)
    bus.$off("channelChanged", onUpdateChannel)
    bus.$off("openaiAccountChanged", onUpdateChannel)
    bus.$off("chatClean", onChatClear)
})


async function onSetCurrentChat(id: any) {
    chatId = Number(id)
    await updateChannel()
}

async function onUpdateChannel() {
    await updateChannel()
}

function onChatClear() {
    freesiteList.value = {}
    openaiConfig.value = {}
    chatConfig.value = {}
    pluginValid.value = false
    openaiValid.value = false
}



function isCurrentSite(type: string) {
    return (type == chatConfig.value['channel_type'])
}

async function updateChannelInfo(channel_type:string, freesite_channel:string, openai_channel:string) {
    return await updateChatList(chatId, {channel_type, freesite_channel, openai_channel})
}

async function onSelect(type: string) {

    if(await updateChannelInfo(type, chatConfig.value['freesite_channel'], chatConfig.value['openai_channel']))
    {
        chatConfig.value['channel_type'] = type;
    }
}

async function updateChannel() {
    if(chatId < 0)
        return;

    let openai = false
    let freesite = false

    //load configuration
    const freesites = await getFreeSiteList()
    freesiteList.value = {}
    for(const site of freesites) {
        if(site.enabled) {
            freesiteList.value[site.uid] = site
            freesite = true
        }
    }

    const openaiList = await getOpenaiKeyList()
    const openaiAccount = await getConfigure("Common.openaiAccount", 0)

    if(openaiList.length > 0) {
        openai = true
        openaiConfig.value = openaiList[0]
        for(const item of openaiList) {
            if(item.id == openaiAccount) {
                openaiConfig.value = item
                break;
            }
        }
    }

    if(!freesite && !openai)
        return;
    
    chatConfig.value = await getChatInfo(chatId)

    
    //set the dfault channel type
    let channel = chatConfig.value['channel_type'];
    if(!openai && freesite && channel ==  "OpenAI") {
        channel = "FreeSite"
    } else if(!freesite && openai && channel == "FreeSite") {
        channel = "OpenAI"
    } else if((openai || freesite) && channel != "OpenAI"  && channel != "FreeSite") {
        if(!openai) {
            channel = "FreeSite"
        } else {
            channel = "OpenAI"
        }
    }
    chatConfig.value['channel_type'] = channel
    
    // set the default channel of free sites
    if( Object.keys(freesiteList.value).length > 0) {
        const channel = chatConfig.value['freesite_channel']
        if (channel == null || channel != null && !(channel in freesiteList.value) ) {
            chatConfig.value['freesite_channel'] = Object.keys(freesiteList.value)[0]
        }
    }
    
    // set the default channel of openai channel
    if (openai && !chatConfig.value['openai_channel']) {
        chatConfig.value['openai_channel'] = openaiConfig.value['models'][0]
    }


    await updateChannelInfo (
        chatConfig.value['channel_type'], 
        chatConfig.value['freesite_channel'], 
        chatConfig.value['openai_channel']
    )

    openaiValid.value = openai
    pluginValid.value = freesite
}

function getFreeSiteTitleList() {
    let titleList: Record<string, string> ={}
    for (const index in freesiteList.value) {
        if(freesiteList.value[index]['enabled'])
            titleList[index] = freesiteList.value[index]['name'] + " (" + freesiteList.value[index]['model'] +")"
    }
    return titleList
}


function getOpenaiModelList() {
    let modelList: Record<string, string> ={}
    const models = openaiConfig.value['models']
    for (let index = 0; index < models.length; index++) {
        modelList[models[index]] = models[index]
    }
    return modelList
}

</script>
  
  