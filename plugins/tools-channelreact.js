import fetch from "node-fetch"

let handler = async (m, { conn, usedPrefix, command, args }) => {
  try {
    const key = "stellar-80NCvoDG"
    const url = args[0]
    const emogis = args.slice(1).join(" ")

    if (!url || !emogis) {
      await conn.sendMessage(m.chat, { 
        text: "⚙️ Uso correcto: " + usedPrefix + command + " https://whatsapp.com/channel/0029VbApwZ9ISTkEBb6ttS3F/01918 🍃, 🌱, 🥳, 🤣" 
      }, { quoted: m })
      return
    }

    const lista = emogis.split(",").map(e => e.trim()).filter(e => e)
    if (lista.length === 0 || lista.length > 4) {
      await conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } })
      await conn.sendMessage(m.chat, { 
        text: "> 🍃 Debes ingresar entre 1 y 4 emojis separados por coma" 
      }, { quoted: m })
      return
    }

    const reactParam = lista.join(", ")
    const apiUrl = `https://api.stellarwa.xyz/whatsapp/react-ch?url=${encodeURIComponent(url)}&react=${encodeURIComponent(reactParam)}&key=${key}`
    
    await conn.sendMessage(m.chat, { react: { text: '⏱️', key: m.key } })

    const res = await fetch(apiUrl)
    if (!res.ok) {
      await conn.sendMessage(m.chat, { react: { text: '❗', key: m.key } })
      await conn.sendMessage(m.chat, { 
        text: "> Error al conectar con la API" 
      }, { quoted: m })
      return
    }

    const json = await res.json()
    if (!json.status) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      await conn.sendMessage(m.chat, { 
        text: "> No se pudo enviar la reacción" 
      }, { quoted: m })
      return
    }

    await conn.sendMessage(m.chat, { react: { text: '✨️', key: m.key } })
    await conn.sendMessage(m.chat, { 
      text: ">✅️ Reacción Enviada Correctamente!" 
    }, { quoted: m })

  } catch (err) {
    console.error(err)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await conn.sendMessage(m.chat, { 
      text: "> Ocurrió un error inesperado" 
    }, { quoted: m })
  }
}

handler.help = ['react <url> <emoji1, emoji2, ...>']
handler.tags = ['tools']
handler.command = ['react', 'reaccionar']

export default handler