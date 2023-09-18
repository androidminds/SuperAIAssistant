<template>
    <div class="flex">
        <button class="whitespace-nowrap text-xs text-ellipsis overflow-hidden flex-1 border-gray-700 border-r rounded-l pl-4 pr-2"
            @click="onClick"><div class="">{{label}}</div><div >{{items[selectedIndex]}}</div>
        </button>
        <div class="w-10">
            <button class="w-full h-full rounded-r flex justify-center items-center" @click="onOpenDropdown">
                <SvgIcon src="ChevronDown" class="text-inherit w-4 h-4"/>
            </button>
            <ul v-if="isDropdownOpen" class="absolute bg-base-100 text-base-content z-10 min-w-max mt-1 pr-4 rounded-md shadow-lg">
                <li v-for="(item, index) in items" :key="index" @click="onSelect(index)"
                    class="px-3 py-2 cursor-pointer hover:bg-base-200 flex items-center">
                        <div v-if="index===selectedIndex"><SvgIcon src="check" class="text-inherit w-4 h-4 mr-2"/></div>
                        <div class="text-inherit w-4 h-4 mr-2" v-else></div>
                        <div class = "flex-1">{{ item }} </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">

import {ref, watchEffect} from "vue";

const props = defineProps({
  label: { type: String, required: true },
  items: { type: Object, required: true},
  selected: { type: String, required:true}
})

let isDropdownOpen = ref(false)
let selectedIndex = ref<string>("")
const emits = defineEmits(['update:selected', 'click', 'changeSelected'])

function onSelect(index:string) {
    isDropdownOpen.value = false;
    selectedIndex.value = index;
    emits('update:selected', index)
    emits('changeSelected', index)
}

function onClick() {
    emits("click", props.selected)
}

let first = true
function onOpenDropdown() {
    first = true
    isDropdownOpen.value = true
    document.addEventListener('click', closeDropdown)
}

function closeDropdown() {
    if(first) {
        first = false;
    } else {
        isDropdownOpen.value = false
        document.removeEventListener('click', closeDropdown)
        first = true
    }
}

watchEffect(() =>{
    selectedIndex.value = props.selected
})

</script>

<style scoped>

</style>
