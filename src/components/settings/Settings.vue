<template>
    <div class="flex text-base-content overflow-hidden">
        <div class="w-48 h-full pt-4 bg-base-100 flex flex-col space-y-1 font-bold text-sm">
            <button v-for="(setting, index) in settings" :key="index" @click="scrollToTargetDiv(index)"
                class="pl-3 py-3 text-left inline-flex items-center hover:bg-base-200"
                :class="{'bg-primary text-primary-content hover:bg-primary-focus':isCurrentSetting(index)}">
                <SvgIcon class="h-5 w-5 mr-2" :src="setting['icon']" />{{ t(setting['title'])}}
            </button>
        </div>
        <div class="flex-1 h-full p-4 bg-base-100 border flex flex-col">
            <div ref="mainArea" class="flex-1 overflow-auto space-y-12 pr-2 pb-10">
                <div>
                    <div id="Setting" class="bg-base-200 text-xl font-bold p-1"> {{ t('TitelSetting') }} </div>
                    <div class="px-1 pt-4 text-sm">{{t('ConfigStorage')}} {{configPath}}</div>
                </div>
                <General />
                <Apperance />                
                <ProxyManager />
                <OpenAIAccount />
                <PluginChannel />
                <History/>
            </div>
            <div class="h-1 border-t my-2" />
            <div class="h-6 flex justify-end">
                <button class="btn btn-primary" @click="onClolse">{{ t('Close') }} </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import { ref, onMounted, onBeforeUnmount} from 'vue';
import {useI18n} from 'vue-i18n';
const { t } = useI18n()
import bus from '@/lib/bus'

import {getConfigPath} from '@/lib/backend'
import General from './General.vue'
import Apperance from './Apperance.vue'
import OpenAIAccount from './OpenAIAccount.vue'
import ProxyManager from './ProxyManager.vue'
import PluginChannel from './PluginChannel.vue'
import History from './History.vue'

let current = ref("General")


const settings = [{'title': "TitleGeneral",    'icon': "general",  'pos': "General"},
            {'title': "TitleApperance",        'icon': "photo",    'pos': "Apperance"},
            {'title': "TitleProxyManager",     'icon': "proxy",    'pos': "ProxyManager"},
            {'title': "TitleOpenAIAccount",    'icon': "key",      'pos': "OpenaiAccount"},
            {'title': "TitleFreeAISites",      'icon': "chat",     'pos': "SiteExtensions"},
            {'title': "TitlePromptExtensions", 'icon': "plugin",   'pos': "PromptsExtensions"}, 
            {'title': "TitleHistory",          'icon': "plugin",    'pos': "History"},   
    ]


const configPath = ref("")
const mainArea = ref<any>()

onMounted(async() => {
    configPath.value = await getConfigPath()
    mainArea.value.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
    const div = document.getElementById('mainArea') as HTMLDivElement;
    if(div != null) {
        mainArea.value.removeEventListener('scroll', handleScroll)
    }
})

function handleScroll() {
    for(const item of settings) {       
        const div = document.getElementById(item['pos']) as HTMLDivElement
        const rect = div.getBoundingClientRect()
        //console.log(item['pos'] + ":" + rect.y)
        if(rect.y > 0 && rect.y < 100) {
            current.value = item['pos']
        }
    }
}


function scrollToTargetDiv(index: number){
    const id = settings[index]['pos']
    const div = document.getElementById(id) as HTMLDivElement; div?.scrollIntoView(true);
    current.value = id
}

function isCurrentSetting(index: number){
    return settings[index]['pos'] == current.value
}

function onClolse() {
    bus.$emit('showChat')
}


</script>