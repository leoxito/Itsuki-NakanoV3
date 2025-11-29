import { search, download } from 'aptoide-scraper'
import fetch from 'node-fetch'
import Jimp from 'jimp'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, `> ⓘ USO INCORRECTO

> ❌ Debes ingresar el nombre de la aplicación

> 📝 Ejemplos:
> • ${usedPrefix + command} WhatsApp
> • ${usedPrefix + command} TikTok

> 💡 Busca y descarga APKs desde Aptoide`, m)
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

    let searchA = await search(text)
    if (!searchA.length) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat, `> ⓘ SIN RESULTADOS

> ❌ No se encontraron aplicaciones para: ${text}

> 💡 Verifica la ortografía o usa otro nombre`, m)
    }

    let data5 = await download(searchA[0].id)

    let txt = `> ⓘ INFORMACION APK

> 📱 ${data5.name}
> 📦 ${data5.package}
> 📅 ${data5.lastup}
> 💾 ${data5.size}`

    await conn.sendFile(m.chat, data5.icon, 'thumbnail.jpg', txt, m)

    if (data5.size.includes('GB') || parseFloat(data5.size.replace(' MB', '')) > 999) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat, `> ⓘ ARCHIVO DEMASIADO GRANDE

> ❌ El archivo pesa: ${data5.size}

> 💡 Límite máximo: 999 MB
> 💡 Busca una versión más ligera`, m)
    }

    let thumbnail = null
    try {
      const img = await Jimp.read(data5.icon)
      img.resize(300, Jimp.AUTO)
      thumbnail = await img.getBufferAsync(Jimp.MIME_JPEG)
    } catch (err) {
      console.log('Error al crear miniatura:', err)
    }

    await conn.sendMessage(
      m.chat,
      {
        document: { url: data5.dllink },
        mimetype: 'application/vnd.android.package-archive',
        fileName: `${data5.name}.apk`,
        caption: `> ⓘ APK DESCARGADA

> 📱 ${data5.name}
> 📦 ${data5.package}
> 💾 ${data5.size}`,
        ...(thumbnail ? { jpegThumbnail: thumbnail } : {})
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (error) {
    console.error(error)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return conn.reply(m.chat, `> ⓘ ERROR

> ❌ ${error.message || 'Error al procesar la descarga'}

> 💡 Verifica el nombre o intenta más tarde`, m)
  }
}

handler.tags = ['downloader']
handler.help = ['modoapk']
handler.command = ['modapk2', 'apk2']
handler.group = true

export default handler