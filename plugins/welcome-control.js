let handler = async (m, { conn, usedPrefix, command, isAdmin, isBotAdmin }) => {
  if (!m.isGroup) return conn.reply(m.chat, '> *📚 Solo grupos*', m)
  if (!isAdmin) return conn.reply(m.chat, '> *👑 Solo admins*', m)

  const action = (m.text || '').toLowerCase().split(' ')[1]
  const jid = m.chat

  try {
    // USAR FUNCIONES GLOBALES
    if (!global.setWelcomeState || !global.isWelcomeEnabled) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat, '> ❌ *Funciones de welcome no disponibles*', m)
    }

    if (action === 'on') {
      global.setWelcomeState(jid, true)
      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
      return conn.reply(m.chat, 
        `> ✅ *Welcome activado*\n\n` +
        `*Grupo:* ${await conn.getName(jid).catch(() => jid)}\n` +
        `*Estado:* 🟢 ACTIVADO\n` +
        `*Configurado por:* ${m.pushName || 'Admin'}`,
      m)
    } 
    else if (action === 'off') {
      global.setWelcomeState(jid, false)
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat, 
        `> ☑️ *Welcome desactivado*\n\n` +
        `*Grupo:* ${await conn.getName(jid).catch(() => jid)}\n` +
        `*Estado:* 🔴 DESACTIVADO\n` +
        `*Configurado por:* ${m.pushName || 'Admin'}`,
      m)
    }
    else if (action === 'status') {
      const status = global.isWelcomeEnabled(jid) ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'
      const icon = global.isWelcomeEnabled(jid) ? '✅' : '❌'
      await conn.sendMessage(m.chat, { react: { text: icon, key: m.key } })
      return conn.reply(m.chat, 
        `> 📊 *Estado del Welcome*\n\n` +
        `*Grupo:* ${await conn.getName(jid).catch(() => jid)}\n` +
        `*Estado:* ${status}\n` +
        `*ID:* ${jid}`,
      m)
    }
    else {
      // Mostrar ayuda
      const status = global.isWelcomeEnabled(jid) ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'
      await conn.sendMessage(m.chat, { react: { text: 'ℹ️', key: m.key } })
      return conn.reply(m.chat, 
        `> *🏷️ CONTROL DE WELCOME*\n\n` +
        `*Estado actual:* ${status}\n\n` +
        `*📋 Comandos disponibles:*\n` +
        `• ${usedPrefix}welcome on - Activar welcome\n` +
        `• ${usedPrefix}welcome off - Desactivar welcome\n` +
        `• ${usedPrefix}welcome status - Ver estado\n\n` +
        `*💡 Nota:* Los mensajes de bienvenida/despedida se enviarán automáticamente cuando alguien entre o salga del grupo.`,
      m)
    }
  } catch (error) {
    console.error('Error en comando welcome:', error)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return conn.reply(m.chat, 
      `> ❌ *Error en comando*\n\n` +
      `*Error:* ${error.message || 'Desconocido'}`,
    m)
  }
}

// Configuración del plugin
handler.help = ['welcome']
handler.tags = ['group', 'admin']
handler.command = ['welcome', 'bienvenida']
handler.admin = true
handler.group = true
handler.botAdmin = false

export default handler