
import { app } from "electron";
import fs from "fs"
import path from 'node:path'
import { getConfigure, saveConfigure, getUrlContent, downloadFile } from "./server";

import {spawn} from "child_process";

let updateState = "idle";

function parseVersion(version: string): number[] {
    const regex = /^v(\d+)\.(\d+)\.(\d+)$/;

    const matches = version.match(regex);
    if (matches === null) {
        throw new Error("Invalid version: " + version);
    }

    const major = parseInt(matches[1], 10);
    const minor = parseInt(matches[2], 10);
    const patch = parseInt(matches[3], 10);

    return [major, minor, patch];
}

function compareVersion(version1: string, version2: string) {
    const [major1, minor1, patch1] = parseVersion(version1)
    const [major2, minor2, patch2] = parseVersion(version2)

    if (major1 === major2)
        if (minor1 === minor2)
            return patch1 - patch2;
        else
            return minor1 - minor2
    else
        return major1 - major2
}

function getFileName(url: string) {
    const segments = url.split('/');
    return segments[segments.length - 1];
}


function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        return fileSizeInBytes;
    } catch (err) {
        console.log(err);
        return 0
    }
}

let abortController:any = null

let downloading = false;

export async function  downloadNewVersion(win:any, url: string, proxy:string) {
    if(downloading)
        return

    downloading = true;
    abortController = new AbortController();

    const name = getFileName(url)
    const filePath = path.join(app.getPath('temp'), name)

    downloadFile(url, proxy, abortController.signal)
    .then(async (response:any)=>{

        const reader = response.body.getReader();
        const contentLength = response.headers.get('Content-Length');
        let receivedBytes = 0;

        const writeStream = fs.createWriteStream(filePath);

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            writeStream.write(value);
            receivedBytes += value.length;
            win?.webContents.send('DownloadProgress', receivedBytes*100/contentLength, "");
        }

        writeStream.end();
        win?.webContents.send('DownloadProgress', 100, filePath);    

        const update :any = await getConfigure("Update");
        update.downloaded = true;
        update.filePath = filePath.toString();
        await saveConfigure('Update', update);

    }).catch(async (error:any) => {
        if (error.name !== "AbortError") {
            win?.webContents.send('DownloadError', error);
        }

    }).finally(()=>{
        downloading = false;
    })
};

export function cancelDownload() {
    if(abortController) {
        abortController.abort()
        abortController = null;
    }
}

function getCurrentVersion() {
    return 'v' + app.getVersion()
}

export async function checkNewVersion(proxy:string) {
    if (updateState != "idle")
        return null

    updateState = "check"

    const url = 'https://api.github.com/repos/androidminds/superaiassistant/releases'

    const content = await getUrlContent(url, proxy)
    if(content == null) {
        updateState = "idle"
        console.log("cant not get version list from github")
        return null
    }

    const releaseList = JSON.parse(content)

    if (releaseList != null) {
        let latestVersion = getCurrentVersion()
        let downloadUrl = ""
        for (let i = 0; i < releaseList.length; i++) {
            if (compareVersion(releaseList[i]["tag_name"], latestVersion) > 0) {
                latestVersion = releaseList[i]["tag_name"]
                downloadUrl = releaseList[i]["assets"][0]["browser_download_url"]
            }
        }
        updateState = "idle"
        if (compareVersion(latestVersion, getCurrentVersion()) > 0) {
            return {version:latestVersion, url:downloadUrl}
        } else {
            return null
        }
    }
    return null
}

function checkTimeExpire(lastTime:any) {
    return true
}


export async function autoCheckVersion(proxy:string) {
    const update :any = await getConfigure("Update");
    if(update == null)
        return null

    if(update.foundNewVersion)
        return {version:update.newVersion, url:update.newVersionUrl}

    if(!update.checkTime || checkTimeExpire(update.checkTime)) {
        const result = await checkNewVersion(proxy);
        update.checkTime = (new Date())
        if(result != null) {        
            update.foundNewVersion = true
            update.newVersionUrl = result.url;
            update.newVersion= result.version;
            await saveConfigure("Update", update)
            return {version:update.newVersion, url:update.newVersionUrl}
        } else {
            update.foundNewVersion = false
            await saveConfigure("Update", update)
            return null
        }
    }
    return null
}


export async function manualCheckNewVersion(proxy:string) {
    const update : any = await getConfigure('Update', {})

    if(update != null && update.foundNewVersion) {
        return {version:update.newVersion, url:update.newVersionUrl}
    }
    const result = await checkNewVersion(proxy);
    update.checkTime = (new Date())
    if(result != null) {        
        update.foundNewVersion = true
        update.newVersionUrl = result.url;
        update.newVersion= result.version;
        await saveConfigure("Update", update)
        return {version:update.newVersion, url:update.newVersionUrl}
    } else {
        update.foundNewVersion = false
        await saveConfigure("Update", update)
        return null
    }
    return null
}

export function execUpdate(filePath:string) {
    if(updateState === "idle") {
        spawn(filePath, [], {detached: true, stdio: 'ignore'});
        return true;
    } else { 
        return false;
    }
}