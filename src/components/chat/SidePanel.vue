<template>
    <div class="w-full h-full flex flex-col bg-base-100">
        <div class="h-16 border-b px-3 flex items-center justify-center">
            <button class="btn btn-primary h-8 w-full inline-flex items-center justify-center"
                @click="onNewChat">
               <SvgIcon class="text-info w-6 h-6 mr-1" src="add"></SvgIcon>
               <span class="truncate">{{ t('BtnNewChat') }}</span>
            </button>
        </div>
        <div class="flex-1 p-2 space-y-2 overflow-auto scrollbar-thin">
            <div v-for="(chat, key) in chatList" :key="key" @click="onClickChat(Number(key))"
                class="py-1 rounded border border-dotted hover:bg-base-200 flex items-center justify-center "
                :class="{'':!isCurrentChat(Number(key)), 'text-primary border-primary': isCurrentChat(Number(key))}">
                <div class="w-full flex items-center justify-center p-1" v-if="Number(key) !== editing_id">
                    <SvgIcon class="mr-2 w-3.5 h-3.5" src="chat" />
                    <div class="flex-1 whitespace-nowrap text-ellipsis overflow-hidden">{{ chat.title }}</div>
                    <button class="ml-1 btn-img transform transition-all" @click="onChatEdit(Number(key))"
                        v-show=isCurrentChat(Number(key))>
                        <SvgIcon class= "w-4 h-4" src="edit" />
                    </button>
                    <button class="btn-image m-1 transform transition-all"
                        @click="onChatDelete($event.target)" v-show=isCurrentChat(Number(key))>
                        <SvgIcon class= "w-4 h-4" src="delete" />
                    </button>
                </div>
                <div class="w-full flex items-center justify-center p-1" v-else>
                    <SvgIcon class="mr-2 w-3.5 h-3.5" src="chat" />
                    <textarea id="titleEditor"
                        class="flex-1 input input-primary h-6 p-0 overflow-hidden"
                        v-model="titleInput" type="text" @keydown.enter="onSaveTitle(key)" />
                    <button class="ml-1 btn-img transform transition-all" @click="onSaveTitle(key)">
                        <SvgIcon class= "w-4 h-4" src="save" />
                    </button>
                    <button class="m-1 btn-img transform transition-all" @click="onCancelEdit(key)">
                        <SvgIcon class= "w-4 h-4" src="cancel" />
                    </button>
                </div>
            </div>         
        </div>
        <div class="h-32 w-full border-t"></div>
    </div>
</template>

<script setup lang="ts">

import {onBeforeMount, ref} from "vue";
import {useI18n} from 'vue-i18n';
const { t } = useI18n()

import {getConfigure, saveConfigure, getChatList, updateChatList, addChatList, deleteChatList} from '@/lib/backend'
import {createDeleteConfirmDialog} from "@/lib/dialog"
import bus from '@/lib/bus'

const MAX_ID = 1000000

let chatList = ref<Record<number, any>>({})
let currentChatId = ref(-1)

let editing_id = ref<number>(-1)
let titleInput = ref<string>("")

onBeforeMount(async() => {
    const data = await getChatList()
    if(data) {
        let id
        for (let i = 0; i < data.length; i++) {
            id = data[i]['id']
            chatList.value[MAX_ID - id] = data[i]                
        }
        setCurrentChat(await getConfigure("Common.current_chat", (MAX_ID - id)));
    }
})


function isCurrentChat(id: number) {
    return id == currentChatId.value
}

async function saveChatTitle(id: number, title: string) {
    const chat = chatList.value[id]
    if(await updateChatList(chat['id'], {title})) {
        chat['title'] = title
    }
}

async function onNewChat() {
    editing_id.value = -1
    const historyInfo = await getConfigure("ChatHistory")
    const data = {
            'title': t('BtnNewChat'),
            'use_context': historyInfo ? historyInfo['enableHistoryByDefault'] : false,
            'context_level': historyInfo ? historyInfo['historyLength'] : 3,
        }
    const id = await addChatList(data)
    if(id != null) {
        chatList.value[MAX_ID - id] = { id, ...data}
        setCurrentChat(MAX_ID - id)        
    }
}


async function setCurrentChat(id: number) {
    if(id in chatList.value) {
        currentChatId.value = id
        await saveConfigure("Common.current_chat", id)
        setTimeout(() => {
            // if don't use setTimout, the first time this emit can not be recevied
            bus.$emit('setCurrentChat', MAX_ID-id);
        }, 200);
    }
}

function onClickChat(id: number) {
    if (id != currentChatId.value) {
        setCurrentChat(id)
        if (editing_id.value != id)
            editing_id.value = -1
    }
}

function onChatEdit(id: number) {
    titleInput.value = chatList.value[id].title
    editing_id.value = id
    setTimeout(() => {
        const editor = document.getElementById("titleEditor");
        editor?.focus()
    }, 200)
}


function onChatDelete(button: any) {    
    createDeleteConfirmDialog(
        button.getBoundingClientRect().left + 'px',
        (button.getBoundingClientRect().top + 20) + 'px',
        async ()=>{
            const id = currentChatId.value
            const chat = chatList.value[id]
            console.log('deleteChat')
            if(await deleteChatList(chat['id'])) {
                const nextid = getNextId(id, chatList.value)
                delete chatList.value[id]
                setCurrentChat(nextid)
                if(Object.keys(chatList.value).length == 0) bus.$emit("cleanChat")
            }
        })
}

function getNextId(id: number, list: Record<number, string>) {
    let keys: number[] = []
    let current = -1
    for (const key in list) {
        keys.push(Number(key))
        if (Number(key) == id) {
            current = keys.length - 1
        }
    }

    if (current == -1)
        return -1
    else if (current == keys.length - 1)
        if (keys.length == 1)
            return -1
        else
            return keys[0]
    else
        return keys[current + 1]
}

async function deleteChat(id: number) {

}

function onSaveTitle(id: number) {
    saveChatTitle(id, titleInput.value)
    editing_id.value = -1
}

function onCancelEdit(id: number) {
    if (id == editing_id.value)
        editing_id.value = -1
}
</script>
