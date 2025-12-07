import pkg from '@whiskeysockets/baileys'
const { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason } = pkg
import pino from "pino";
import { protoType, serialize, makeWASocket } from '../lib/simple.js'
import path from 'path'
import fs from 'fs'

// Importar para el sistema de botón
const { generateWAMessageFromContent, proto } = pkg

if (!global.subbots) global.subbots = []

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const ctxErr = global.rcanalx || {}
  const ctxOk = global.rcanalr || {}

  let userName = args[0] ? args[0] : m.sender.split("@")[0]
  const folder = path.join('./itsuki/Subbots', userName)

  if (global.subbots.length >= 10) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return conn.reply(m.chat, 'Se ha alcanzado el maximo de subbots permitidos.', m, ctxErr)
  }

  const existing = global.subbots.find(c => c.id === userName && c.connection === 'open')
  if (existing) {
    await conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } })
    return conn.reply(m.chat, 'Este subbot ya esta conectado.', m, ctxErr)
  }

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
  await conn.sendPresenceUpdate('composing', m.chat)

  const start = async () => {
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
        printQRInTerminal: false
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
        ({ handler: handlerr } = await import('../handler.js'))
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

          await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
          await conn.reply(m.chat, 'Subbot conectado exitosamente', m, ctxOk)
        }

        if (connection === 'close') {
          global.subbots = global.subbots.filter(c => c.id !== userName)

          const reason = lastDisconnect?.error?.output?.statusCode || 0

          await conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } })
          await conn.reply(m.chat, `Conexion cerrada. Razon: ${reason}`, m, ctxErr)

          if (reason !== DisconnectReason.loggedOut) {
            setTimeout(() => {
              start()
            }, 5000)
          } else {
            fs.rmSync(folder, { recursive: true, force: true })
          }
        }
      })

      sock.ev.on('group-participants.update', async (update) => {
        try {
          const { id, participants, action } = update || {}
          if (!id || !participants || !participants.length) return
        } catch (e) {}
      })

      if (!state.creds?.registered && !pairingCodeSent) {
        pairingCodeSent = true
        
        // Emoji de espera
        await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })
        
        setTimeout(async () => {
          try {
            const code = await sock.requestPairingCode(userName)
            
            // Emoji cuando se genera el código
            await conn.sendMessage(m.chat, { react: { text: '✅️', key: m.key } })
            
            // Sistema de botón para copiar el código
            const msg = generateWAMessageFromContent(m.chat, {
              viewOnceMessage: {
                message: {
                  interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({
                      text: `> ⓘ *Código de Vinculación*\n\nPara vincular tu WhatsApp:\n\n1. Abre WhatsApp en tu teléfono\n2. Ve a Ajustes → Dispositivos vinculados\n3. Toca Vincular un dispositivo\n4. Usa este código de 8 dígitos:`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ 
                      text: "Pulsa el botón para copiar el código" 
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({ 
                      hasMediaAttachment: false 
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                      buttons: [
                        {
                          name: "cta_copy",
                          buttonParamsJson: JSON.stringify({
                            display_text: "📋 Copiar Código",
                            copy_code: `${code}`
                          })
                        }
                      ]
                    })
                  })
                }
              }
            }, { quoted: m })

            await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id })
            
            // También enviar el código en texto normal
            await conn.reply(m.chat, `Código: ${code}\n\nEl código expira en unos minutos.`, m, ctxOk)
            
          } catch (err) {
            console.error('Error al obtener pairing code:', err)
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            await conn.reply(m.chat, `Error: ${err.message}`, m, ctxErr)
          }
        }, 3000)
      }

    } catch (error) {
      console.error('Error al crear socket:', error)
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      await conn.reply(m.chat, `Error critico: ${error.message}`, m, ctxErr)
    }
  }

  start()
}

handler.command = ['code']
export default handler