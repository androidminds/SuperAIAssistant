<template>
    <div class="space-y-4">
        <div id="SiteExtensions" class="bg-base-200 text-lg font-bold p-1">{{ t('TitleFreeAISites') }}</div>
        <div class="p-1"> {{ t('FreeAIPrompt') }} </div>

        <div class="flex space-x-2 items-center">
            <Button :waitting="loading" class="btn btn-primary" @click="onRefresh(true)">{{ t('Refresh') }}</Button>
            <div><span class="text-sm">{{ t('LastUpdateTime') }}{{ refreshTime }} </span></div>
        </div>

        <div class="space-y-1">
            <div class="pr-4">
                <table class=" border table-spacing-x-4 w-full">
                    <caption class="caption-top font-bold text-sm text-left pb-2">{{ t('FreeSiteList') }}</caption>
                    <thead>
                        <tr class="text-left text-sm">
                            <th class="p-2"></th>
                            <th class="p-2">{{ t('Title') }}</th>
                            <th class="p-2">{{ t('Model') }}</th>
                            <th class="p-2">{{ t('Description') }}</th>
                            <th class="p-2" v-if="existedRemovedFreeSite()">{{ t('Discarded') }}</th>
                            <th class="p-2">{{ t('Proxy') }}</th>
                            <th class="p-2">{{ t('Operator') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for='(item, key) in freeSiteList' :key="key" class="border-t">
                            <td class="p-2"><input class="accent-primary" type="checkbox" v-model="item['enabled']"
                                    @change="onSiteEnabled(key)" v-if="!item.install" /></td>
                            <td class="p-2">{{ getInfoByLanguage(item.name) }}</td>
                            <td class="p-2">{{ item.model }}</td>
                            <td class="p-2">{{ getInfoByLanguage(item.description) }}</td>
                            <td class="p-2 w-16" v-if="existedRemovedFreeSite()"><SvgIcon v-if="item.removed" src="close" class="text-error w-5 h-5"/></td>
                            <td class="p-2">
                                <Select class="bg-base-100 text-sm border" v-model="item.proxy" v-if="!item.install"
                                    @change="onProxyChanged(key)">
                                    <Option :value=null>None</Option>
                                    <Option v-for="(proxy, key) in proxyList" :key="key" :value="proxy.id">
                                        {{ proxy.url }}
                                    </Option>
                                </Select>
                            </td>
                            <td class="p-2 flex space-x-2">
                                <Button class="btn btn-primary" v-if="item.install" @click="onInstallFreeSite(key)"
                                    :waitting="item.waiting" :disabled="item.forbidden">
                                    {{ t('Install') }}{{ }} {{ }}
                                </Button>
                                <Button class="btn btn-primary" v-if="item.updated" @click="onUpdateFreeSite(key)"
                                    :waitting="item.waiting" :disabled="item.forbidden">
                                    {{ t('Update') }}
                                </Button>
                                <Button class="btn btn-primary" v-if="!item.install" 
                                    @click="onUninstallFreeSite($event.target, key)"
                                    :waitting="item.waiting && !item.updated" :disabled="item.forbidden">
                                    {{ t('Uninstall') }}
                                </Button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div id="PromptsExtensions" class="bg-base-200 text-lg font-bold p-1">{{ t('TitlePromptExtensions') }}</div>
        <div class="p-1">{{ t('RolePrompt') }}</div>
        <div class="space-y-2">
            <table class=" border table-spacing-x-4 w-full">
                <thead>
                    <tr class="text-left text-sm">
                        <th class="p-2">{{ t('Title') }}</th>
                        <th class="p-2">{{ t('Description') }}</th>
                        <th class="p-2">{{ t('Operator') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for='(item, key) in promptSetList' :key="key" class="border-t">
                        <td class="p-2">{{ getInfoByLanguage(item.name) }}</td>
                        <td class="p-2">{{ getInfoByLanguage(item.description) }}</td>
                        <td class="p-2">
                            <Button class="btn btn-primary" v-if="item.install" @click="onInstallPromptSet(key)"
                                :waitting="item.waiting" :disabled="item.forbidden">
                                {{ t('Install') }}
                            </Button>
                            <Button class="btn btn-primary" v-if="item.update" @click="onUpdatePromptSet(key)"
                                :waitting="item.waiting" :disabled="item.forbidden">
                                {{ t('Update') }}
                            </Button>
                            <Button class="btn btn-primary" v-if="!item.install" 
                                @click="onUninstallPromptSet($event.target, key)"
                                :waitting="item.waiting" :disabled="item.forbidden">
                                {{ t('Uninstall') }}
                            </Button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useI18n } from 'vue-i18n';
const { t } = useI18n()
import { v4 as uuidv4 } from 'uuid';

import {
    getCacheContent, saveCacheContent, getGlobalProxy,
    getUrlContent, getConfigure, saveConfigure, installPrompts,
    getPromptSetList, addPromptSet, deletePromptSet, getProxyList, getFreeSiteList,
    addFreeSite, deleteFreeSite, updateFreeSite, fetchFreeSiteFile
} from '@/lib/backend'
import {createUninstallConfirmDialog} from "@/lib/dialog"
import bus from '@/lib/bus'
import { popupToast } from "halcyonui";
import moment from 'moment';

const CACHE_HOURS = 24 * 3

let freeSiteList = ref<Record<string, any>>({})
let promptSetList = ref<Record<string, any>>({})

let proxyList = ref<Record<string, any>>({})
let loading = ref(false)

let refreshTime = ref("N/A")

let language:string

onMounted(async () => {
    onUpdated()
    await onRefresh(false)
    bus.$on("ProxyChanged", onUpdated)
})

onUnmounted(async () => {
    bus.$off("ProxyChanged", onUpdated)
})

async function onUpdated() {
    proxyList.value = await getProxyList()
    language = await getConfigure("Common.language", navigator.language)
}


function installedPlugin(uid: string, pluginList: Record<string, any>[]) {

    if (pluginList == null)
        return false

    for (const plugin of pluginList) {
        if (plugin.uid == uid)
            return true
    }

    return false
}


function getRemoteVerion(uid: string, remote_config: Record<string, any>[]) {

    for (const config of remote_config) {
        if (config.uid == uid)
            return config.version
    }

    return null
}

const MANUAL_PROMPTS_UID = "00000000"
const DEFAULT_PROMPTS_UID = "11111111"

async function onRefresh(reload: boolean) {

    let installedFreeSites = await getFreeSiteList()

    let installedPromptSets = []

    const sets = await getPromptSetList()

    for (const set of sets) {
        if (set.uid == MANUAL_PROMPTS_UID || set.uid == DEFAULT_PROMPTS_UID)
            continue
        installedPromptSets.push(set)
    }

    let plugin_home_url = await getConfigure("Common.pluginIndexUrl1")

    let remoteList = await getRemotePluginList(plugin_home_url, reload) as Record<string, any>[]

    if (remoteList == null) {
        if (reload) popupToast(t("LoadPluginIndexfail"), "error")
        return
    }

    // first, we find all uninstalled plugins
    freeSiteList.value = {}

    for (const plugin of remoteList) {

        if (plugin.status != "active")
            continue

        if (plugin.type == 'chat' && !installedPlugin(plugin.uid, installedFreeSites)) {
            const id = plugin.uid
            freeSiteList.value[id] = {
                ...plugin,
                'file': null,
                'proxy': null,
                'enabled': true,
                'install': true,
                'updated': false,
                'waiting': false,
                'forbidden': false,
            }
        } else if (plugin.type == 'prompt' && !installedPlugin(plugin.uid, installedPromptSets)) {

            const id = plugin.uid

            promptSetList.value[id] = {
                ...plugin,
                'file': null,
                'enabled': true,
                'install': true,
                'updated': false,
                'removed': false,
                'waiting': false,
                'forbidden': false,
            }
        }
    }


    for (const site of installedFreeSites) {
        // then add installed plugin in list
        freeSiteList.value[site.uid] = {
            ...site,
            'install': false,
            'updated': false,
            'removed': false,
            'waiting': false,
            'forbidden': false,
        }
             
        // mark the plugins have been removed from the remote list of plugins
        if(siteRemoved(site.uid, remoteList)) {
            freeSiteList.value[site.uid].removed = true
        } 

        // compare version, marks it as updated
        const remote_version = await getRemoteVerion(site.uid, remoteList)
        if (!freeSiteList.value[site.uid].removed && remote_version != null 
            && campareVersion(remote_version, freeSiteList.value[site.uid].version) > 0) {
            freeSiteList.value[site.uid].updated = true
        }
    }

    for (const set of installedPromptSets) {

        promptSetList.value[set.uid] = set

        const remote_version = await getRemoteVerion(set.uid, remoteList)

        if (remote_version != null && remote_version != promptSetList.value[set.uid].version) {
            promptSetList.value[set.uid].updated = true
        }
    }
}

function existedRemovedFreeSite() {
    for (const key in freeSiteList.value) {
        if(freeSiteList.value[key].removed == true)
            return true
    }

    return false
}

function siteRemoved(uid:number, remoteList:any[]) {
    for(const site of remoteList) {
        if(site.uid == uid)
            return !(site.status == "active")
    }

    return true
}

function campareVersion(version1:string, version2:string) {
    if(version1 == version2)
        return 0

    return Number(version1) - Number(version2)   
}


function getFileNameFromURL(url: string): string {
    const pathname = new URL(url).pathname;

    const lastIndexOfSlash = pathname.lastIndexOf('/');

    if (lastIndexOfSlash !== -1) {
        return pathname.substring(lastIndexOfSlash + 1);
    }

    return "temp.py";
}


function setFreeSiteWaiting(key: string) {

    for (const key in freeSiteList.value) {
        freeSiteList.value[key].waiting = false
        freeSiteList.value[key].forbidden = true
    }

    freeSiteList.value[key].forbidden = false
    freeSiteList.value[key].waiting = true
}

function clearFreeSiteWaiting() {

    for (const key in freeSiteList.value) {
        freeSiteList.value[key].waiting = false
        freeSiteList.value[key].forbidden = false
    }
}

async function onInstallFreeSite(key: string) {

    setFreeSiteWaiting(key)

    try {
        const plugin_url = freeSiteList.value[key].url
        const fileName = getFileNameFromURL(plugin_url)
        const proxy = await getGlobalProxy()

        if (await fetchFreeSiteFile(plugin_url, fileName, proxy)) {
            freeSiteList.value[key].file = fileName
            const id = await addFreeSite(freeSiteList.value[key])
            if (id) {
                freeSiteList.value[key].id = id
                freeSiteList.value[key].file = fileName
                freeSiteList.value[key].proxy = null
                freeSiteList.value[key].install = false
                bus.$emit("channelChanged")
            }
        } else {
            popupToast(t("FetchFreeSiteFileFail"), "error")
        }

    } finally {
        clearFreeSiteWaiting()
    }
}

async function onUpdateFreeSite(key: string) {
    setFreeSiteWaiting(key)

    try {
        if (await deleteFreeSite(freeSiteList.value[key].id)) {
            onInstallFreeSite(key)
            onRefresh(false)
        }

    } finally {
        clearFreeSiteWaiting()
    }
}

async function onUninstallFreeSite(button:any, key: string) {
    createUninstallConfirmDialog (
        button.getBoundingClientRect().left - 70 + 'px',
        (button.getBoundingClientRect().top + 40) + 'px',
        async ()=>{

        setFreeSiteWaiting(key)
        try {

            if (await deleteFreeSite(freeSiteList.value[key].id)) {
                if(freeSiteList.value[key].removed) {
                    delete freeSiteList.value[key]
                } else {
                    freeSiteList.value[key].id = null
                    freeSiteList.value[key].file = ""
                    freeSiteList.value[key].proxy = null
                    freeSiteList.value[key].enabled = true
                    freeSiteList.value[key].install = true
                    freeSiteList.value[key].updated = false
                    bus.$emit("channelChanged")
                }
            }

        } finally {
            clearFreeSiteWaiting()
        }
    })
}

function setPromptButtonWaiting(key: string) {

    for (const key in promptSetList.value) {
        promptSetList.value[key].waiting = false
        promptSetList.value[key].forbidden = true
    }

    promptSetList.value[key].forbidden = false
    promptSetList.value[key].waiting = true
}

function clearPromptButtonWaiting() {
    for (const key in promptSetList.value) {
        promptSetList.value[key].waiting = false
        promptSetList.value[key].forbidden = false
    }
}


async function onInstallPromptSet(key: string) {

    setPromptButtonWaiting(key)

    try {

        const id = await addPromptSet(promptSetList.value[key])

        if (id) {
            const proxy = await getGlobalProxy()
            if (await installPrompts(id, promptSetList.value[key].url, proxy)) {
                popupToast(t("InstallPromptSetSuccess"))
                promptSetList.value[key].id = id
                promptSetList.value[key].install = false
                bus.$emit("roleChanged")
            } else {
                await deletePromptSet(id)
                popupToast(t("InstallPromptSetFail"), "error")
            }
        } else {
            popupToast(t("InstallPromptSetFail"), "error")
        }

    } finally {
        clearPromptButtonWaiting()
    }
}

async function onUpdatePromptSet(key: string) {
    setFreeSiteWaiting(key)

    try {
        if (await deletePromptSet(freeSiteList.value[key].id)) {

            onInstallPromptSet(key)
            onRefresh(false)
        }

    } finally {
        clearFreeSiteWaiting()
    }
}

async function onUninstallPromptSet(button:any, key: string) {
    createUninstallConfirmDialog (
        button.getBoundingClientRect().left - 70 + 'px',
        (button.getBoundingClientRect().top + 40) + 'px',
        async ()=>{

        setPromptButtonWaiting(key)

        try {

            if (await deletePromptSet(promptSetList.value[key].id)) {
                popupToast(t("UninstallPromptSetSuccess"))
                promptSetList.value[key].id = 0
                promptSetList.value[key].file = ""
                promptSetList.value[key].enabled = true
                promptSetList.value[key].install = true
                promptSetList.value[key].updated = false
                bus.$emit("roleChanged")
            } else {
                popupToast(t("UninstallPromptSetFail"), "error")
            }

        } finally {
            clearPromptButtonWaiting()
        }
    })
}

async function onSiteEnabled(key: string) {

    if (await updateFreeSite(freeSiteList.value[key].id, { enabled: freeSiteList.value[key].enabled }))
        bus.$emit("channelChanged")

}

async function onProxyChanged(key: string) {

    if (await updateFreeSite(freeSiteList.value[key].id, { proxy: freeSiteList.value[key].proxy }))
        bus.$emit("channelChanged")

}

function convertStringToDate(str: string) {

    const date = new Date(str);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function calculateTimeSpan(startDate: Date, endDate: Date) {

    const start = moment(startDate);
    const end = moment(endDate);
    const duration = moment.duration(end.diff(start));

    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes()) % 60;
    const seconds = Math.floor(duration.asSeconds()) % 60;

    return [hours, minutes, seconds]

}


async function getCache(remoteUrl: string, caches: Record<string, any>) {

    for (const key in caches) {
        if (remoteUrl == caches[key].url) {
            const lasttime = convertStringToDate(caches[key].time)
            if (lasttime == null)
                return [null, null]

            const [hours, ,] = calculateTimeSpan(lasttime, new Date())
            if (hours < 0 || hours > CACHE_HOURS)
                return [null, null]

            return [await getCacheContent(key), caches[key].time]
        }
    }

    return [null, null]
}

async function saveCache(remoteUrl: string, content: string, caches: Record<string, any>) {
    const time = new Date().toLocaleString()

    // if cache exists, update it
    for (const key in caches) {
        if (remoteUrl == caches[key].url) {
            caches[key].time = time;
            await saveConfigure("Cache." + key, caches[key])
            await saveCacheContent(key, content)
            return time
        }
    }

    // otherwise, add a new cache
    const key = uuidv4().slice(0, 8)

    await saveConfigure("Cache." + key, {
        "time": time,
        "url": remoteUrl
    })

    await saveCacheContent(key, content)

    return time
}


async function getRemotePluginList(plugin_home_url: string, focusFetch: boolean) {
    try {

        loading.value = true

        let time

        let cacheList = await getConfigure("Cache")

        // get the plugin list on the current language
        let plugin_url = plugin_home_url + "index.json"

        let content: string | null = null
        if (!focusFetch) {
            [content, time] = await getCache(plugin_url, cacheList)
        }

        if (content == null) {
            let proxy = await getGlobalProxy()
            content = await getUrlContent(plugin_url, proxy)
            if (content != null) {
                time = await saveCache(plugin_url, content, cacheList)
            }
        }

        if (content != null) {
            refreshTime.value = time
            return JSON.parse(content)["extensions"]
        } else {
            return null
        }

    } finally {
        loading.value = false
    }

    return null
}

function getInfoByLanguage(info: any) {
    if (info == null)
        return ""

    if (typeof (info) != "object")
        return info

    if (language in info)
        return info[language]
    else if ("en" in info)
        return info.en
    else
        return info
}

</script>