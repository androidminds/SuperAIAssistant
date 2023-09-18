<template>
    <Dialog :ok="onClose" :visible="visible">
        <div class="overflow-hidden" :style="{height:'500px', width:'800px'}">
            <div class="bg-base-100 w-full h-full pb-4 pr-2 overflow-y-scroll flex flex-col">
                <div class="bg-base-200 text-2xl font-bold p-2">{{t("PromptSelector")}}</div>

                <div class="bg-base-200 text-1xl font-bold p-2 mt-6">{{t("CustomPromptSet")}}</div>
                <div class="flex items-center">
                    <textarea spellcheck="false" class="input input-primary w-64 h-8 pr-4 mr-4 bg-base-100 overflow-hidden"
                        v-model="inputTitle" type="text" />

                    <textarea spellcheck="false" class="flex-1 input input-primary h-8 pr-4 mr-4 bg-base-100 overflow-hidden"
                        v-model="inputPrompt" type="text" />
                    <button class="btn btn-primary" @click="onAddPrompt()">{{t("Add")}}</button>
                </div>
                <div class="bg-base-200 text-1xl font-bold p-2 mt-6">{{ getPromptSetTitle(manualSet.titles) }}</div>
                <div>
                    <table class="table table-compact w-full">
                        <tbody>
                            <tr class="space-x-2 flex items-center" v-for='(item, id) in manualSet.prompts' :key="id">
                                <td class="w-32">{{ item.title }}</td>
                                <td class="flex-1 py-2">{{ item.prompt }}</td>
                                <td class="w-64 space-x-2 flex justify-end">
                                    <button class="btn btn-primary" @click="onDeletePrompt(item.id)">{{t("Delete")}}</button>
                                    <button class="btn btn-primary" @click="onInsertPrompt(item.prompt)">{{t("Insert")}}</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <template v-for="(set, index) in promptSets" :key="index">
                    <div class="bg-base-200 text-1xl font-bold p-2 mt-6 flex">
                        <div class="flex-1">{{ getPromptSetTitle(set.titles) }}</div>
                        <Select v-model="set.language">
                            <Option v-for="(language, key) in set.languages" :value="language">
                                {{ getCurrentLanguageTitle(language) }}</option>
                        </select>
                    </div>
                    <table class="table table-compact w-full">
                        <tbody>
                            <tr class="space-x-2 flex items-center" v-for='(item, id) in getPromptsByLanuage(set.prompts, set.language)'
                                :key="id">
                                <td class="w-32 ">{{ item.title }}</td>
                                <td class= "flex-1 py-2">{{ item.prompt }}</td>
                                <td class="w-24 flex justify-end"><button class="btn btn-primary" @click="onInsertPrompt(item.prompt)">{{t("Insert")}}</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
import { getPromptSetList, getPromptList, addPrompt, deletePrompt, getConfigure } from '@/lib/backend'
import {useI18n} from 'vue-i18n';
const { t } = useI18n()

import bus from '@/lib/bus';
const MANUAL_PROMPTS_UID = "00000000"

defineProps({
    visible: { type: Boolean, required: true }
})


interface PromptCollection {
    titles: {};
    prompts: any[];
    languages: []
    language: string;
}

let manualSet = ref<PromptCollection>({ titles: {}, prompts: [], languages: [], language: "" })
let promptSets = ref<PromptCollection[]>([])
let language:string

onBeforeMount(async () => {
    await updatePrompts()
})

async function updatePrompts() {
    const sets = await getPromptSetList()
    manualSet.value = { titles: {}, prompts: [], languages: [], language: "" }
    promptSets.value = []

    language = await getConfigure("Common.language", navigator.language)

    for (let set of sets) {
        const prompts = await getPromptList(set.id)
        const [language, languages] = getSetLanguages(prompts)

        if (MANUAL_PROMPTS_UID == set.uid) {
            manualSet.value.titles = set.name
            manualSet.value.prompts = prompts,
                manualSet.value.languages = languages
            manualSet.value.language = language
        } else {
            promptSets.value.push({ titles: set.name, prompts, languages, language })
        }
    }
}

function getPromptSetTitle(titles: any) {
    if (titles == null || titles == undefined)
        return ""

    if (language in titles)
        return titles[language]
    else if ("en" in titles)
        return titles.en
    else
        return ""
}

function getSetLanguages(prompts: any) {
    let languages = []
    for (let prompt of prompts) {
        let inserted = false
        for (let language of languages) {
            if (language == prompt.language) {
                inserted = true
                break;
            }
        }
        if (!inserted) {
            languages.push(prompt.language);
        }
    }

    if (languages.length == 0)
        return ["", []]

    let current = navigator.language
    for (let language of languages)
        if (current == language)
            return [current, languages]

    return [languages[0], languages]
}


function getPromptsByLanuage(prompts: any, language: string) {
    let promptList = []

    for (const prompt of prompts) {
        if (prompt.language == language)
            promptList.push(prompt)
    }
    return promptList
}


const emits = defineEmits(['update:visible'])
function onClose() {
    emits("update:visible", false);
}

function onInsertPrompt(prompt: string) {
    bus.$emit('insertPrompt', prompt)
    onClose()
}


function getCurrentLanguageTitle(language: string) {
    const titles: Record<string, Record<string, string>> = {
        'zh-CN': {
            "en": "英语",
            "zh-CN": "简体中文",
            "zh-TW": "繁体中文",
            "ja": "日语",
            "ko": "韩语",
            "fr": "法语",
            "de": "德语",
            "es": "西班牙语",
            "ru": "俄语",
            "ar": "阿拉伯语",
            "pt": "葡萄牙语",
            "it": "意大利语",
            "nl": "荷兰语",
            "sv": "瑞典语",
            "fi": "芬兰语",
            "da": "丹麦语",
            "no": "挪威语",
        },
        'en': {
            "en": "English",
            "zh-CN": "Chinese Simplified",
            "zh-TW": "Chinese Traditional",
            "ja": "Japanese",
            "ko": "Korean",
            "fr": "French",
            "de": "German",
            "es": "Spanish",
            "ru": "Russian",
            "ar": "Arabic",
            "pt": "Portuguese",
            "it": "Italian",
            "nl": "Dutch",
            "sv": "Swedish",
            "fi": "Finnish",
            "da": "Danish",
            "no": "Norwegian",
        }
    }
    let sysLanguage = "en";
    if (titles[language] != null)
        sysLanguage = language

    if (titles[sysLanguage][language] != null)
        return titles[sysLanguage][language];
    else
        return language;
}

//////////


let inputPrompt = ref("");
let inputTitle = ref("");


async function onAddPrompt() {
    if (inputTitle.value.length == 0 || inputPrompt.value.length == 0)
        return

    const title = inputTitle.value
    const prompt = inputPrompt.value
    const id = await addPrompt(title, prompt, 'en', 2)
    if (id) {
        manualSet.value.prompts.push({ title, prompt, id })
        inputTitle.value = ""
        inputPrompt.value = ""
    }
}

async function onDeletePrompt(id: number) {
    if (await deletePrompt(id)) {
        for (let i = 0; i < manualSet.value.prompts.length; i++) {
            if (manualSet.value.prompts[i].id == id)
                manualSet.value.prompts.splice(i, 1)
        }
    }
}


</script>