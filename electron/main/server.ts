
import net from 'net'
import path from 'node:path'
import fs from 'node:fs'

import { spawn, ChildProcess } from 'child_process';

//import {log} from './log'

let g_server: ChildProcess;
let g_port: number;
let g_url = ""

export function setBackendUrl(url: string) {
  g_url = url
}

export function getBackendUrl() {
  return g_url
}

function getRandomPort() {
  const min = 5000; // 最小端口号
  const max = 6000; // 最大端口号

  const getRandomInRange = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const isPortAvailable = (port: number) => {
    return new Promise((resolve) => {
      
      const server = net.createServer();
      server.listen(port, '127.0.0.1', () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      server.on('error', (_error) => {
        resolve(false);
      });
    });
  };

  const findAvailablePort = async () => {
    let port = getRandomInRange(min, max);
    while (!(await isPortAvailable(port))) {
      port = getRandomInRange(min, max);
    }
    return port;
  };

  return findAvailablePort();
}

let backendPath = path.join(__dirname, "../../../../backend.exe")

const g_code = Math.floor(Math.random() * 800000) + 100000;

export function startBackend(isPackaged: boolean) {
  if (!isPackaged) {
    g_port = 5579
    backendPath = path.join(__dirname, "../../data/backend.exe")
  }

  //getRandomPort().then((port: number) => {
    try {
      const port = 5579
      g_port = port;
      const childProcess = spawn(backendPath, ['--port=' + port, '--code=' + g_code], { detached: false, stdio: 'ignore' });
      g_server = childProcess
      //log("port : " + g_port)
    } catch (error) {
      //log(error.toString());
    }
  //})
  return null
}



export async function endServer() {
  if (g_server == null)
    return

  g_server = null;
  g_port = 0

  await fetch(g_url + '/api/exit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: g_code
    })
  })
}

export function getServerPort() {
  return g_port;
}

export async function getConfigure(section: string, defaultValue: any = null) {
  return new Promise((resolve, _) => {
    const data = { section: section };
    const queryParams = new URLSearchParams(data).toString();

    fetch(g_url + `/api/config?${queryParams}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then((data) => {
        if (data != null && data.length > 0) {
          resolve(JSON.parse(data));
        } else {
          resolve(defaultValue);
        }
      })
      .catch((error) => {
        console.error('Request failed:', error);
        resolve(defaultValue);
      });
  });
}

export async function saveConfigure(section: string, content: Record<string, any> | string) {
  return new Promise((resolve, reject) => {
    fetch(g_url + '/api/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        section: section,
        config: content
      })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        resolve(null);
      })
      .catch((error) => {
        console.error('Request failed:', error);
        reject(error);
      });
  });
}

async function httpGet(url: string, data: Record<string, string> | null) {
  return new Promise((resolve, reject) => {
    if (data != null) {
      // for some unknown reason, null value can be passed, so we need to remove them from parameters
      for (let key in data) {
        if (typeof data[key] !== "string") {
          delete data[key]
        }
      }
      const queryParams = new URLSearchParams(data).toString();
      url = g_url + url + `?${queryParams}`
    }

    fetch(url, {
      method: "GET",
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
        reject(error);
      });
  });
}
export async function getUrlContent(url: string, proxy: string) {
  try {
    return await httpGet("/api/geturl", { url, proxy }) as string
  } catch (error) {
    return null;
  }
}


export async function downloadFile(url: string, proxy: string, signal:any) {

  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams(proxy?{ url, proxy }:{url}).toString();
    url = g_url + "/api/download" + `?${queryParams}`

    fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'responseType': "stream"
        },
        signal
    })
    .then(async(response) => {
      if(!response.ok) {
        reject(await response.text())
      } else
        resolve(response)
    })
    .catch((error) => {
      reject(error)
    })
});
}
