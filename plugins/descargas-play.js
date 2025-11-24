import fetch from 'node-fetch'
import yts from 'yt-search'

let handler = async (m, { conn, text, usedPrefix }) => {
  const ctxErr = (global.rcanalx || {})
  const ctxWarn = (global.rcanalw || {})
  const ctxOk = (global.rcanalr || {})

  if (!text) {
    return conn.reply(m.chat, `
🎀 Itsuki-Nakano - Descargar Multimedia 🎥✨️

📝 Forma de uso:
• ${usedPrefix}play <nombre de la canción>

💡 Ejemplos:
• ${usedPrefix}play unravel Tokyo ghoul
• ${usedPrefix}play crossing field

🎯 Formato disponible:
🎵 Audio MP3 (alta calidad)

🌟 ¡Encuentra y descarga tu música favorita! 🎶
    `.trim(), m, ctxWarn)
  }

  try {
    await conn.reply(m.chat, '*🔎 Itsuki Esta Buscando Tu Audio*', m, ctxOk)

    const search = await yts(text)
    if (!search.videos.length) throw new Error('No encontré resultados para tu búsqueda.')

    const video = search.videos[0]
    const { title, url, thumbnail } = video

    let thumbBuffer = null
    if (thumbnail) {
      try {
        const resp = await fetch(thumbnail)
        thumbBuffer = Buffer.from(await resp.arrayBuffer())
      } catch (err) {
        console.log('No se pudo obtener la miniatura:', err.message)
      }
    }

    // ===== APIs para audio MP3 =====
    const fuentes = [
      { api: 'Adonix', endpoint: `https://api-adonix.ultraplus.click/download/ytmp3?apikey=${global.apikey}&url=${encodeURIComponent(url)}`, extractor: res => res?.data?.url },
      { api: 'MayAPI', endpoint: `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(url)}&type=mp3&apikey=${global.APIKeys['https://mayapi.ooguy.com']}`, extractor: res => res.result.url }
    ]

    let audioUrl, apiUsada, exito = false

    for (let fuente of fuentes) {
      try {
        const response = await fetch(fuente.endpoint)
        if (!response.ok) continue
        const data = await response.json()
        const link = fuente.extractor(data)
        if (link) {
          audioUrl = link
          apiUsada = fuente.api
          exito = true
          break
        }
      } catch (err) {
        console.log(`⚠️ Error con ${fuente.api}:`, err.message)
      }
    }

    if (!exito) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
      return conn.reply(m.chat, '*🧋 No se pudo enviar el audio desde ninguna API.*', m, ctxErr)
    }

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: false,
        jpegThumbnail: thumbBuffer,
        caption: `🎼 ${title} | API: ${apiUsada}`
      },
      { quoted: m }
    )

  } catch (e) {
    console.error('❌ Error en play:', e)
    await conn.reply(m.chat, `❌ Error: ${e.message}`, m, ctxErr)
  }
}

handler.help = ['play']
handler.tags = ['downloader']
handler.command = ['play']
handler.group = true

export default handler