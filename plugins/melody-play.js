import fetch from 'node-fetch'
import yts from 'yt-search'
const { generateWAMessageContent, generateWAMessageFromContent, proto } = (await import('@whiskeysockets/baileys')).default

const API_BASE = 'http://64.20.54.50:30104/api/download/youtube'

async function makeFkontak() {
  try {
    const res = await fetch('https://i.postimg.cc/x8dk1hcW/1000-F-575425197-qu-Jgp-NKn-FYHI8IVt8Hy-GTGb-J8lj-Owvp-H-(1).png')
    const thumb2 = Buffer.from(await res.arrayBuffer())
    return {
      key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
      message: { locationMessage: { name: 'Melody Music', jpegThumbnail: thumb2 } },
      participant: '0@s.whatsapp.net'
    }
  } catch {
    return undefined
  }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const quotedContact = await makeFkontak()
  if (!text) return conn.reply(m.chat, '🌸 *ᴘᴏʀ ғᴀᴠᴏʀ, ɪɴɢʀᴇsᴀ ᴇʟ ɴᴏᴍʙʀᴇ ᴏ ᴇɴʟᴀᴄᴇ ᴅᴇ ʏᴏᴜᴛᴜʙᴇ*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
  
  await m.react('🌸')
  
  try {
    async function createImage(url) {
      const { imageMessage } = await generateWAMessageContent({ image: { url } }, { upload: conn.waUploadToServer })
      return imageMessage
    }

    let firstYoutube = null
    let headImage = null

    // Buscar en YouTube
    const y = await yts(text)
    if (!y?.videos?.length) {
      return conn.reply(m.chat, '🍓 *ɴᴏ sᴇ ᴇɴᴄᴏɴᴛʀᴀʀᴏɴ ʀᴇsᴜʟᴛᴀᴅᴏs*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
    }

    const vids = y.videos.slice(0, 1)
    firstYoutube = vids[0]
    
    if (firstYoutube?.thumbnail) {
      headImage = await createImage(firstYoutube.thumbnail)
    }

    const { title, thumbnail, timestamp, views, ago, url, author, seconds } = firstYoutube
    
    if (seconds > 1800) {
      return conn.reply(m.chat, '⚠️ *ᴇʟ ᴄᴏɴᴛᴇɴɪᴅᴏ sᴜᴘᴇʀᴀ ʟᴏs 30 ᴍɪɴᴜᴛᴏs*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
    }

    // Texto con diseño cute minimalista
    let bodyText = `✨ *ᴅᴇᴛᴀʟʟᴇs ᴅᴇʟ ᴄᴏɴᴛᴇɴɪᴅᴏ* ✨

🌸 *ᴛíᴛᴜʟᴏ:* ${title}
🎀 *ᴄᴀɴᴀʟ:* ${author.name}
⏳ *ᴅᴜʀᴀᴄɪóɴ:* ${timestamp}
📅 *ᴘᴜʙʟɪᴄᴀᴅᴏ:* ${ago}
👁️ *ᴠɪsᴛᴀs:* ${formatViews(views)}

☁️ *sᴇʟᴇᴄᴄɪᴏɴᴀ ᴇʟ ғᴏʀᴍᴀᴛᴏ:*`

    // Crear botones de respuesta rápida cute
    let quickButtons = [
      { 
        name: 'quick_reply', 
        buttonParamsJson: JSON.stringify({ 
          display_text: '🎧  ᴀᴜᴅɪᴏ ᴍᴘ₃', 
          id: `${usedPrefix}maudio ${url}`
        }) 
      },
      { 
        name: 'quick_reply', 
        buttonParamsJson: JSON.stringify({ 
          display_text: '🎬  ᴠɪᴅᴇᴏ ᴍᴘ₄', 
          id: `${usedPrefix}mvideo ${url}`
        }) 
      }
    ]

    // Crear mensaje interactivo con diseño cute
    const combinedMessage = {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            ...(headImage
              ? {
                  header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: '🌸  ᴍᴇʟᴏᴅʏ ᴍᴜsɪᴄ  🌸',
                    subtitle: '✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅',
                    hasMediaAttachment: true,
                    imageMessage: headImage
                  })
                }
              : {
                  header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: '🌸  ᴍᴇʟᴏᴅʏ ᴍᴜsɪᴄ  🌸',
                    subtitle: '✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅',
                    hasMediaAttachment: false
                  })
                }),
            body: proto.Message.InteractiveMessage.Body.fromObject({ 
              text: bodyText 
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
              text: '🍓  ᴄᴏɴ  ᴀᴍᴏʀ  ᴅᴇ  ᴍᴇʟᴏᴅʏ  🍓'
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ 
              buttons: quickButtons
            })
          })
        }
      }
    }

    await conn.relayMessage(m.chat, combinedMessage, { messageId: m.id?.id || m.key.id })
    await m.react('💖')
    
  } catch (error) {
    console.error('Error en Melody:', error)
    conn.reply(m.chat, `🍓 *ᴏʜ ɴᴏ! ʜᴜʙᴏ ᴜɴ ᴇʀʀᴏʀ*\n\n${error?.message || 'ɪɴᴛᴇɴᴛᴀ ɴᴜᴇᴠᴀᴍᴇɴᴛᴇ'}\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ`, quotedContact || m)
    await m.react('💔')
  }
}

// Handler para descargar audio
const audioHandler = async (m, { conn, text, usedPrefix }) => {
  const quotedContact = await makeFkontak()
  if (!text) return conn.reply(m.chat, '🌸 *ᴘᴏʀ ғᴀᴠᴏʀ, ɪɴɢʀᴇsᴀ ᴇʟ ᴇɴʟᴀᴄᴇ*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
  
  await m.react('🌸')
  
  try {
    const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (!urlMatch) {
      return conn.reply(m.chat, '🍓 *ᴇɴʟᴀᴄᴇ ɴᴏ ᴠáʟɪᴅᴏ*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
    }
    
    const url = `https://youtu.be/${urlMatch[1]}`
    
    const search = await yts(url)
    const video = search.videos.find(v => v.videoId === urlMatch[1]) || search.all[0]
    
    if (!video) {
      return conn.reply(m.chat, '🍓 *ᴠɪᴅᴇᴏ ɴᴏ ᴇɴᴄᴏɴᴛʀᴀᴅᴏ*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
    }
    
    if (video.seconds > 1800) {
      return conn.reply(m.chat, '⚠️ *ᴇʟ ᴀᴜᴅɪᴏ sᴜᴘᴇʀᴀ ʟᴏs 30 ᴍɪɴᴜᴛᴏs*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
    }
    
    const downloadUrl = `${API_BASE}/mp3?url=${encodeURIComponent(url)}`
    
    // Mensaje cute de procesamiento
    await conn.reply(m.chat, `🌸 *ᴘʀᴏᴄᴇsᴀɴᴅᴏ ᴀᴜᴅɪᴏ...* 🌸

🎧 **${video.title.substring(0, 50)}${video.title.length > 50 ? '...' : ''}**
✨ ${video.author.name}
⏰ ${video.timestamp}

☁️ *ᴇsᴛᴏ ᴘᴜᴇᴅᴇ ᴛᴏᴍᴀʀ ᴜɴᴏs sᴇɢᴜɴᴅᴏs...*
✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ`, quotedContact || m)
    
    // Enviar audio con nombre cute
    await conn.sendMessage(m.chat, {
      audio: { url: downloadUrl },
      fileName: `🌸 ${cleanFileName(video.title.substring(0, 30))}.mp3`,
      mimetype: 'audio/mpeg',
      ptt: false
    }, { quoted: m })
    
    await m.react('💖')
    
  } catch (error) {
    console.error('Error en maudio:', error)
    conn.reply(m.chat, `🍓 *ᴏʜ ɴᴏ! ɴᴏ ᴘᴜᴅᴇ ᴅᴇsᴄᴀʀɢᴀʀᴇ ᴇʟ ᴀᴜᴅɪᴏ*\n\n${error?.message || 'ɪɴᴛᴇɴᴛᴀ ᴅᴇ ɴᴜᴇᴠᴏ'}\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ`, quotedContact || m)
    await m.react('💔')
  }
}

// Handler para descargar video
const videoHandler = async (m, { conn, text, usedPrefix }) => {
  const quotedContact = await makeFkontak()
  if (!text) return conn.reply(m.chat, '🌸 *ᴘᴏʀ ғᴀᴠᴏʀ, ɪɴɢʀᴇsᴀ ᴇʟ ᴇɴʟᴀᴄᴇ*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
  
  await m.react('🌸')
  
  try {
    const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (!urlMatch) {
      return conn.reply(m.chat, '🍓 *ᴇɴʟᴀᴄᴇ ɴᴏ ᴠáʟɪᴅᴏ*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
    }
    
    const url = `https://youtu.be/${urlMatch[1]}`
    
    const search = await yts(url)
    const video = search.videos.find(v => v.videoId === urlMatch[1]) || search.all[0]
    
    if (!video) {
      return conn.reply(m.chat, '🍓 *ᴠɪᴅᴇᴏ ɴᴏ ᴇɴᴄᴏɴᴛʀᴀᴅᴏ*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
    }
    
    if (video.seconds > 1800) {
      return conn.reply(m.chat, '⚠️ *ᴇʟ ᴠɪᴅᴇᴏ sᴜᴘᴇʀᴀ ʟᴏs 30 ᴍɪɴᴜᴛᴏs*\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ', quotedContact || m)
    }
    
    const downloadUrl = `${API_BASE}/mp4?url=${encodeURIComponent(url)}`
    
    // Mensaje cute de procesamiento
    await conn.reply(m.chat, `🌸 *ᴘʀᴏᴄᴇsᴀɴᴅᴏ ᴠɪᴅᴇᴏ...* 🌸

🎬 **${video.title.substring(0, 50)}${video.title.length > 50 ? '...' : ''}**
✨ ${video.author.name}
⏰ ${video.timestamp}

☁️ *ᴇsᴛᴏ ᴘᴜᴇᴅᴇ ᴛᴏᴍᴀʀ ᴜɴᴏs sᴇɢᴜɴᴅᴏs...*
✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ`, quotedContact || m)
    
    // Enviar video con nombre cute
    await conn.sendMessage(m.chat, {
      video: { url: downloadUrl },
      caption: `🌸 *ᴠɪᴅᴇᴏ ᴅᴇsᴄᴀʀɢᴀᴅᴏ* 🌸

🎬 ${video.title}
✨ ${video.author.name}
⏰ ${video.timestamp}
👁️ ${formatViews(video.views)}

🍓 *ᴅɪsғʀᴜᴛᴀ ᴛᴜ ᴠɪᴅᴇᴏ!*
✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ`,
      fileName: `🌸 ${cleanFileName(video.title.substring(0, 30))}.mp4`,
      mimetype: 'video/mp4'
    }, { quoted: m })
    
    await m.react('💖')
    
  } catch (error) {
    console.error('Error en mvideo:', error)
    conn.reply(m.chat, `🍓 *ᴏʜ ɴᴏ! ɴᴏ ᴘᴜᴅᴇ ᴅᴇsᴄᴀʀɢᴀʀᴇ ᴇʟ ᴠɪᴅᴇᴏ*\n\n${error?.message || 'ɪɴᴛᴇɴᴛᴀ ᴅᴇ ɴᴜᴇᴠᴏ'}\n\n✧ ⁺ ･˚ ˖° ˖⁺ ‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ`, quotedContact || m)
    await m.react('💔')
  }
}

// Funciones auxiliares
function formatViews(views) {
  if (!views) return "0"
  if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)}ʙ`
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}ᴍ`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}ᴋ`
  return views.toString()
}

function cleanFileName(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
}

// Configuración de comandos
handler.help = ['melody']
handler.tags = ['downloader', 'music']
handler.command = ['melody', 'mel', 'melly']

// Exportar handlers
export {
  handler as default,
  audioHandler as maudioHandler,
  videoHandler as mvideoHandler
}

// Instrucciones para usar en el archivo principal:
/*
import melodyHandler, { maudioHandler, mvideoHandler } from './melody.js'

// Registrar comando principal
conn.commands.set('melody', melodyHandler)

// En el manejador de mensajes, agregar:
conn.on('message', async (m) => {
  if (!m.message) return
  
  const text = m.text.trim()
  const usedPrefix = '!' // Tu prefijo
  
  if (text.startsWith(`${usedPrefix}maudio`)) {
    await maudioHandler(m, { conn, text: text.replace(`${usedPrefix}maudio`, '').trim(), usedPrefix })
  } else if (text.startsWith(`${usedPrefix}mvideo`)) {
    await mvideoHandler(m, { conn, text: text.replace(`${usedPrefix}mvideo`, '').trim(), usedPrefix })
  }
})
*/
