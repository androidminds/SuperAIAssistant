<template>
    <div class="space-y-4">
        <div id="General" class="bg-base-200 text-lg font-bold p-1">{{ t('TitleGeneral') }}</div>
        <div class="space-y-2">
            <div class="font-bold text-sm">{{ t('Language') }}</div>
            <Select class="w-48 h-8 bg-base-100 border pl-1" v-model="selected" @change="onChangeLanguage()">
                <Option v-for="(language, index) in languageList" :key="index" :value="language['value']">
                    {{ language['name'] }}
                </Option>
            </Select>
        </div>
        <div class="space-y-2 flex flex-col">
            <div class="font-bold text-sm">{{ t('Update') }}</div>
            <div class="flex">
                <input class="accent-primary mr-2" type="checkbox" v-model="autoCheck" @change="onChangeCheck" />
                <div>{{ t('AutoCheck') }}</div>
            </div>
            <div class="flex">
                <input class="accent-primary mr-2" type="checkbox" v-model="autoUpdate" @change="onChangeUpdate" />
                <div>{{ t('AutoUpdate') }}</div>
            </div>
        </div>
        <div class="space-y-2">
            <div class="font-bold text-sm">{{ t('DialogMode') }}</div>
            <div class="flex">
                <input class="accent-primary mr-2" type="checkbox" v-model="stream" @change="onChangeStream" />
                <div>{{ t('StreamMode') }}</div>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { onBeforeMount, ref } from "vue";

import { getConfigure, saveConfigure } from '@/lib/backend'
import { useI18n } from 'vue-i18n';
const { locale, t } = useI18n();

let selected = ref(navigator.language)

let languageList: Record<string, string>[] = [
    { 'name': "English", 'value': "en" },
    { 'name': "中文简体", 'value': "zh-CN" },
    { 'name': "中文繁體", 'value': "zh-TW" },
    { 'name': "日本語", 'value': "ja" },
    { 'name': "Deutsch", 'value': "de" },
    { 'name': "Français", 'value': "fr" },
    { 'name': "Русский язык", 'value': "ru" },
    { 'name': "한국어", 'value': "ko" },
    { 'name': "بالعربية", 'value': "ar" },
]

let autoUpdate = ref(false)
let autoCheck = ref(true)
let stream = ref(true)

onBeforeMount(async () => {
    selected.value = await getConfigure("Common.language", navigator.language)
    autoUpdate.value = await getConfigure("Update.autoUpdate", false)
    autoCheck.value = await getConfigure("Update.autoCheck", true)
    stream.value = await getConfigure("Common.stream", true)
})

async function onChangeLanguage() {
    locale.value = selected.value
    await saveConfigure("Common.language", selected.value)
}

async function onChangeUpdate() {
    await saveConfigure("Update.autoUpdate", autoUpdate.value)
}

async function onChangeCheck() {
    await saveConfigure("Update.autoCheck", autoCheck.value)
}

async function onChangeStream() {
    await saveConfigure("Common.stream", stream.value)
}

</script>