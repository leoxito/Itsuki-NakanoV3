import { promises as fs } from 'fs'

const charactersFilePath = './src/database/characters[1].json'
const haremFilePath = './src/database/harem.json'

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('> ⓘ \`No se pudo cargar el archivo characters.json\`')
    }
}

async function saveCharacters(characters) {
    try {
        await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8')
    } catch (error) {
        throw new Error('> ⓘ \`No se pudo guardar el archivo characters.json\`')
    }
}

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        return []
    }
}

async function saveHarem(harem) {
    try {
        await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2))
    } catch (error) {
        throw new Error('> ⓘ \`No se pudo guardar el archivo harem.json\`')
    }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const userId = m.sender

    if (args.length < 2) {
        return conn.reply(m.chat, 
            `> ⓘ \`Uso:\` *${usedPrefix}${command} nombre del personaje @usuario*`,
            m
        )
    }

    const characterName = args.slice(0, -1).join(' ').toLowerCase().trim()
    let who = m.mentionedJid[0]

    if (!who) {
        return conn.reply(m.chat, '> ⓘ \`Debes mencionar a un usuario válido\`', m)
    }

    if (who === userId) {
        return conn.reply(m.chat, '> ⓘ \`No puedes regalarte un personaje a ti mismo\`', m)
    }

    try {
        const characters = await loadCharacters()
        const character = characters.find(c => c.name.toLowerCase() === characterName && c.user === userId)

        if (!character) {
            return conn.reply(m.chat, `> ⓘ \`No tienes el personaje:\` *${characterName}*`, m)
        }

        character.user = who
        await saveCharacters(characters)

        const harem = await loadHarem()
        const userEntryIndex = harem.findIndex(entry => entry.userId === who)

        if (userEntryIndex !== -1) {
            harem[userEntryIndex].characterId = character.id
            harem[userEntryIndex].lastClaimTime = Date.now()
        } else {
            const userEntry = {
                userId: who,
                characterId: character.id,
                lastClaimTime: Date.now()
            }
            harem.push(userEntry)
        }

        await saveHarem(harem)

        await conn.reply(m.chat, 
            `> ⓘ \`Has regalado a:\` *${character.name}*\n> ⓘ \`Para:\` *@${who.split('@')[0]}*`,
            m, 
            { mentions: [userId, who] }
        )
    } catch (error) {
        await conn.reply(m.chat, `> ⓘ \`Error:\` *${error.message}*`, m)
    }
}

handler.help = ['regalar']
handler.tags = ['gacha']
handler.command = ['regalar']
handler.group = true

export default handler