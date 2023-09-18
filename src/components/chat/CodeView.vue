<template>
    <div class="bg-base-100">
        <link rel="stylesheet" :href="themeList[theme]">
        <div class="flex items-center space-x-4 px-2 py-1">
            <span class="flex-1 italic text-sm text-base-600 px-2">{{ props.type }}</span>
            <button class="w-18 text-base-600 hover:text-red-400 text-sm px-2 py-0.5 " @click="onCopy">{{ t('Copy') }}</button>
        </div>
        <pre><div class="px-4 pb-2 whitespace-pre-wrap break-all text-monospace text-lg " ref="container"/></pre>
    </div>
</template>
  
<script setup lang="ts">
import Prism from 'prismjs';
import {useI18n} from 'vue-i18n';
const { t } = useI18n()

import bus from '@/lib/bus'

import {onMounted, ref, onUpdated } from 'vue';

const props = defineProps({
  code: { type: String, required: true },
  lang: { type: String, default: 'html' },
  type: { type: String, required: false}
})

const container = ref<any>()

const themeList : Record<string, string> = {  
  'business': "/src/css/prism-business.css",
  'leisure': "/src/css/prism-leisure.css",
  'dark': "/src/css/prism-dark.css",

}

let theme = ref("business")

function getCurrentTheme(){
    const root = document.documentElement;
    const attr = root.getAttribute('data-theme');
    if(attr != null && themeList.hasOwnProperty(attr))
        return attr
    else
        return "business"
}

function highlight() {
    try {
        container.value.innerHTML = Prism.highlight(props.code, Prism.languages[props.lang], props.lang);
    } catch {
        console.log("highlight error with " + props.lang)
        container.value.innerHTML = Prism.highlight(props.code, Prism.languages['html'], 'html');
    }
}

onMounted(() => {
    theme.value = getCurrentTheme()
    highlight()

    bus.$on("themeChanged", ()=>{
        theme.value = getCurrentTheme()
    })
})

onUpdated(()=> {
    highlight()
})

function onCopy() {
    navigator.clipboard.writeText(props.code)
}

</script>
