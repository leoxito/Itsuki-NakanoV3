import fetch from "node-fetch"
import yts from "yt-search"
import crypto from "crypto"
import axios from "axios"

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text?.trim())
      return conn.reply(m.chat, `> ⓘ USO INCORRECTO

> ❌ Debes ingresar el nombre o enlace del video

> 📝 Ejemplo:
> • ${usedPrefix + command} nombre del video
> • ${usedPrefix + command} https://youtube.com/...`, m)

    await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

    const videoMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/|v\/)?([a-zA-Z0-9_-]{11})/)
    const query = videoMatch ? `https://youtu.be/${videoMatch[1]}` : text

    const search = await yts(query)
    const result = videoMatch
      ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0]
      : search.all[0]

    if (!result) throw '> ⓘ SIN RESULTADOS\n\n❌ No se encontraron resultados\n\n💡 Intenta con otra búsqueda'

    const { title, thumbnail, timestamp, views, ago, url, author, seconds } = result
    if (seconds > 60000) throw '> ⓘ DURACION EXCEDIDA\n\n❌ El video supera el límite\n\n💡 Máximo 10 minutos'

    const channelName = author?.name || 'Canal desconocido'
    const vistas = formatViews(views)
    const info = `> *ⓘ Y O U T U B E - P L A Y S V3*

> *🏷️ Título:* ${title}
> *📺 Canal:* ${channelName}
> *👀 Vistas:* ${vistas}
> *⏱️ Duración:* ${timestamp}
> *📅 Publicado:* ${ago}
> *🔗 Enlace:* ${url}
> *🎬 Tipo:* ${result.type || 'HD'}`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m })

    if (['play3', 'mp3'].includes(command)) {
      await conn.sendMessage(m.chat, { react: { text: '🎵', key: m.key } })

      const audio = await savetube.download(url, "audio")
      if (!audio?.status) throw `> ⓘ ERROR\n\n❌ Error al obtener audio\n\n💡 ${audio.error}`

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: audio.result.download },
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`
        },
        { quoted: m }
      )

      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    }

    else if (['play4', 'mp4'].includes(command)) {
      await conn.sendMessage(m.chat, { react: { text: '🎥', key: m.key } })
      const video = await getVid(url)
      if (!video?.url) throw '> ⓘ ERROR\n\n❌ No se pudo obtener el video'

      await conn.sendMessage(
        m.chat,
        {
          video: { url: video.url },
          fileName: `${title}.mp4`,
          mimetype: 'video/mp4',
          caption: `> *ⓘ Y O U T U B E - P L A Y S V3*

> *🏷️ Título:* ${title}
> *📺 Canal:* ${channelName}
> *⏱️ Duración:* ${timestamp}
> *👀 Vistas:* ${vistas}
> *🎬 Formato:* MP4
> *🌐 Servidor:* ${video.api || 'Yupra'}
> *🫧 Calidad:* ${video.quality || 'Alta'}
> *🔗 link:* ${url}`
        },
        { quoted: m }
      )
      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    }

  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    console.error('Error en descarga YouTube:', e)
    return conn.reply(
      m.chat,
      typeof e === 'string'
        ? e
        : `> ⓘ ERROR\n\n❌ ${e.message || 'Error desconocido'}\n\n💡 Intenta más tarde`,
      m
    )
  }
}

handler.command = handler.help = ['play3', 'play4']
handler.tags = ['downloader']
handler.group = true

export default handler

async function getVid(url) {
  const apis = [
    {
      api: 'Yupra',
      endpoint: `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
      extractor: (res) => {
        if (res?.success && res?.data?.download_url) {
          return {
            url: res.data.download_url,
            quality: res.data.format || 'Desconocida'
          }
        }
        return null
      }
    }
  ]
  return await fetchFromApis(apis)
}

async function fetchFromApis(apis) {
  for (const { api, endpoint, extractor } of apis) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(endpoint, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const res = await response.json()
      clearTimeout(timeout)
      
      const result = extractor(res)
      if (result) {
        return {
          url: result.url,
          quality: result.quality,
          api
        }
      }
    } catch (err) {
      console.log(`Error en API ${api}:`, err.message)
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  return null
}

const savetube = {
  api: {
    base: "https://media.savetube.me/api",
    info: "/v2/info",
    download: "/download",
    cdn: "/random-cdn"
  },
  headers: {
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://yt.savetube.me",
    referer: "https://yt.savetube.me/",
    "user-agent": "Postify/1.0.0"
  },
  crypto: {
    hexToBuffer: (hexString) => {
      const matches = hexString.match(/.{1,2}/g)
      return Buffer.from(matches.join(""), "hex")
    },
    decrypt: async (enc) => {
      const secretKey = "C5D58EF67A7584E4A29F6C35BBC4EB12"
      const data = Buffer.from(enc, "base64")
      const iv = data.slice(0, 16)
      const content = data.slice(16)
      const key = savetube.crypto.hexToBuffer(secretKey)
      const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv)
      let decrypted = decipher.update(content)
      decrypted = Buffer.concat([decrypted, decipher.final()])
      return JSON.parse(decrypted.toString())
    },
  },
  youtube: (url) => {
    const patterns = [
      /youtube.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtu.be\/([a-zA-Z0-9_-]{11})/
    ]
    for (let pattern of patterns) {
      if (pattern.test(url)) return url.match(pattern)[1]
    }
    return null
  },
  request: async (endpoint, data = {}, method = "post") => {
    try {
      const { data: response } = await axios({
        method,
        url: `${endpoint.startsWith("http") ? "" : savetube.api.base}${endpoint}`,
        data: method === "post" ? data : undefined,
        params: method === "get" ? data : undefined,
        headers: savetube.headers
      })
      return { status: true, code: 200, data: response }
    } catch (error) {
      return { status: false, code: error.response?.status || 500, error: error.message }
    }
  },
  getCDN: async () => {
    const response = await savetube.request(savetube.api.cdn, {}, "get")
    if (!response.status) return response
    return { status: true, code: 200, data: response.data.cdn }
  },
  download: async (link, type = "audio") => {
    const id = savetube.youtube(link)
    if (!id) return { status: false, code: 400, error: "No se pudo obtener ID del video" }
    try {
      const cdnx = await savetube.getCDN()
      if (!cdnx.status) return cdnx
      const cdn = cdnx.data
      const videoInfo = await savetube.request(
        `https://${cdn}${savetube.api.info}`,
        { url: `https://www.youtube.com/watch?v=${id}` }
      )
      if (!videoInfo.status) return videoInfo
      const decrypted = await savetube.crypto.decrypt(videoInfo.data.data)
      const downloadData = await savetube.request(
        `https://${cdn}${savetube.api.download}`,
        {
          id,
          downloadType: "audio",
          quality: "mp3",
          key: decrypted.key
        }
      )
      if (!downloadData.data.data?.downloadUrl)
        return { status: false, code: 500, error: "No se pudo obtener link de descarga" }

      return {
        status: true,
        result: {
          download: downloadData.data.data.downloadUrl,
          title: decrypted.title || "Desconocido"
        }
      }
    } catch (error) {
      return { status: false, code: 500, error: error.message }
    }
  }
}

function formatViews(views) {
  if (views === undefined) return "No disponible"
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B (${views.toLocaleString()})`
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M (${views.toLocaleString()})`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K (${views.toLocaleString()})`
  return views.toString()
}