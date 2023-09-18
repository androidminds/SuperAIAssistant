<template>
    <div class="flex flex-col overflow-hidden">
        <div ref="dialogView" class="flex-1 overflow-y-auto pl-8 space-y-6 flex flex-col mb-2">
            <template v-for="(msg, index) in messages" :key="index">
                <SendCard :content="msg.input" :timestamp="msg.send_time" @delete="onDelete(index, true)"
                    :forbidOperate="forbidOperate" v-if="!msg.input_deleted" />
                <ReceiveCard :content="isTypeWriting(index) ? buffer : msg.response" :timestamp="msg.receive_time"
                    :model="msg.model" :receiving="receiving" :typeWriter="(isTypeWriting(index) && stream)" :scroll="updateScroll"
                    :finish="finishTypeWriting" @delete="onDelete(index, false)" @update="onUpdate(index)"
                    v-if="!msg.response_deleted" />
            </template>
        </div>
        <div class="h-10 w-full flex items-center justify-center mb-2" v-if="forbidOperate">
            <button
                class="hover:bg-third-focus bg-third text-third-content rounded  px-6 py-2 flex items-center justify-center"
                @click="onStopResponse">
                <SvgIcon src="stop" class="w-5 h-5" /> <span>{{ t('StopResponse') }}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">

import { ref, onMounted, getCurrentInstance, onBeforeUnmount } from 'vue';
import { getConfigure, getChatInfo, updateChatList, getChats, addChat, updateChat, getOpenaiKeyList, getFreeSiteList, getProxyList } from '@/lib/backend'
import { decrypt } from '@/lib/crypto'
import SendCard from './SendCard.vue';
import ReceiveCard from "./ReceiveCard.vue";
import bus from '@/lib/bus'
import { useI18n } from 'vue-i18n';
import { popupToast } from 'halcyonui';
const { t } = useI18n()

const globalProperties = getCurrentInstance()?.appContext.config.globalProperties;
const url = globalProperties?.$url;

interface Message {
    id: number;
    chat_id: number;
    //channel_type: string;
    //channel: string;
    input: string;
    prompt: string;
    temperature: string;
    response: string;
    send_time: string;
    receive_time: string;
    input_deleted: boolean;
    response_deleted: boolean;
    model: string;
}

const messages = ref<Message[]>([]);
let chatId = -1;

const dialogView = ref<any>(null)

let forbidOperate = ref(false)
let abortController = new AbortController();
let signal = abortController.signal
let responseReader: any = null

let allowedTypeWriting = true

function onDoChat(input:any) {
    if (input.length > 0)
        completion(input, -1)
}

function onClearChat(id:any) {
    onStopResponse()
    chatId = -1;
    messages.value.splice(0, messages.value.length)
}

function onDownload(id: any) {
    let output = ""
    for (const msg of messages.value) {
        if (!msg.input_deleted) {
            output += msg.input
            output += "\r\n\r\n"
        }

        if (!msg.response_deleted) {
            output += msg.response
            output += "\r\n\r\n\r\n"
        }
    }

    if (output.length > 0) {
        navigator.clipboard.writeText(output)
        popupToast(t("clipboardSuccess"))
    } else {
        popupToast(t("clipboardFail"))
    }
}

async function onSetCurrentChat(id: any)  {
    if (id > 0) {
        onStopResponse()
        chatId = Number(id)
        await getWholeChat()
        const config = await getChatInfo(chatId)
        setTimeout(async () => {
            if (config != null && dialogView.value) {
                if (config['scroll_top'] == -1)
                    dialogView.value.scrollTop = dialogView.value.scrollHeight;
                else
                    dialogView.value.scrollTop = config['scroll_top']
            }
        }, 200);
        
    }
}

function scrollListener() {
    if (!isScrolling) {
        isScrolling = true;
    }
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
        isScrolling = false;
        if (chatId > 0  && dialogView.value) {
            await updateChatList(chatId, { scroll_top: dialogView.value.scrollTop })
        }
    }, 200);

}

// watch the scroll event, save the current scroll position when scrolling is done
let isScrolling = false
let timeoutId: any = null
onMounted(() => {
    dialogView.value.addEventListener('scroll', scrollListener)

    bus.$on("doChat", onDoChat)
    bus.$on("cleanChat", onClearChat)
    bus.$on("download", onDownload)
    bus.$on("setCurrentChat", onSetCurrentChat);

});


onBeforeUnmount(() => {
    dialogView.value.removeEventListener('scroll', scrollListener)

    bus.$off("doChat", onDoChat)
    bus.$off("cleanChat", onClearChat)
    bus.$off("download", onDownload)
    bus.$off("setCurrentChat", onSetCurrentChat);
})



function formatDateTime(date: Date): string {
    const year = date.getFullYear()
    const month = ('0' + (date.getMonth() + 1)).slice(-2)
    const day = ('0' + date.getDate()).slice(-2)
    const hour = ('0' + date.getHours()).slice(-2)
    const minute = ('0' + date.getMinutes()).slice(-2)
    const second = ('0' + date.getSeconds()).slice(-2)

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}


function makePrompt(config: Record<string, string>, prompts: Record<string, Record<string, string>>, input: string): string {
    let prompt: Record<string, string>[] = []

    //if (config['rolePrompt'] != null && config['rolePrompt'].length > 0)
    //    prompt.push({ "role": "system", "content": config['rolePrompt'] })

    for (const key in prompts) {
        if (prompts[key]['enabled']) {
            prompt.push({ "role": "user", "content": prompts[key]['prompt'] })
        }
    }

    if (Boolean(config['use_context'])) {
        let contextLevel = Number(config['context_level'])
        const start = (contextLevel == 0) ? 0 : Math.max(0, messages.value.length - contextLevel)
        for (let i = start; i < length; i++) {
            const msg = messages.value[i]
            if (!msg.input_deleted)
                prompt.push({ "role": "user", "content": msg.input })

            if (!msg.response_deleted)
                prompt.push({ "role": "assistant", "content": msg.response })
        }
    }

    prompt.push({ "role": "user", "content": input })
    return JSON.stringify(prompt)
}



function getById(list: any[], key: string, value: any) {
    for (const item of list) {
        if (item[key] === value)
            return item
    }
    return null
}


async function getDecryptKey(key: string) {
    if (key.length <= 11)
        return key

    const key1 = key.slice(0, 11)
    const key2 = key.slice(11, key.length)
    const r = key1 + decrypt(key2)
    return r
}

function getModel(config: any, freeSites: any) {
    if (config['channelType'] == "OpenAI") {
        return config['openAISelected']
    } else if (config['channelType'] == "FreeSite") {
        return freeSites[config['freeSiteSelected']]['model']
    }
    return ""
}




let receivingIndex = ref(-1)  // Block index indicating that a response is being received


let typeWriting = ref(false)
let buffer = ref("")
let receiving = ref(false)

let stream = ref<boolean>(true)

let originScrolHeight = 0
let scrollHeight = 0;

function updateScroll() {
    // adjust the scroll position when receiving the response
    setTimeout(() => {
        if (scrollHeight != dialogView.value.scrollHeight) {
            // set the scroll top will cause the screen refreshing, so we need this to reduce the refresh times
            if (receivingIndex.value == messages.value.length - 1) {
                dialogView.value.scrollTop = dialogView.value.scrollHeight
            } else {
                dialogView.value.scrollTop = dialogView.value.scrollHeight - originScrolHeight;
            }
            scrollHeight = dialogView.value.scrollHeight
        }
    }, 50)
}

function beginTypeWriting(index: number) {
    scrollHeight = dialogView.value.scrollHeight
    receiving.value = true
    receivingIndex.value = index
    typeWriting.value = true
    buffer.value = ""
}

function finishTypeWriting() {
    receivingIndex.value = -1
    typeWriting.value = false
    forbidOperate.value = false
}

function isTypeWriting(index: number) {
    return (receivingIndex.value === index && typeWriting.value && allowedTypeWriting)
}


async function completion(input: string, index: number) {
    let chatInfo = await getChatInfo(chatId)
    if (chatInfo == null)
        return

    stream.value = await getConfigure("Common.stream", true)
    forbidOperate.value = true
    allowedTypeWriting = await getConfigure("Common.typeWriting", true)
    const freeSiteList = await getFreeSiteList()
    let promptList = await getConfigure("FrontPrompts")
    if (index == -1) { // new completion
        index = messages.value.length
        messages.value.push({
            id: 0,
            chat_id: chatId,
            //channel_type: config['channelType'],
            //channel: "",
            temperature: "",
            model: getModel(chatInfo, freeSiteList),
            input: input,
            prompt: makePrompt(chatInfo, promptList, input),
            response: "",
            send_time: formatDateTime(new Date()),
            receive_time: "",
            input_deleted: false,
            response_deleted: false,
        });
        // new completion we need set the scroll position at the bottom
        originScrolHeight = 0
    } else {
        // now we need control the scroll pos to stay at the refesh block's position
        originScrolHeight = dialogView.value.scrollHeight - dialogView.value.scrollTop
    }

    messages.value[index].receive_time = formatDateTime(new Date())


    // at the beginning, cycle ... to wait for response
    let i = 0
    const intervalId = setInterval(() => {
        const dots = [".", "..", "...", "....", ".....", "......."]
        messages.value[index].response = dots[i++]
        if (i == dots.length) i = 0
    }, 500);

    setTimeout(() => {
        if (index == messages.value.length - 1) {
            dialogView.value.scrollTop = dialogView.value.scrollHeight
        } else {
            dialogView.value.scrollTop = dialogView.value.scrollHeight - originScrolHeight;
        }
    })

    const proxies = await getProxyList()
    let completion_url = url
    let body = {}
    if (chatInfo.channel_type == "OpenAI") {
        const openAIList = await getOpenaiKeyList()
        const openAIAccount = await getConfigure("Common.openaiAccount")
        const openai = getById(openAIList, 'id', openAIAccount)
        completion_url += "/api/openai/completion"
        const proxy = await getById(proxies, 'id', openai.proxy)
        const params = await getConfigure("OpenaiParameters", undefined)
        body = {
            id: await getDecryptKey(openai.key),
            model: chatInfo.openai_channel,
            prompt: messages.value[index].prompt,
            proxy: proxy ? proxy.url : null,
            params,
        }
    } else {
        const site = getById(freeSiteList, 'uid', chatInfo.freesite_channel)
        completion_url += "/api/plugin/completion"
        const proxy = await getById(proxies, 'id', site.proxy)
        body = {
            file: site.file,
            prompt: messages.value[index].prompt,
            proxy: proxy ? proxy.url : null,
        }
    }

    fetch(completion_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'responseType': "stream"
        },
        body: JSON.stringify(body),
        signal
    }).then(async (response) => {
        clearInterval(intervalId);
        if (response == null || response.body == null)
            return;

        responseReader = response.body.getReader();
        const decoder = new TextDecoder()

        let first = true
        while (true) {
            try {
                const { done, value } = await responseReader.read();  // 读取下一个块
                if (first) {
                    first = false
                    beginTypeWriting(index)
                }
                if (done) break;
                if (value) buffer.value += decoder.decode(value)
            } catch (error) {
                finishTypeWriting()
                console.log(error);
                break;
            }
        }
        responseReader = null
        messages.value[index].response = buffer.value

        if (messages.value[index].id == 0)
            messages.value[index].id = await addChat(messages.value[index])
        else
            await updateChat(messages.value[index].id, messages.value[index])

        receiving.value = false
    }).catch((error: any) => {
        finishTypeWriting()
        clearInterval(intervalId);
        if (error.name === "AbortError") {
            console.log("Fetch Aborted");
        } else {
            console.log(error.message);
        }
    })
}


async function getWholeChat() {
    if (chatId < 0)
        return;

    const msgs = await getChats(chatId)
    messages.value.splice(0, messages.value.length)
    for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i]
        messages.value.push(msg);
    }
}


async function onDelete(index: number, isInput: boolean) {
    if (index >= 0 && index < messages.value.length) {
        if (isInput) {
            if (await updateChat(messages.value[index].id, { input_deleted: true }))
                messages.value[index].input_deleted = true
        } else {
            if (await updateChat(messages.value[index].id, { response_deleted: true }))
                messages.value[index].response_deleted = true
        }
    }
}

function onUpdate(index: number) {
    if (index >= 0 && index < messages.value.length) {
        completion("", index)
    }
}

function onStopResponse() {
    try {
        typeWriting.value = false
        forbidOperate.value = false
        abortController.abort()
        abortController = new AbortController();
        signal = abortController.signal
        if (responseReader != null) {
            responseReader.cancel()
        }
    } catch (error) {
        console.log(error)
    }
}
</script>
