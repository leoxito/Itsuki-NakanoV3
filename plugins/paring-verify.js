
import { startSubBot } from './pairing-whatsapp.js' 
import path from 'path' 

// El handler para el comando 'code'
let handler = async (m, { conn, args, usedPrefix, command }) => {
  // Solo actúa si el comando es 'code'
  if (command !== 'code') return 

  let userName = args[0] ? args[0] : m.sender.split("@")[0]
  
  if (!global.subbots) global.subbots = [] 
  
  // Verifica si ya está conectado
  const existing = global.subbots.find(c => c.id === userName && c.connection === 'open')
  if (existing) {
    await conn.sendMessage(m.chat, { react: { text: '🤖', key: m.key } })
    return conn.reply(m.chat, '*𝘠𝘢 𝘌𝘳𝘦𝘴 𝘚𝘶𝘣-𝘣𝘰𝘵 𝘋𝘦 𝘐𝘵𝘴𝘶𝘬𝘪 🟢*', m)
  }
  
  // Inicia la conexión, pasando 'm' para que se genere el código de vinculación.
  await startSubBot(userName, conn, m)
}

handler.help = ['code']
handler.tags = ['serbot']
handler.command = ['code']


export { handler }
