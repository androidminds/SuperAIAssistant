let g_url = ""

async function httpGeOrtDelete(url: string, method: string, data: Record<string, string> | null) {
    return new Promise((resolve, reject) => {
        if (data != null) {
            // for some unknown reason, null value can be passed, so we need to remove them from parameters
            for(let key in data) {
                if(typeof data[key] !== "string") {
                    delete data[key]
                }
            }
            const queryParams = new URLSearchParams(data).toString();
            url += `?${queryParams}`
        }

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(async (response) => {
                if (!response.ok) {
                    console.log(await response.text())
                    resolve(null);
                } else {
                    return response.text();
                }
            })
            .then((data) => {
                if (data != null && data.length > 0) {
                    resolve(data);
                } else {
                    resolve(true);
                }
            })
            .catch((error) => {
                console.error(method + ' failed:', error);
                reject(error);
            });
    });
}

async function httpPostOrPut(url: string, method: string, body: string) {
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: body
        })
            .then(async (response) => {
                if (!response.ok) {
                    console.log(await response.text())
                    resolve(null);
                } else {
                    return response.text();
                }
            })
            .then((data) => {
                if (data != null && data.length > 0) {
                    resolve(data);
                } else {
                    resolve(true);
                }
            })
            .catch((error) => {
                console.error(method + ' failed:', error);
                reject(error);
            });
    });
}


export function setBackendUrl(url: string) {
    g_url = url
}

async function httpGet(url: string, data: Record<string, string> | null = null) {
    try {
        return await httpGeOrtDelete(g_url + url, "GET", data)
    } catch (error) {
        return null;
    }
}

async function httpDelete(url: string, data: Record<string, string> | null = null) {
    try {
        return await httpGeOrtDelete(g_url + url, "DELETE", data)
    } catch (error) {
        return null;
    }
}

async function httpPost(url: string, body: string) {
    try {
        return await httpPostOrPut(g_url + url, "POST", body)
    } catch (error) {
        return null;
    }
}

async function httpPut(url: string, body: string) {
    try {
        return await httpPostOrPut(g_url + url, "PUT", body)
    } catch (error) {
        return null;
    }
}

//----------------------------------------------------------------

export async function getConfigure(section: string, defaultValue: any = null) {
    const response = await httpGet("/api/config", { section: section }) as string|boolean;
    if (response != null)
        if(typeof(response) == "boolean")
            return defaultValue;
        else
            return JSON.parse(response)
    else
        return defaultValue;
}

export async function saveConfigure(section: string, content: any) {
    return await httpPut("/api/config", JSON.stringify({
        section: section,
        config: content
    }));
}

export async function deleteConfigure(section: string) {
    return await httpDelete("/api/config", { section: section });
}


//----------------------------------------------------------------

async function getTableRows(table:string, condition:any|null = null) {
    const result = await httpGet("/api/dbtable", (condition ? {table, condition:JSON.stringify(condition)} : {table})) as string
    return result ? JSON.parse(result) : []
}

export async function addTableRow(table:string, data:any) {
    const result = await httpPost("/api/dbtable", JSON.stringify({table, data}))  as string
    return result? JSON.parse(result)['id'] : null;
}

export async function updateTableRow(table:string, data:any, condition:any) {
    const result = await httpPut("/api/dbtable", JSON.stringify({table, data, condition}))
    return (result == null) ? false : result;
}

export async function deleteTableRows(table:string, condition:any) {
    const result = await httpDelete("/api/dbtable", ({table, condition:JSON.stringify(condition)}))
    return (result == null) ? false : result;
}

//----------------------------------------------------------------
const PROXY_TABLE = "PROXY-TABLE"

export async function getProxyList(id:number|undefined = undefined) {
    return await getTableRows(PROXY_TABLE, {id})
}

export async function addProxy(url:string) {
    return await addTableRow(PROXY_TABLE, {url})
}

export async function deleteProxy(id:number) {
   return await deleteTableRows(PROXY_TABLE, {id})
}

//----------------------------------------------------------------

const OPENAI_KEY_TABLE = "OPENAI-KEY-TABLE"

export async function getOpenaiKeyList(id:number|undefined = undefined) {
    const rows = await getTableRows(OPENAI_KEY_TABLE, {id})
    for( const row of rows) {
        row.models = JSON.parse(row.models)
    }
    return rows
}

export async function addOpenaiKey(key:string, models:string[], proxy:number|null) {
    return addTableRow(OPENAI_KEY_TABLE, {key, models:JSON.stringify(models), proxy})
}

export async function updateOpenaiKey(id:number, proxy:number|null) {
    return await updateTableRow(OPENAI_KEY_TABLE, {proxy}, {id})
}

export async function deleteOpenaiKey(id:number) {
   return deleteTableRows(OPENAI_KEY_TABLE, {id})
}

//----------------------------------------------------------------

const CHAT_LIST_TABLE = "CHAT-LIST-TABLE"

export async function getChatList() {
    return await getTableRows(CHAT_LIST_TABLE, {deleted:false})
}

export async function getChatInfo(id:number) {
    const result = await getTableRows(CHAT_LIST_TABLE, {id, deleted:false})

    if(result && result.length > 0)
        return result[0]
    else
        return null
}

export async function addChatList(data:any) {
    return await addTableRow(CHAT_LIST_TABLE, data)
}

export async function updateChatList(id:number, data:any) {
    return await updateTableRow(CHAT_LIST_TABLE, data, {id, deleted:false})
}

export async function deleteChatList(id:number) {
    return await updateTableRow(CHAT_LIST_TABLE, {deleted:true}, {id})
}

//----------------------------------------------------------------

const CHAT_TABLE = "CHAT-TABLE"

export async function getChats(chat_id:number) {
    return await getTableRows(CHAT_TABLE, {chat_id})
}

export async function addChat(data:any) {
    return await addTableRow(CHAT_TABLE, data)
}

export async function updateChat(id:number, data:any) {
    return await updateTableRow(CHAT_TABLE, data, {id})
}

//----------------------------------------------------------------

const FREE_SITE_TABLE = "FREE-SITE-TABLE"

export async function getFreeSiteList(id:number|undefined = undefined) {
    const rows = await getTableRows(FREE_SITE_TABLE, {id})
    for( const row of rows) {
        row.name = JSON.parse(row.name)
        row.description = JSON.parse(row.description)
        row.enabled = (row.enabled == 1)
    }
    return rows
}

export async function addFreeSite(data:any) {
    let new_data = JSON.parse(JSON.stringify(data));
    if('name' in data) new_data['name'] = JSON.stringify(data['name'])
    if('description' in data) new_data['description'] = JSON.stringify(data['description'])
    return addTableRow(FREE_SITE_TABLE, new_data)
}

export async function updateFreeSite(id:number, data:any) {
    return await updateTableRow(FREE_SITE_TABLE, data, {id})
}

export async function deleteFreeSite(id:number) {
    return await deleteTableRows(FREE_SITE_TABLE, {id})
}

export async function fetchFreeSiteFile(url: string, file: string, proxy:string) {
    const result = await httpPut('/api/plugin/site', JSON.stringify({file, url, proxy}))
    return result == null ? false : result
}


//----------------------------------------------------------------

const PROMPT_SET_TABLE = "PROMPT-SET-TABLE"

export async function getPromptSetList(id:number|undefined = undefined) {
    const rows = await getTableRows(PROMPT_SET_TABLE, {id})
    for( const row of rows) {
        row.name = JSON.parse(row.name)
        row.description = JSON.parse(row.description)
    }
    return rows
}

export async function addPromptSet(data:any) {
    let new_data = JSON.parse(JSON.stringify(data));
    if('name' in data) new_data['name'] = JSON.stringify(data['name'])
    if('description' in data) new_data['description'] = JSON.stringify(data['description'])
    return addTableRow(PROMPT_SET_TABLE, new_data)
}


export async function deletePromptSet(id:number) {
    return await deleteTableRows(PROMPT_SET_TABLE, {id})
}

//----------------------------------------------------------------

const PROMPT_TABLE = "PROMPT-TABLE"

export async function getPromptList(set_id:number|undefined = undefined) {
    return await getTableRows(PROMPT_TABLE, {set_id})
}

export async function addPrompt(title:string, prompt:string, language:string, set_id:number) {
    return await addTableRow(PROMPT_TABLE, {title, prompt, language, set_id})
}

export async function deletePrompt(id:number) {
   return await deleteTableRows(PROMPT_TABLE, {id})
}

export async function installPrompts(set_id:number, url:string, proxy:string) {
    const result = await httpPost('/api/plugin/prompts', JSON.stringify({set_id, url, proxy}))
    return result == null ? false : result
}

//----------------------------------------------------------------
export async function getConfigPath() {
    return await httpGet("/api/config/storage") as string
}

export async function getUrlContent(url:string, proxy:string) {
    return await httpGet("/api/geturl", {url, proxy}) as string
}

export async function getCacheContent(file:string) {
    return await httpGet("/api/cache", { file}) as string
}

export async function saveCacheContent(file:string, content:string) {
    return await httpPut("/api/cache", JSON.stringify({ file, content}))
}

export async function getGlobalProxy() {
    const proxyId = await getConfigure("Common.globalProxy", null)
    if(proxyId == null)
        return null

    const proxyList = await getProxyList(proxyId)
    if(proxyList && proxyList.length > 0)
        return proxyList[0].url
    else
        return null
}

//----------------------------------------------------------------

export async function importPrompts(file:string) {
    const result = await httpPost("/api/import/prompts", JSON.stringify({ file}))
    return result? true : false
}

export async function exportPrompts(file:string) {
    const result = await httpPost("/api/export/prompts", JSON.stringify({ file}))
    return result? true : false
}

export async function exportDialogs(file:string) {
    const result = await httpPost("/api/export/dialogs", JSON.stringify({ file}))
    return result? true : false
}

