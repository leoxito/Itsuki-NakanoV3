let handler = async (m, { conn, usedPrefix, command, isAdmin, isBotAdmin }) => {
  if (!m.isGroup) return m.reply('> *📚 Solo grupos*')
  if (!isAdmin) return m.reply('> *👑 Solo admins*')

  const action = (m.text || '').toLowerCase().split(' ')[1]
  const jid = m.chat

  console.log(`🔧 Comando welcome: ${action} para ${jid}`)

  // Verificar funciones directamente del handler
  let setWelcomeState, isWelcomeEnabled
  
  try {
    // Intentar importar del handler
    const handlerModule = await import('../handler.js').catch(e => null)
    if (handlerModule && handlerModule.default) {
      const handlerObj = handlerModule.default
      setWelcomeState = handlerObj.setWelcomeState
      isWelcomeEnabled = handlerObj.isWelcomeEnabled
    }
    
    // Si no funcionó, intentar con funciones globales
    if (!setWelcomeState) setWelcomeState = global.setWelcomeState
    if (!isWelcomeEnabled) isWelcomeEnabled = global.isWelcomeEnabled
    
    console.log(`🔍 Funciones disponibles: setWelcomeState=${!!setWelcomeState}, isWelcomeEnabled=${!!isWelcomeEnabled}`)
    
    if (!setWelcomeState || !isWelcomeEnabled) {
      return m.reply(`> ❌ *Error: Sistema de welcome no cargado*\n\nReinicia el bot para cargar las funciones.`)
    }

    if (action === 'on') {
      setWelcomeState(jid, true)
      return m.reply(`> ✅ *Welcome activado para este grupo*`)
    } 
    else if (action === 'off') {
      setWelcomeState(jid, false)
      return m.reply(`> ❌ *Welcome desactivado para este grupo*`)
    }
    else if (action === 'status') {
      const status = isWelcomeEnabled(jid) ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'
      return m.reply(`> 📊 *Estado:* ${status}`)
    }
    else {
      const status = isWelcomeEnabled(jid) ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'
      return m.reply(
        `> *🏷 CONTROL DE WELCOME*\n\n` +
        `Estado actual: ${status}\n\n` +
        `*Comandos:*\n` +
        `• ${usedPrefix}welcome on - Activar\n` +
        `• ${usedPrefix}welcome off - Desactivar\n` +
        `• ${usedPrefix}welcome status - Ver estado`
      )
    }
  } catch (error) {
    console.error('Error en welcome:', error)
    return m.reply(`> ❌ *Error: ${error.message}*`)
  }
}

handler.help = ['welcome']
handler.tags = ['group']
handler.command = ['welcome']
handler.admin = true
handler.group = true

export default handler