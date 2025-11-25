import axios from 'axios'
import * as cheerio from 'cheerio'

const BASE_URL = 'https://pelisflix1.vip'
const PROXY_PREFIX = 'https://r.jina.ai/https://pelisflix1.vip'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
}

function buildProxyUrl(path) {
  if (!path.startsWith('/')) return `${PROXY_PREFIX}/${path}`
  return `${PROXY_PREFIX}${path}`
}

async function fetchViaProxy(path) {
  const url = buildProxyUrl(path)
  const res = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 20000 })
  return res.data
}

function extractMarkdown(rawContent) {
  const marker = 'Markdown Content:'
  const index = rawContent.indexOf(marker)
  if (index === -1) return rawContent
  return rawContent.slice(index + marker.length).trim()
}

function parseSearchResults(rawContent) {
  const markdown = extractMarkdown(rawContent)
  const results = []
  const seen = new Set()
  const regex = /\*\s+\[!\[[^\]]*\]\((?<poster>https?:\/\/[^)]+)\)\s*(?<rawTitle>[^\]]*?)\]\((?<link>https?:\/\/pelisflix1\.vip\/[^(\s)]+)\)/g
  let match

  while ((match = regex.exec(markdown)) !== null) {
    const { poster, rawTitle, link } = match.groups
    if (seen.has(link)) continue
    seen.add(link)

    const title = rawTitle.replace(/[-–—]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
    results.push({ title, link, poster })
  }
  return results
}

function parseMovieDetails(rawContent) {
  const markdown = extractMarkdown(rawContent)
  const titleMatch = rawContent.match(/Title:\s*(.+)/)
  const title = titleMatch ? titleMatch[1].replace(/^Ver\s*/i, '').trim() : ''

  const descriptionMatch = markdown.match(/\*\*Ver [^*]+\*\*:\s*([^\n]+)/)
  const description = descriptionMatch ? descriptionMatch[1].replace(/\*\*/g, '').trim() : ''

  const directorMatch = markdown.match(/Director:\s*\[([^\]]+)\]/)
  const director = directorMatch ? directorMatch[1].trim() : ''

  const genres = []
  const genreRegex = /\[([^\]]+)\]\(https?:\/\/pelisflix1\.vip\/genero\/[^(\s)]+\)/g
  let g
  while ((g = genreRegex.exec(markdown)) !== null) {
    const label = g[1].replace(/[,]/g, '').trim()
    if (label && !genres.includes(label)) genres.push(label)
  }

  const $ = cheerio.load('<div>' + markdown + '</div>')
  const paragraphs = $('div').text().split('\n').map(l => l.trim()).filter(Boolean)

  return { title, description, director, genres, extra: paragraphs.slice(0, 5) }
}

async function searchMovies(query) {
  try {
    const path = `/?s=${encodeURIComponent(query)}`
    const raw = await fetchViaProxy(path)
    return parseSearchResults(raw)
  } catch {
    return []
  }
}

async function getMovieDetails(url) {
  try {
    const u = url.startsWith('http') ? new URL(url) : new URL(url, BASE_URL)
    const path = `${u.pathname}${u.search}`
    const raw = await fetchViaProxy(path)
    return parseMovieDetails(raw)
  } catch {
    return null
  }
}

const pfCache = new Map()

async function openMovieByArg(m, conn, arg) {
  let target = null
  let poster = null
  if (/^https?:\/\//i.test(arg)) {
    target = arg
  } else if (/^\d{1,3}$/.test(arg)) {
    const idx = parseInt(arg) - 1
    const saved = pfCache.get(m.sender)
    if (saved && saved.results && saved.results[idx]) {
      target = saved.results[idx].link
      poster = saved.results[idx].poster || null
    }
  }
  if (!target) return { ok: false, why: 'invalid' }

  const details = await getMovieDetails(target)

  let msg = `🎄 *¡PELÍCULA NAVIDEÑA!* 🎅\n\n`
  msg += `> 🎁 *${details?.title || 'PELÍCULA'}*\n\n`

  if (details?.description) {
    msg += `> 🎀 *Descripción:*\n\`\`\`${details.description}\`\`\`\n\n`
  }

  if (details?.director) {
    msg += `> 🎥 *Director:*\n\`\`\`${details.director}\`\`\`\n\n`
  }

  if (details?.genres?.length) {
    msg += `> 🏷️ *Géneros:*\n\`\`\`${details.genres.join(', ')}\`\`\`\n\n`
  }

  msg += `🔗 *Link:*\n${target}\n\n`
  msg += `> 🎅 *¡Feliz Navidad con Itsuki Nakano V3!* 🎄`

  await conn.sendMessage(m.chat, {
    image: { url: poster || 'https://images.unsplash.com/photo-1546387903-6d82d96ccca6?w=500&auto=format&fit=crop&q=60' },
    caption: msg.trim(),
    contextInfo: global.rcanalr
  }, { quoted: m })

  return { ok: true }
}

let handler = async (m, { text, conn, usedPrefix, command }) => {
  const isOpen = /^(pfopen|pelisflixopen|peliculaopen)$/i.test(command)

  if (isOpen) {
    const arg = (text || '').trim()
    if (!arg) {
      return conn.reply(m.chat, `🎅 *¡NAVIDAD EN PELISFLIX!* 🎄

🎁 *ABRIR PELÍCULA NAVIDEÑA*

❌ *Uso incorrecto*

\`\`\`Debes proporcionar un número o URL\`\`\`

*Ejemplos navideños:*
• ${usedPrefix}pfopen 1
• ${usedPrefix}pfopen 5
• ${usedPrefix}pfopen https://pelisflix1.vip/pelicula/...

> 🎄 *¡Itsuki Nakano V3 - Tu asistente navideño!* 🎅`, m, global.rcanalw)
    }

    await m.react('🎁')
    const res = await openMovieByArg(m, conn, arg)

    if (!res.ok) {
      return conn.reply(m.chat, `🎅 *¡ERROR NAVIDEÑO!* 🎄

❌ *Formato inválido*

\`\`\`El número o URL proporcionado no es válido\`\`\`

*Sugerencias:*
• Vuelve a buscar la película
• Elige un número de la lista
• Verifica que la URL sea correcta

> 🎄 *¡Itsuki Nakano V3 te desea felices fiestas!* 🎅`, m, global.rcanalx)
    }

    await m.react('✅')
    return
  }

  if (!text) {
    return conn.reply(m.chat, `🎅 *¡BUSCADOR NAVIDEÑO!* 🎄

🎬 *PELISFLIX SEARCH*

❌ *Uso incorrecto*

\`\`\`Debes proporcionar el nombre de una película\`\`\`

*Ejemplos navideños:*
• ${usedPrefix + command} dune
• ${usedPrefix + command} mario
• ${usedPrefix + command} avatar

> 🎄 *¡Encuentra películas para disfrutar en Navidad!* 🎅`, m, global.rcanalw)
  }

  await m.react('🎞️')

  try {
    const results = await searchMovies(text)

    if (!results.length) {
      await m.react('❌')
      return conn.reply(m.chat, `🎅 *¡BÚSQUEDA NAVIDEÑA!* 🎄

🔍 *RESULTADOS*

❌ *No se encontraron resultados*

\`\`\`Intenta con otro nombre de película\`\`\`

*Sugerencias:*
• Verifica la ortografía
• Usa nombres completos
• Prueba con títulos en inglés

> 🎄 *¡Itsuki Nakano V3 - Tu ayuda en estas fiestas!* 🎅`, m, global.rcanalx)
    }

    pfCache.set(m.sender, { time: Date.now(), results })

    const MAX_TEXT = Math.min(results.length, 50)
    const listTxt = results.slice(0, MAX_TEXT).map((r, i) => `${i + 1}. ${r.title}\n${r.link}`).join('\n\n')

    let msg = `🎅 *¡RESULTADOS NAVIDEÑOS!* 🎄\n\n`
    msg += `🎁 *Total encontrado:*\n\`\`\`${results.length} películas\`\`\`\n\n`
    msg += `${listTxt}\n\n`
    msg += `🎀 *Siguiente paso:*\n\`\`\`Usa: ${usedPrefix}pfopen <número>\`\`\`\n\n`
    msg += `*Ejemplo:* ${usedPrefix}pfopen 1\n\n`
    msg += `> 🎄 *¡Itsuki Nakano V3 - Feliz Navidad!* 🎅`

    await conn.sendMessage(m.chat, {
      text: msg,
      contextInfo: global.rcanalr
    }, { quoted: m })

    await m.react('✅')

  } catch (error) {
    await m.react('❌')
    console.error('Error en pelisflix:', error)

    return conn.reply(m.chat, `🎅 *¡ERROR NAVIDEÑO!* 🎄

⚠️ *OCURRIÓ UN ERROR*

\`\`\`${error.message || 'Error desconocido'}\`\`\`

*Intenta de nuevo más tarde*

> 🎄 *¡Itsuki Nakano V3 - Tu asistente de confianza!* 🎅`, m, global.rcanalx)
  }
}

handler.before = async function (m) {
  return false
}

handler.help = ['pelisflix']
handler.tags = ['buscador']
handler.command = ['pelisflix', 'pf', 'pelicula', 'pfopen', 'pelisflixopen', 'peliculaopen']

export default handler