let handler = async (m, { conn, usedPrefix, command, isAdmin, isROwner }) => {
    if (!m.isGroup) {
        await m.react('❌')
        return m.reply('> ⓘ Este comando solo funciona en grupos.')
    }

    if (!isAdmin && !isROwner) {
        await m.react('🚫')
        return m.reply('> ⓘ Solo los administradores pueden usar este comando.')
    }

    let chat = global.db.data.chats[m.chat]
    let args = m.text.trim().split(' ').slice(1)
    let action = args[0]?.toLowerCase()

    if (!action || (action !== 'on' && action !== 'off' && action !== 'stats' && action !== 'lista' && action !== 'limpiar')) {
        let status = chat.antiArabe ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'
        const expulsiones = chat.antiArabeRegistros?.length || 0
        const hoy = chat.antiArabeRegistros?.filter(r => 
            new Date(r.fecha).toDateString() === new Date().toDateString()
        ).length || 0
        
        await m.react('ℹ️')
        return m.reply(`╭─「 🛡️ *ANTI-ÁRABE* 🛡️ 」
│ 
│ 📊 *Estado Actual:*
│ ├ Sistema: ${status}
│ ├ Expulsiones totales: ${expulsiones}
│ └ Expulsiones hoy: ${hoy}
│ 
│ ⚙️ *Opciones disponibles:*
│ ├ ${usedPrefix}antiarabe on - Activar sistema
│ ├ ${usedPrefix}antiarabe off - Desactivar sistema
│ ├ ${usedPrefix}antiarabe stats - Ver estadísticas
│ ├ ${usedPrefix}antiarabe lista - Países bloqueados
│ └ ${usedPrefix}antiarabe limpiar - Limpiar registros
│ 
│ 🌍 *Países bloqueados:* 21 países árabes
╰─◉`.trim())
    }

    switch(action) {
        case 'on':
            if (chat.antiArabe) {
                await m.react('ℹ️')
                return m.reply('> ⓘ El *Anti-Árabe* ya está activado.')
            }
            chat.antiArabe = true
            await m.react('✅')
            m.reply(`╭─「 🛡️ *ANTI-ÁRABE ACTIVADO* 🛡️ 」
│ 
│ ✅ *Protección activada:*
│ ├ Números árabes detectados
│ ├ Usuarios serán EXPULSADOS
│ ├ +21 países árabes bloqueados
│ └ Mensajes eliminados
│ 
│ 🌍 *Cobertura completa:*
│ ├ Medio Oriente completo
│ ├ Norte de África
│ └ Península arábiga
│ 
│ ⚠️ *Advertencia:*
│ ├ Usuarios árabes serán expulsados
│ ├ automáticamente al enviar mensajes
│ └ También al intentar entrar al grupo
│ 
│ 🔒 *Grupo protegido*
╰─◉`.trim())
            break

        case 'off':
            if (!chat.antiArabe) {
                await m.react('ℹ️')
                return m.reply('> ⓘ El *Anti-Árabe* ya está desactivado.')
            }
            chat.antiArabe = false
            await m.react('✅')
            m.reply(`╭─「 🛡️ *ANTI-ÁRABE DESACTIVADO* 🛡️ 」
│ 
│ ✅ *Protección desactivada:*
│ ├ Números árabes permitidos
│ ├ Sin expulsiones
│ └ Restricciones removidas
│ 
│ 🔓 *Grupo sin filtros árabes*
╰─◉`.trim())
            break

        case 'stats':
        case 'estadisticas':
            const expulsiones = chat.antiArabeRegistros || []
            const porPais = {}
            
            expulsiones.forEach(exp => {
                porPais[exp.pais] = (porPais[exp.pais] || 0) + 1
            })
            
            let statsText = '╭─「 📊 *ESTADÍSTICAS ANTI-ÁRABE* 📊 」\n│\n'
            
            if (expulsiones.length === 0) {
                statsText += '│ 📭 No hay registros de expulsiones\n'
            } else {
                statsText += `│ 📈 Total expulsiones: ${expulsiones.length}\n`
                statsText += `│ 📅 Última expulsión: ${new Date(expulsiones[expulsiones.length-1].fecha).toLocaleDateString()}\n│\n`
                statsText += '│ 🌍 *Expulsiones por país:*\n'
                
                Object.entries(porPais)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .forEach(([pais, count], i) => {
                        statsText += `│ ${i+1}. ${pais}: ${count}\n`
                    })
            }
            
            statsText += '╰─◉'
            await m.react('📊')
            m.reply(statsText)
            break

        case 'lista':
        case 'paises':
            let listaText = '╭─「 🌍 *PAÍSES ÁRABES BLOQUEADOS* 🌍 」\n│\n'
            Object.entries(global.paisesArabes || {}).forEach(([id, info], i) => {
                listaText += `│ ${i+1}. ${info.nombre}\n`
                listaText += `│    Códigos: ${info.codigos.join(', ')}\n`
                listaText += `│    Región: ${info.region}\n│\n`
            })
            listaText += '╰─◉'
            await m.react('🌍')
            m.reply(listaText)
            break

        case 'limpiar':
            chat.antiArabeRegistros = []
            await m.react('🧹')
            m.reply('🧹 *Registros limpiados*\n\nSe han eliminado todos los registros de expulsiones.')
            break

        default:
            await m.react('❌')
            m.reply(`❌ Opción no válida. Use *${usedPrefix}antiarabe* para ver las opciones.`)
    }
}

handler.help = ['antiarabe [on/off/stats/lista/limpiar]']
handler.tags = ['group']
handler.command = /^(anti(arabe|árabe)|arabfilter)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler