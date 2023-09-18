<template>
    <div class="space-y-4">
        <div id="Apperance" class="bg-base-200 text-lg font-bold p-1">{{ t('TitleApperance') }} </div>
        <div class="space-y-2">
            <div class="font-bold text-sm">{{ t('Theme') }}</div>
            <Select class="w-32 h-8 bg-base-100 border pl-1" v-model="currentTheme" @change="onChangeTheme()">
                <Option class="" v-for="(theme, index) in themeList" :key="index" :value="theme['value']">
                    {{ t(theme['name']) }}
                </Option>
            </Select>
        </div>

    </div>
</template>


<script setup lang="ts">
import { onBeforeMount, ref} from "vue";
import {useI18n} from 'vue-i18n';
const { t } = useI18n()

import {getConfigure, saveConfigure} from '@/lib/backend'
import bus from '@/lib/bus'

let themeList: Record<string, string>[] = [
    { 'name': "ThemeBusiness", 'value': "business" },
    { 'name': "ThemeLeisure", 'value': "leisure" },
    { 'name': "ThemeDark", 'value': "dark" },
]

let currentTheme = ref("")

onBeforeMount(async () => {
    currentTheme.value = await getConfigure("Common.theme", "dark")
})

async function onChangeTheme() {
    await saveConfigure("Common.theme", currentTheme.value)
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme.value);
    bus.$emit("themeChanged")
}

</script>