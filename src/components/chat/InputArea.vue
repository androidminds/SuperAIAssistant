<template>
    <div ref="inputArea" class="px-7 py-3 flex items-center space-x-2">
        <div class="flex space-x-2">
            <button class="btn-img" @click="onSettings" :title="t('TooltipSetting')">
                <SvgIcon src="setting" class="w-5 h-5" />
            </button>
            <button class="btn-img" @click="onPromptManager" :title="getRoleTooltip()">
                <SvgIcon src="role" class="w-5 h-5" />
            </button>
            <button class="btn-img" :class="useContext ? '' : 'text-base-600'" @click="onChangeUseContext"
                :title="useContext ? t('TooltipCloseContext') : t('TooltipOpenContext')">
                <SvgIcon src="history" class="w-5 h-5" />
            </button>
            <button ref="dbutton" class="btn-img"  @click="onDownload" :title="t('TooltipDownload')">
                <SvgIcon src="download" class="w-5 h-5" />
            </button>
        </div>
        <textarea ref="inputBox" v-model="input" type="text" spellcheck="false"
            class="flex-1 w-full h-full input input-primary overflow-y-auto overflow-x-hidden"
            :placeholder="t('InputPrompt')" @keydown="onKeyDown($event)" :disabled="!isValid"/>
        <button @click="onChat" class="btn btn-primary w-12 h-8 flex justify-center items-center" :disabled="!isValid">
            <SvgIcon src="send" class="w-5 h-5" />
        </button>

    </div>
</template>


<script lang="ts" setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {getChatInfo, updateChatList, getFreeSiteList, getOpenaiKeyList } from '@/lib/backend'
import { calcTextareaHeight } from '@/lib/textarea'
import bus from '@/lib/bus'

import {createPromptManager} from '@/lib/dialog';

const { t } = useI18n()

let chatId = -1
let useContext = ref(true)
let isValid = ref(false)


const props = defineProps(['minHeight', 'maxHeight', 'areaHeight']);
const emits = defineEmits(["update:minHeight", "update:maxHeight", "update:areaHeight"])

const input = ref('');

const inputArea = ref<any>(null)
const inputBox = ref<any>(null)


onMounted(() => {
    const inputBoxHeight = calcTextareaHeight(inputBox.value, 1)
    const extraHeight = inputArea.value.offsetHeight - inputBox.value.offsetHeight

    bus.$on("setCurrentChat", onSetCurrentChat);
    bus.$on("channelChanged", onCheckValidation);
    bus.$on("openaiAccountChanged", onCheckValidation);
    bus.$on('insertPrompt', onInsertPrompt)

    emits("update:minHeight", inputBoxHeight + extraHeight)
    emits("update:maxHeight", window.innerHeight - 200)
    emits("update:areaHeight", inputBoxHeight + extraHeight + 1)
})

onBeforeUnmount(()=> {
    bus.$off("setCurrentChat", onSetCurrentChat);
    bus.$off("channelChanged", onCheckValidation);
    bus.$off("openaiAccountChanged", onCheckValidation);
    bus.$off('insertPrompt', onInsertPrompt)
})

async function onSetCurrentChat(id: any) {
    if (id > 0) {
        chatId = Number(id)
        const config = await getChatInfo(id) as any
        useContext.value = config['use_context']
        isValid.value = await isValidChat()
    }
}

async function onCheckValidation() {
    isValid.value = await isValidChat()
}


function onInsertPrompt(prompt: any) {
    input.value = prompt + "\n" + input.value
    inputBox.value.focus()
}



async function isValidChat() {
    if (chatId < 0)
        return false

    const freesiteList = await getFreeSiteList()
    const openAIList = await getOpenaiKeyList()

    for (let key in freesiteList) {
        if (freesiteList[key]['enabled'])
            return true
    }

    for (let key in openAIList) {
        if (openAIList[key]['enabled'])
            return true
    }

    return false
}

function onChat() {
    if (input.value.length > 0) {
        bus.$emit('doChat', input.value)
        input.value = '';
        inputBox.value.focus()
    }
}

function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
        if (event.shiftKey || event.altKey) {
            const index = inputBox.value.selectionStart
            input.value = input.value.slice(0, index) + "\n" + input.value.slice(index);
            nextTick(() => {
                inputBox.value.selectionStart = index + 1
                inputBox.value.selectionEnd = index + 1
            })
            event.preventDefault() // must adding this line, otherwise it will insert an extra '\n'
        } else {
            onChat();
            event.preventDefault()
        }
    }
}

watch(input, (_newValue, _) => {
    nextTick(() => {
        const extraHeight = inputArea.value.offsetHeight - inputBox.value.offsetHeight

        const count = input.value ? input.value.split("\n").length : 1

        let height = calcTextareaHeight(inputBox.value, count) + extraHeight + count*0.5

        if (height < props.minHeight) {
            height = props.minHeight;
        } else if (height > props.maxHeight) {
            height = props.maxHeight;
        }
        emits("update:areaHeight", height)
    })
})



async function onChangeUseContext() {
    useContext.value = !useContext.value
    if (chatId > 0)
        await updateChatList(chatId, { use_content: useContext.value })
}

function onSettings() {
    bus.$emit("showSettings")
}


function onPromptManager() {
    createPromptManager()
}

function getRoleTooltip() {
    return t('TooltipRole')
}


function onDownload() {
    bus.$emit("download")
}

</script>