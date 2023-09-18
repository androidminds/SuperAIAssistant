<template>
    <div class="flex">
        <SvgIcon class= "w-8 h-8 mr-2 mt-1" src="favicon" />
        <div class="flex-1 flex flex-col overflow-hidden mr-8">
            <div class="origin-left scale-90 text-normal">{{ props.timestamp }}</div>
            <div class="bg-base-200 p-4 space-y-2">
                <template v-for="(segment, ) in textBlocks">
                    <div class="whitespace-pre-wrap break-all" v-if="segment.type === 'none'">
                        {{ segment.content }}
                    </div>
                    <CodeView :code="segment.content" :lang="segment.type" :type= "segment.feature" v-else />
                </template>
            </div>
            <div class="flex space-x-1 justify-end mt-1">
                <div class="origin-top scale-90 -mt-0.5 text-base-500">{{ props.model }}</div>
                <button class="btn-img" @click="onDelete($event.target)">
                    <SvgIcon class= "w-4 h-4" src="delete" />
                </button>
                <button class="btn-img" @click="onCopy(props.content)">
                    <SvgIcon class= "w-4 h-4" src="copy" />
                </button>
                <button class="btn-img" @click="onUpdate">
                    <SvgIcon class= "w-4 h-4" src="cycle" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref, watchEffect} from 'vue';

import CodeView from './CodeView.vue'
import {createDeleteConfirmDialog} from "@/lib/dialog"

const props = defineProps({
    content: { type: String, required: true },
    timestamp: { type: String, required: true },
    model: { type: String, default: '' },
    receiving: { type: Boolean, default: false },
    typeWriter : { type: Boolean, default: true },
    scroll: {type:Function, required:false,default:null},
    finish: {type:Function, required:false,default:null}
})

interface TextBlock {
    content: string;
    feature: string;
    type: string;
}

const textBlocks = ref<TextBlock[]>([])

function detectType(str: string): { type: string, feature: string, content: string } {
    const typeMap = [
        ['plaintext', 'txt'],
        ['javascript', 'js'],
        ['typescript', 'ts'],
        ['html', 'html'],
        ['sql', 'sql'],
        ['php', 'php'],
        ['json', 'json'],
        ['python', 'python'],
        ['css', 'css'],
        ['vue', 'js'],
        ['go', 'go'],
        ['c++', 'cpp'],
        ['java', 'java'],

        // 可以在这里增加更多的类型判断
    ];

    for (const [feature, type] of typeMap) {
        if (str.toLowerCase().startsWith(feature.toLowerCase())) {
            const content = str.substring(feature.length)
            return { type, feature, content };
        }
    }
    const type = 'clike'
    const feature = ""
    const content = str
    return { type, feature, content };
}

function strip(str: string) {
    let content = str
    if (content.startsWith("\n")) {
        content = content.substring(1)
    } else if (content.startsWith("\r\n")) {
        content = content.substring(2)
    }

    if (content.endsWith("\n")) {
        content = content.slice(0, length - 1)
    } else if (content.endsWith("\r\n")) {
        content = content.slice(0, content.length - 2)
    }

    return content
}

function parseText(message: string): TextBlock[] {
    const textList: TextBlock[] = [];
    let currentIndex = 0;

    if (message == null)
        return textList;

    while (true) {
        const sectionStartIndex = message.indexOf('```', currentIndex);

        if (sectionStartIndex === -1) {
            const lastText = message.slice(currentIndex);
            textList.push({ content: lastText, feature: "", type: "none" });
            break;
        }

        const lastText = message.slice(currentIndex, sectionStartIndex);
        textList.push({ content: strip(lastText), feature: "", type: "none" });

        const sectionEndIndex = message.indexOf('```', sectionStartIndex + 3);

        if (sectionEndIndex === -1) {
            const lastPart = message.slice(sectionStartIndex + 3);
            const { type, feature, content } = detectType(lastPart)
            textList.push({ content: content, feature: feature, type: type });
            break;
        }

        const sectionContent = message.slice(sectionStartIndex + 3, sectionEndIndex);
        const { type, feature, content } = detectType(sectionContent)
        textList.push({ content:  strip(content), feature: feature, type: type });
        currentIndex = sectionEndIndex + 3;
    }
    return textList;
}
let timer:any = null
let index = 0;

async function handleText() {
    if(props.typeWriter ) {
        if(timer == null) {
            index = 0
            timer = setInterval(() => {
                if(!props.typeWriter || (!props.receiving && index >= props.content.length)) {            
                    clearInterval(timer)                    
                    if(props.finish != null) props.finish()
                    textBlocks.value = parseText(props.content)
                    timer = null;
                    index = 0;
                    return
                }
                if(index < props.content.length) {
                    const content = props.content.substring(0, index++)
                    textBlocks.value = parseText(content)
                    if(props.scroll != null) props.scroll()                   
                }
            }, 20)
        }
    } else {
        textBlocks.value = parseText(props.content)
        if(props.scroll != null) props.scroll()    
    }
}

onBeforeMount(() => {
    handleText();
})

watchEffect(() => {
    handleText();
})


function onCopy(content: string) {
    if (!props.receiving)
        navigator.clipboard.writeText(content)
}


const emits = defineEmits(['delete', 'update'])
function onDelete(button: HTMLButtonElement) {
    if (!props.receiving) {
        createDeleteConfirmDialog(
            (button.getBoundingClientRect().left - 150) + 'px',
            (button.getBoundingClientRect().top + 20) + 'px',
            () => {
                emits("delete")
            }
        )
    }
}

function onUpdate() {
    if (!props.receiving)
        emits("update")
}

</script>
