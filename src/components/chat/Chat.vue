<template>
    <div class="flex flex-col overflow-hidden text-base-content">
        <div class="flex-1 overflow-hidden flex">
            <div ref="sideArea"  v-if="showChatList" class="h-full" :style="{width: sidePanelWidth ? sidePanelWidth + 'px' : 'calc(20%)'}">
                <SidePanel />
            </div>
            <FlexDivider vertical @move="onSideMove"/>
            <div class="flex-1 flex flex-col overflow-hidden">
                <ChannelList/>
                <dialogue-flow v-if="!showWelcome" class="flex-1" />
                <Welcome v-else class="flex-1"/>
                <FlexDivider @move="onMove"/>
                <InputArea ref="inputArea" v-model:areaHeight="inputAreaHeight"
                    v-model:minHeight="minInputAreaHeight"  v-model:maxHeight="maxInputAreaHeight" 
                    :style="{ height: inputAreaHeight ?  (inputAreaHeight+'px') : 'auto' }"/>
            </div>
        </div>
        <div class="h-1"/>
    </div>
</template>

<script lang="ts" setup>

import { ref, onBeforeMount, onMounted, onBeforeUnmount} from 'vue';
import { getConfigure, saveConfigure, getChatList, getOpenaiKeyList, getFreeSiteList} from '@/lib/backend'
import DialogueFlow from './DialogueFlow.vue';
import SidePanel from './SidePanel.vue';
import ChannelList from './ChannelList.vue';
import InputArea from './InputArea.vue';
import Welcome from './Welcome.vue';
import { useI18n } from 'vue-i18n';
const { t, locale } = useI18n()
import bus from '@/lib/bus'

let showWelcome = ref<boolean>(false)
let showChatList = ref<boolean>(true)

onBeforeMount(async () => {
    document.title = t('AppTitle')
    const theme = await getConfigure("Common.theme")
    if (theme != null) {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
    }
    locale.value = await getConfigure("Common.language", navigator.language)
    showWelcome.value = await isNewUser()
})

onMounted(async() => {
    
    const width = await getConfigure("Common.chatSideWidth", 0)
    if(width > 0) {
        sidePanelWidth.value = width
    }
    
    showChatList.value = await getConfigure("View.showChatList", true)

    bus.$on("setCurrentChat", onShowWelcome);
    bus.$on("channelChanged", onShowWelcome);
    bus.$on("openaiAccountChanged", onShowWelcome);
    bus.$on("showChatList", onShowChatList)
})

onBeforeUnmount(() => {
    bus.$off("setCurrentChat", onShowWelcome);
    bus.$off("channelChanged", onShowWelcome);
    bus.$off("openaiAccountChanged", onShowWelcome);
    bus.$off("showChatList", onShowChatList)
})

async function onShowWelcome() {
    showWelcome.value = await isNewUser()
}

function onShowChatList(show:any) {
    showChatList.value = show
}


const inputArea = ref<any>(null)
let inputAreaHeight = ref<number>()
let minInputAreaHeight = 0
let maxInputAreaHeight = 0

function onMove(distance: number) {
    if(!inputAreaHeight.value)
        inputAreaHeight.value = inputArea.value.offsetHeight

    if(inputAreaHeight.value) {
        inputAreaHeight.value -= distance;

        if (inputAreaHeight.value < minInputAreaHeight) {
            inputAreaHeight.value = minInputAreaHeight;
        } else if (inputAreaHeight.value > maxInputAreaHeight) {
            inputAreaHeight.value = maxInputAreaHeight;
        }
    }
}

let sidePanelWidth = ref<number>()
const sideArea = ref<any>(null)

async function onSideMove(distance: number) {
    if(!sidePanelWidth.value)
        sidePanelWidth.value = sideArea.value.offsetWidth

    if(sidePanelWidth.value) {
        sidePanelWidth.value += distance;

        if (sidePanelWidth.value < 200) {
            sidePanelWidth.value = 200;
        } else if (sidePanelWidth.value > window.innerWidth - 400) {
            sidePanelWidth.value = window.innerWidth - 400;
        }
        await saveConfigure("Common.chatSideWidth", sidePanelWidth.value)
    }
}

async function isNewUser() {
    const data = await getChatList()
    if(data.length > 0)
        return false

    const freesiteList = await getFreeSiteList()
    if(freesiteList.length > 0) 
        return false

    const openAIList = await getOpenaiKeyList()

    if(openAIList.length > 0)
        return false

    return true;
}


</script>

