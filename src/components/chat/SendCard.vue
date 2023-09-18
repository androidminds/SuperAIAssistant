<template>
    <div class="flex">
        <div class="flex-1 flex-col overflow-hidden ml-8">
            <div class="scale-90 origin-right text-right text-normal">
                {{ props.timestamp }}
            </div>
            <div class="flex justify-end">
                <div class="inline-block p-2 bg-base-300 whitespace-pre-wrap break-all">
                    {{ props.content }}
                </div>
            </div>
            <div class="flex space-x-1 justify-end mt-1">
                <button class="btn-img" @click="onDelete($event.target)">
                    <SvgIcon class="w-4 h-4" src="delete"/>
                </button>
                <button class="btn-img" @click="onCopy(props.content)">
                    <SvgIcon class="w-4 h-4" src="copy"/>
                </button>
            </div>
        </div>
        <SvgIcon class="w-8 h-8 ml-2 mr-2 mt-1" src="user" />
    </div>
</template>

<script setup lang="ts">

import {createDeleteConfirmDialog} from "@/lib/dialog"

const props = defineProps({
    content: { type: String, required: true },
    timestamp: { type: String, required: true },
    forbidOperate: { type: Boolean, required: true },
})

function onCopy(content: string) {
    navigator.clipboard.writeText(content)
}

const emits = defineEmits(['delete'])
function onDelete(button: HTMLButtonElement) {
    if (!props.forbidOperate) {
        createDeleteConfirmDialog(
            (button.getBoundingClientRect().left - 150) + 'px',
            (button.getBoundingClientRect().top + 20) + 'px',
            () => {
                emits("delete")
            }
        )
    }
}

</script>
