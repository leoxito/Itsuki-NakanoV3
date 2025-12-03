import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command, isAdmin, isOwner, groupMetadata }) => {
  if (!m.isGroup) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return conn.reply(m.chat, 
`> ⓘ COMANDO SOLO PARA GRUPOS

> ❌ Este comando solo funciona en grupos

> 💡 Úsalo en un grupo para cambiar el prefijo`, m)
  }

  const chat = global.db.data.chats[m.chat]

  // Verificar si es admin
  const participants = await conn.groupMetadata(m.chat).catch(() => ({ participants: [] }))
  const user = participants.participants.find(p => p.id === m.sender)
  const isUserAdmin = user && (user.admin === 'admin' || user.admin === 'superadmin')

  if (!isUserAdmin && !isOwner) {
    await conn.sendMessage(m.chat, { react: { text: '🚫', key: m.key } })
    return conn.reply(m.chat,
`> ⓘ PERMISO DENEGADO

> ❌ Solo los administradores pueden cambiar el prefijo

> 🔧 Pide a un admin que configure el prefijo`, m)
  }

  const args = text.split(' ')
  const subcmd = args[0]?.toLowerCase()

  if (command === 'setprefix') {
    if (!subcmd) {
      // Mostrar prefijo actual - emoji de información
      await conn.sendMessage(m.chat, { react: { text: 'ℹ️', key: m.key } })
      
      const currentPrefix = chat.prefix || 'Usando prefijos globales'
      const customPrefixes = chat.prefixes || []

      let mensaje = `> 🎯 *PREFIJO ACTUAL*\n\n`

      if (chat.prefix) {
        mensaje += `🔰 *Prefijo principal:* ${chat.prefix}\n`
        mensaje += `📅 *Configurado:* Prefijo personalizado del grupo\n\n`
      } else {
        mensaje += `🔰 *Prefijo principal:* Usando prefijos globales\n`
        mensaje += `📅 *Configurado:* Sistema por defecto\n\n`
      }

      if (customPrefixes.length > 0) {
        mensaje += `📋 *Prefijos adicionales:*\n`
        customPrefixes.forEach((p, i) => {
          mensaje += `• ${p}\n`
        })
        mensaje += '\n'
      }

      mensaje += `📝 *Uso:* ${usedPrefix}setprefix [nuevo_prefijo]\n`
      mensaje += `💡 *Ejemplos:*\n`
      mensaje += `• ${usedPrefix}setprefix 🔥\n`
      mensaje += `• ${usedPrefix}setprefix ✨\n`
      mensaje += `• ${usedPrefix}setprefix !\n\n`
      mensaje += `🔄 *Para quitar:* ${usedPrefix}delprefix`

      return conn.reply(m.chat, mensaje, m)
    }

    const newPrefix = args[0]

    // Validaciones
    if (newPrefix.length > 3) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat,
`> ⓘ PREFIJO INVÁLIDO

> ❌ El prefijo no puede tener más de 3 caracteres

> 💡 Ejemplo: 🔥, ✨, !`, m)
    }

    if (newPrefix.includes(' ')) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat,
`> ⓘ PREFIJO INVÁLIDO

> ❌ El prefijo no puede contener espacios

> 💡 Ejemplo: 🔥, ✨, !`, m)
    }

    // Emoji de espera mientras se configura
    await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

    // Guardar el prefijo
    chat.prefix = newPrefix

    // Si no existe el array de prefijos, crearlo
    if (!chat.prefixes) chat.prefixes = []

    // Agregar a la lista de prefijos personalizados si no existe
    if (!chat.prefixes.includes(newPrefix)) {
      chat.prefixes.push(newPrefix)
    }

    // Emoji de éxito después de configurar
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    return conn.reply(m.chat,
`> ✅ *PREFIJO CONFIGURADO*

> 🎯 *Nuevo prefijo:* ${newPrefix}
> 👤 *Configurado por:* @${m.sender.split('@')[0]}
> 📅 *Fecha:* ${new Date().toLocaleString()}

> 💡 *Ahora puedes usar comandos como:*
> • *${newPrefix}menu* - Ver menú
> • *${newPrefix}play canción* - Descargar música
> • *${newPrefix}sticker* - Crear sticker

> 🔧 *También siguen funcionando:*
> • Prefijos globales: ${global.globalPrefixes.slice(0, 5).join(', ')}...
> • Prefijos adicionales: ${chat.prefixes.join(', ')}

> 🗑️ *Para quitar:* ${newPrefix}delprefix`, m)

  } else if (command === 'delprefix') {
    // Emoji de espera mientras se procesa
    await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })
    
    // Quitar prefijo personalizado
    if (chat.prefix) {
      const oldPrefix = chat.prefix
      chat.prefix = null

      // Remover de la lista de prefijos personalizados
      if (chat.prefixes) {
        const index = chat.prefixes.indexOf(oldPrefix)
        if (index > -1) {
          chat.prefixes.splice(index, 1)
        }
      }

      // Emoji de éxito
      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

      return conn.reply(m.chat,
`> 🔄 *PREFIJO RESTABLECIDO*

> ✅ Prefijo personalizado eliminado
> 📅 *Eliminado por:* @${m.sender.split('@')[0]}
> 🗑️ *Prefijo eliminado:* ${oldPrefix}

> 💡 *Ahora se usarán los prefijos globales:*
> ${global.globalPrefixes.slice(0, 10).join(', ')}...

> 🎯 *Ejemplos de uso:*
> • .menu
> • ,play canción
> • !sticker

> ⚙️ *Para configurar nuevo prefijo:*
> .setprefix [nuevo_prefijo]`, m)
    } else {
      await conn.sendMessage(m.chat, { react: { text: 'ℹ️', key: m.key } })
      return conn.reply(m.chat,
`> ℹ️ *INFORMACIÓN*

> 📢 Este grupo ya está usando los prefijos globales

> 🎯 *Prefijos disponibles:*
> ${global.globalPrefixes.slice(0, 10).join(', ')}...

> ⚙️ *Para configurar prefijo personalizado:*
> .setprefix [nuevo_prefijo]`, m)
    }
  }
}

handler.help = ['setprefix', 'delprefix']
handler.tags = ['group']
handler.command = ['setprefix', 'delprefix']
handler.group = true
handler.admin = true

export default handler