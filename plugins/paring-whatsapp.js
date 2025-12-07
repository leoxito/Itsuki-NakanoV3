import pkg from '@whiskeysockets/baileys'
const { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason, generateWAMessageFromContent, proto, prepareWAMessageMedia } = pkg
import pino from "pino";
import { protoType, serialize, makeWASocket } from '../lib/simple.js'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk' // Añadido para los logs con barras

// --- YEEH ---
if (!global.subbots) global.subbots = []

// Función exportable para iniciar o reconectar el sub-bot
const startSubBot = async (userName, conn, m) => {
  const folder = path.join('Sessions/SubBot', userName)

  // Omitido: Límite de sub-bots y verificación de existencia (se maneja en el comando)

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

  // Solo si es una ejecución por comando, muestra el emoji de espera
  if (m) await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
  if (m) await conn.sendPresenceUpdate('composing', m.chat)

  try {
    const { state, saveCreds } = await useMultiFileAuthState(folder)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false,
      // --- 🔑 CORRECCIÓN CLAVE 1: ESTABILIDAD DE SESIÓN ---
      keepAliveIntervalMs: 30000, 
      getMessage: async key => ({ conversation: 'keepalive' }) 
      // --- FIN CORRECCIÓN CLAVE 1 ---
    })

    sock.id = userName
    sock.saveCreds = saveCreds
    let pairingCodeSent = false

    try {
      protoType()
      serialize()
    } catch (e) {
        console.log(e)
    }

    let handlerr
    try {
      ({ handler: handlerr } = await import('../handler.js')) // Asegúrate que esta ruta importe tu handler principal
    } catch (e) {
      console.error('[Handler] Error importando handler:', e)
    }

    sock.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        if (!handlerr) return
        await handlerr.call(sock, chatUpdate)
      } catch (e) {
        console.error("Error en handler subbot:", e)
      }
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'open') {
        sock.__sessionOpenAt = Date.now()
        sock.connection = 'open'
        sock.uptime = new Date()

        global.subbots = global.subbots.filter(c => c.id !== userName)
        global.subbots.push(sock)

        // Envía mensaje de éxito SOLO si se ejecutó por comando (m existe)
        if (m) {
          await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
          await conn.reply(m.chat, '> [🌱] 𝙎𝙪𝙗-𝙗𝙤𝙩 𝘾𝙤𝙣𝙚𝙘𝙩𝙖𝙙𝙤 𝙀𝙭𝙞𝙩𝙤𝙨𝙖𝙢𝙚𝙣𝙩𝙚', m)
        } else {
             // Log con barras para la auto-reconexión de inicio
             const successLog = `\n╭─────────────────────────────◉\n│ ${chalk.black.bgGreenBright.bold('     ✅ SUB-BOT RECONECTADO     ')}\n│ 「 🤖 」${chalk.yellow(`Sesión: ${userName}`)}\n│ 「 🟢 」${chalk.white('Estado: ACTIVO')}\n╰─────────────────────────────◉\n`
             console.log(successLog)
        }
      }

      if (connection === 'close') {
        global.subbots = global.subbots.filter(c => c.id !== userName)

        const reason = lastDisconnect?.error?.output?.statusCode || 0

        if (m) await conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } })

        // --- 🔑 CORRECCIÓN CLAVE 2: RECONEXIÓN ROBUSTA Y LENTA ---
        if (reason === DisconnectReason.loggedOut) {
          fs.rmSync(folder, { recursive: true, force: true })
          if(m) return conn.reply(m.chat, `> [🔴] 𝐒𝐄𝐒𝐈Ó𝐍 𝐄𝐋𝐈𝐌𝐈𝐍𝐀𝐃𝐀. 𝐄𝐬 𝐧𝐞𝐜𝐞𝐬𝐚𝐫𝐢𝐨 𝐯𝐨𝐥𝐯𝐞𝐫 𝐚 𝐯𝐢𝐧𝐜𝐮𝐥𝐚𝐫.`, m)
          return
        }

        const reconnectDelay = 15000; // 15 segundos de espera
        
        // Mensaje condicional para reconexión
        if (m) {
            conn.reply(m.chat, `> [🔴] 𝐂𝐎𝐍𝐄𝐗𝐈𝐎𝐍 𝐂𝐄𝐑𝐑𝐀𝐃𝐀.... 𝐑𝐞𝐜𝐨𝐧𝐞𝐜𝐭𝐚𝐧𝐝𝐨 𝐞𝐧 ${reconnectDelay / 1000}𝐬.`, m)
        } else {
            console.log(chalk.red(`[SUBBOT] Sesión ${userName} cerrada. Reconectando en ${reconnectDelay / 1000}s...`))
        }
        
        setTimeout(() => {
          startSubBot(userName, conn, m) // Llama a la función de inicio de sub-bot
        }, reconnectDelay)
        // --- FIN CORRECCIÓN CLAVE 2 ---
      }
    })

    sock.ev.on('group-participants.update', async (update) => {
      try {
        const { id, participants, action } = update || {}
        if (!id || !participants || !participants.length) return
      } catch (e) {}
    })

    if (!state.creds?.registered && !pairingCodeSent) {
      // Este bloque solo debe ejecutarse si se llama por comando (m existe)
      if (!m) return // Evita generar códigos en el inicio automático

      pairingCodeSent = true

      // Emoji de espera
      await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

      setTimeout(async () => {
        // ... [Tu lógica original para generar y enviar el código de vinculación con botones] ...
        try {
            const rawCode = await sock.requestPairingCode(userName)

            // Emoji cuando se genera el código
            await conn.sendMessage(m.chat, { react: { text: '✅️', key: m.key } })

            const imageUrl = 'https://cdn.russellxz.click/73109d7e.jpg'
            const media = await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: conn.waUploadToServer })

            const header = proto.Message.InteractiveMessage.Header.fromObject({
              hasMediaAttachment: true,
              imageMessage: media.imageMessage
            })

            const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
              header,
              body: proto.Message.InteractiveMessage.Body.fromObject({
                text: `> *❀ OPCIÓN-CODIGO ❀*
  
𓂃 ࣪ ִֶָ☾.  
> 1. 📲 *WhatsApp → Ajustes* > 2. ⛓️‍💥 *Dispositivos vinculados* > 3. 🔐 *Toca vincular* > 4. ✨ Copia este código:
  
> ˗ˏˋ ꕤ  ${rawCode.match(/.{1,4}/g)?.join(' ⸰ ')}  ꕤ ˎˊ˗
  
> ⌛ ⋮ *10 segundos de magia* > 🍒 ࣪𓂃 *¡Consejito dale rapidito!* ˚₊‧꒰ა ♡ ໒꒱ ‧₊˚`
              }),
              footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: "ᴄᴏᴘɪᴀ ᴇʟ ᴄᴏᴅɪɢᴏ ᴀǫᴜɪ ᴀʙᴀᴊᴏ 🌺"
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                  {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({ display_text: "𝗖𝗼𝗽𝗶𝗮 𝗘𝗹 𝗖𝗼𝗱𝗶𝗴𝗼 📋", copy_code: rawCode })
                  },
                  {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({ display_text: "𝗖𝗮𝗻𝗮𝗹 𝗢𝗳𝗶𝗰𝗮𝗹 🌷", url: "https://whatsapp.com/channel/0029VbBvZH5LNSa4ovSSbQ2N" })
                  }
                ]
              })
            })

            const msg = generateWAMessageFromContent(m.chat, { interactiveMessage }, { userJid: conn.user.jid, quoted: m })
            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

            console.log(`Código de vinculación enviado: ${rawCode}`)

          } catch (err) {
            console.error('Error al obtener pairing code:', err)
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            await conn.reply(m.chat, `*⚙️ Error: ${err.message}*`, m)
          }
        }, 3000)
      }

    }

  } catch (error) {
    console.error('Error al crear socket:', error)
    if (m) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        await conn.reply(m.chat, `Error critico: ${error.message}`, m)
    }
  }
}

// El handler para el comando 'code' ahora solo llama a startSubBot
let handler = async (m, { conn, args, usedPrefix, command }) => {
  let userName = args[0] ? args[0] : m.sender.split("@")[0]
  const folder = path.join('Sessions/SubBot', userName)
  
  // Usamos global.subbots para buscar una conexión existente
  const existing = global.subbots.find(c => c.id === userName && c.connection === 'open')
  if (existing) {
    await conn.sendMessage(m.chat, { react: { text: '🤖', key: m.key } })
    return conn.reply(m.chat, '*𝘠𝘢 𝘌𝘳𝘦𝘴 𝘚𝘶𝘣-𝘣𝘰𝘵 𝘋𝘦 𝘐𝘵𝘴𝘶𝘬𝘪 🟢*', m)
  }
  
  // Solo se envía 'm' cuando se ejecuta por comando
  await startSubBot(userName, conn, m)
}

handler.help = ['code']
handler.tags = ['serbot']
handler.command = ['code']

// --- 🎯 EXPORTAMOS LA FUNCIÓN PARA EL INDEX.JS ---
export { handler, startSubBot }
