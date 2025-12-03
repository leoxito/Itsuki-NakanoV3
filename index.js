import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
import os from 'os'
import fs from 'fs'
import chalk from 'chalk'
import readline from 'readline'
import qrcode from 'qrcode-terminal'
import libPhoneNumber from 'google-libphonenumber'
import cfonts from 'cfonts'
import pino from 'pino'
import { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, jidNormalizedUser } from '@whiskeysockets/baileys'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import config from './config.js'
import { loadDatabase, saveDatabase, DB_PATH } from './lib/db.js'
import { watchFile } from 'fs'

const phoneUtil = (libPhoneNumber.PhoneNumberUtil || libPhoneNumber.default?.PhoneNumberUtil).getInstance()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global._filename = __filename

global.prefixes = Array.isArray(config.prefix) ? [...config.prefix] : []
global.owner = Array.isArray(config.owner) ? config.owner : []
global.opts = global.opts && typeof global.opts === 'object' ? global.opts : {}

if (!fs.existsSync("./tmp")) {
  fs.mkdirSync("./tmp");
}

// MOSTRAR BANNER DEL OTRO ARCHIVO (ItsukiStart.js)
console.log('')
const { say } = cfonts

// Título con gradiente rosado
say('ItsukiNakanoV3', {
  font: 'chrome',
  align: 'center',
  gradient: ['#FF69B4', '#FF1493', '#C71585'],
  independentGradient: true,
  transitionGradient: true
});

// Mensaje adicional rosado
say('BOT MULTI-DEVICE', {
  font: 'block',
  align: 'center',
  colors: ['#FF69B4'],
  background: 'transparent',
  letterSpacing: 2,
  lineHeight: 1,
  space: true,
  maxLength: '0',
  gradient: ['#FF69B4', '#FF1493']
});

console.log('')

const CONFIG_PATH = path.join(__dirname, 'config.js')
watchFile(CONFIG_PATH, async () => {
  try {
    const fresh = (await import('./config.js?update=' + Date.now())).default
    if (Array.isArray(fresh.prefix)) {
      global.prefixes = [...fresh.prefix]
    }
    if (Array.isArray(fresh.owner)) {
      global.owner = fresh.owner
    }

    const prefStr = Array.isArray(global.prefixes) && global.prefixes.length ? global.prefixes.join(' ') : '-'
    const ownersStr = Array.isArray(global.owner) && global.owner.length
      ? global.owner.map(o => Array.isArray(o) ? (o[0] || '') : (o || '')).filter(Boolean).join(', ')
      : '-'
    
    console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
    console.log(chalk.hex('#FF1493')(`┃   🔄 CONFIGURACIÓN ACTUALIZADA              ┃`))
    console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
    console.log(chalk.hex('#FF1493')(`┃ 📁 Archivo: ${chalk.white('config.js')}`))
    console.log(chalk.hex('#FF69B4')(`┃ 🎯 Prefijos: ${chalk.white(prefStr)}`))
    console.log(chalk.hex('#FF1493')(`┃ 👑 Owners: ${chalk.white(ownersStr)}`))
    console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
  } catch (e) {
    console.log(chalk.red('[Config] Error recargando config:', e.message))
  }
})

global.plugins = {}
global.commandIndex = {}
async function loadPlugins() {
  global.plugins = {}
  global.commandIndex = {}
  const PLUGIN_PATH = path.join(__dirname, 'plugins')
  if (!fs.existsSync(PLUGIN_PATH)) {
    console.log(chalk.red('[Plugins] Carpeta no encontrada:', PLUGIN_PATH))
    return
  }
  const entries = fs.readdirSync(PLUGIN_PATH)
  for (const entry of entries) {
    const entryPath = path.join(PLUGIN_PATH, entry)
    if (fs.statSync(entryPath).isDirectory()) {
      const files = fs.readdirSync(entryPath).filter(f => f.endsWith('.js'))
      for (const file of files) {
        const full = path.join(entryPath, file)
        await importAndIndexPlugin(full)
      }
    } else if (entry.endsWith('.js')) {
      await importAndIndexPlugin(entryPath)
    }
  }
  
  const total = Object.keys(global.plugins).length
  console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
  console.log(chalk.hex('#1E90FF')(`┃   📦 PLUGINS CARGADOS                       ┃`))
  console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
  console.log(chalk.hex('#1E90FF')(`┃ 🧩 Total: ${chalk.white(total)} plugins`))
  console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
}

async function importAndIndexPlugin(fullPath) {
  try {
    const mod = await import(pathToFileURL(fullPath).href + `?update=${Date.now()}`)
    const plug = mod.default || mod
    if (!plug) return
    plug.__file = path.basename(fullPath)
    if (Array.isArray(plug.command)) plug.command = plug.command.map(c => typeof c === 'string' ? c.toLowerCase() : c)
    else if (typeof plug.command === 'string') plug.command = plug.command.toLowerCase()
    global.plugins[plug.__file] = plug
    const cmds = []
    if (typeof plug.command === 'string') cmds.push(plug.command)
    else if (Array.isArray(plug.command)) cmds.push(...plug.command.filter(c => typeof c === 'string'))
    for (const c of cmds) {
      const key = c.toLowerCase()
      if (!global.commandIndex[key]) global.commandIndex[key] = plug
    }
  } catch (e) {
    const fname = path.basename(fullPath)
    console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
    console.log(chalk.hex('#FF0000')(`┃   ❌ ERROR AL CARGAR PLUGIN                 ┃`))
    console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
    console.log(chalk.hex('#FF1493')(`┃ 🧩 Plugin: ${chalk.white(fname)}`))
    console.log(chalk.hex('#FF69B4')(`┃ ⚠️  Error: ${chalk.white(e.message || e)}`))
    console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
  }
}

try { await loadDatabase() } catch (e) { console.log(chalk.red('[DB] Error cargando database:', e.message)) }

try {
  console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
  console.log(chalk.hex('#1E90FF')(`┃   💾 BASE DE DATOS                          ┃`))
  console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
  console.log(chalk.hex('#1E90FF')(`┃ 📁 Archivo: ${chalk.white(DB_PATH)}`))
  console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
} catch {}

await loadPlugins()
let handler
try { ({ handler } = await import('./handler.js')) } catch (e) { console.error('[Handler] Error importando handler:', e.message) }

try {
  const botDisplayName = (config && (config.botName || config.name || global.namebot)) || 'Bot'
  
  const packageJsonPath = path.join(__dirname, 'package.json')
  let packageJsonObj = {}
  try { const rawPkg = await fs.promises.readFile(packageJsonPath, 'utf8'); packageJsonObj = JSON.parse(rawPkg) } catch {}
  const ramInGB = os.totalmem() / (1024 * 1024 * 1024)
  const freeRamInGB = os.freemem() / (1024 * 1024 * 1024)
  const currentTime = new Date().toLocaleString()
  
  console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
  console.log(chalk.hex('#1E90FF')(`┃   🖥  INFORMACIÓN DEL SISTEMA                ┃`))
  console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
  console.log(chalk.hex('#FF1493')(`┃ 💻 ${chalk.white(`SO: ${os.type()}, ${os.release()} - ${os.arch()}`)}`))
  console.log(chalk.hex('#FF69B4')(`┃ 💾 ${chalk.white(`RAM Total: ${ramInGB.toFixed(2)} GB`)}`))
  console.log(chalk.hex('#1E90FF')(`┃ 💽 ${chalk.white(`RAM Libre: ${freeRamInGB.toFixed(2)} GB`)}`))
  console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))

  console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
  console.log(chalk.hex('#FF1493')(`┃   🟢 INFORMACIÓN DEL BOT                     ┃`))
  console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
  console.log(chalk.hex('#1E90FF')(`┃ 🍃 ${chalk.white(`Nombre: ${packageJsonObj.name || 'desconocido'}`)}`))
  console.log(chalk.hex('#FF1493')(`┃ 🔰 ${chalk.white(`Versión: ${packageJsonObj.version || '0.0.0'}`)}`))
  console.log(chalk.hex('#FF69B4')(`┃ 📜 ${chalk.white(`Descripción: ${packageJsonObj.description || ''}`)}`))
  console.log(chalk.hex('#1E90FF')(`┃ 👤 ${chalk.white(`Autor: ${(packageJsonObj.author && packageJsonObj.author.name) ? packageJsonObj.author.name : (packageJsonObj.author || 'N/A')}`)}`))
  console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))

  console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
  console.log(chalk.hex('#FF1493')(`┃   ⏰ HORA ACTUAL                             ┃`))
  console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
  console.log(chalk.hex('#1E90FF')(`┃ 🕒 ${chalk.white(`${currentTime}`)}`))
  console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
  
} catch (e) {
  console.log('[Banner] Error al mostrar banners:', e.message)
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(res => rl.question(question, ans => { rl.close(); res(ans) }))
}

async function chooseMethod(authDir) {
  const credsPath = path.join(authDir, 'creds.json')
  if (fs.existsSync(credsPath)) return 'existing'
  if (process.argv.includes('--qr')) return 'qr'
  if (process.argv.includes('--code')) return 'code'
  if (process.env.LOGIN_MODE === 'qr') return 'qr'
  if (process.env.LOGIN_MODE === 'code') return 'code'
  let ans
  do {
    console.clear()
    console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
    console.log(chalk.hex('#FF1493')(`┃   ⚙️  MÉTODO DE CONEXIÓN BOT                 ┃`))
    console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
    console.log(chalk.hex('#1E90FF')(`┃ 📲 ${chalk.yellow('1. Escanear Código QR')}`))
    console.log(chalk.hex('#FF1493')(`┃ 🔛 ${chalk.yellow('2. Código de Emparejamiento')}`))
    console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
    console.log(chalk.hex('#FF1493')('\n✨ Usa el código si tienes problemas con el QR'))
    console.log(chalk.hex('#FF69B4')('🚀 Ideal para la primera configuración\n'))
    ans = await ask(`${chalk.hex('#FF1493')('--->')} ${chalk.bold('Elige (1 o 2): ')}`)
  } while (!['1','2'].includes(ans))
  return ans === '1' ? 'qr' : 'code'
}

const PROCESS_START_AT = Date.now()

async function startBot() {
  const authDir = path.join(__dirname, config.sessionDirName || config.sessionName || global.sessions || 'sessions')
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const method = await chooseMethod(authDir)
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    browser: method === 'code' ? Browsers.macOS('Safari') : ['SuperBot','Chrome','1.0.0']
  })

  sock.__sessionOpenAt = sock.__sessionOpenAt || 0

  // LISTENER DE MENSAJES PRINCIPAL
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const since = sock.__sessionOpenAt || PROCESS_START_AT
      const graceMs = 5000
      const msgs = Array.isArray(chatUpdate?.messages) ? chatUpdate.messages : []
      const fresh = msgs.filter((m) => {
        try {
          const tsSec = Number(m?.messageTimestamp || 0)
          const tsMs = isNaN(tsSec) ? 0 : (tsSec > 1e12 ? tsSec : tsSec * 1000)
          if (!tsMs) return true
          return tsMs >= (since - graceMs)
        } catch { return true }
      })
      if (!fresh.length) return
      const filteredUpdate = { ...chatUpdate, messages: fresh }
      await handler?.call(sock, filteredUpdate)
    } catch (e) { console.error('[HandlerError]', e?.message || e) }
  })

  sock.ev.on('creds.update', saveCreds)

  try {
    setInterval(() => { saveDatabase().catch(() => {}) }, 60000)
    const shutdown = async () => { try { await saveDatabase() } catch {} process.exit(0) }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch {}

  async function ensureAuthDir() {
    try { if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true }) } catch (e) { console.error('[AuthDir]', e.message) }
  }

  async function generatePairingCodeWithRetry(number, maxAttempts = 5) {
    let attempt = 0
    while (attempt < maxAttempts) {
      try {
        await ensureAuthDir()
        return await sock.requestPairingCode(number)
      } catch (err) {
        const status = err?.output?.statusCode || err?.output?.payload?.statusCode
        const transient = status === 428 || err?.code === 'ENOENT' || /Connection Closed/i.test(err?.message || '') || /not open/i.test(err?.message || '')
        if (!transient) throw err
        attempt++
        const wait = 500 + attempt * 500
        console.log(chalk.hex('#FF69B4')(`[Pairing] Aún no listo (intentando de nuevo en ${wait}ms) intento ${attempt}/${maxAttempts}`))
        await new Promise(r => setTimeout(r, wait))
      }
    }
    throw new Error('No se pudo obtener el código tras reintentos')
  }

  let pairingRequested = false
  let pairingCodeGenerated = false
  let codeRegenInterface = null

  async function maybeStartPairingFlow() {
    if (method !== 'code') return
    if (sock.authState.creds.registered) return
    if (pairingRequested) return
    pairingRequested = true

    async function promptForNumber(initialMsg) {
      let attempts = 0
      let obtained = ''
      while (attempts < 5 && !obtained) {
        const raw = await ask(initialMsg)
        let cleaned = String(raw || '').trim()
        if (!cleaned) { console.log(chalk.red('[Pairing] Entrada vacía.')); attempts++; continue }
        cleaned = cleaned.replace(/\s+/g,'')
        if (!cleaned.startsWith('+')) cleaned = '+' + cleaned
        const valid = await isValidPhoneNumber(cleaned).catch(()=>false)
        if (valid) { obtained = cleaned.replace(/[^0-9]/g,''); break }
        console.log(chalk.yellow(`[Pairing] Número no válido: ${cleaned}. Intenta de nuevo.`))
        attempts++
      }
      return obtained
    }

    async function persistBotNumberIfNeeded(num) {
      try {
        if (!num) return
        const cfgPath = path.join(__dirname, 'config.js')
        const file = await fs.promises.readFile(cfgPath, 'utf8')
        let updated = file
        const patterns = [
          { re: /global\.botNumber\s*=\s*global\.botNumber\s*\|\|\s*['"].*?['"]\s*;?/m, repl: `global.botNumber = '${num}'` },
          { re: /global\.botNumber\s*=\s*['"].*?['"]\s*;?/m, repl: `global.botNumber = '${num}'` },
          { re: /botNumber\s*:\s*['"].*?['"]/m, repl: `botNumber: '${num}'` }
        ]
        for (const { re, repl } of patterns) {
          if (re.test(updated)) { updated = updated.replace(re, repl); break }
        }
        if (updated !== file) {
          await fs.promises.writeFile(cfgPath, updated)
          if (config) config.botNumber = num
          global.botNumber = num
          console.log(chalk.gray('[Config] botNumber guardado en config.js'))
        }
      } catch (e) {
        console.log(chalk.red('[Config] No se pudo actualizar botNumber:', e.message))
      }
    }

    let number = ''
    function primaryOwnerNumber() {
      const o = config.owner
      if (!o) return ''
      if (Array.isArray(o)) {
        const first = o[0]
        if (!first) return ''
        if (Array.isArray(first)) return (first[0] || '').toString()
        if (typeof first === 'string') return first
      }
      if (typeof o === 'string') return o
      return ''
    }
    const candidate = (config.botNumber ? config.botNumber.toString() : '').trim().replace(/[^0-9]/g,'') || primaryOwnerNumber().replace(/[^0-9]/g,'')
    if (candidate) {
      let confirm = await ask(`\n${chalk.cyan('Detectado número configurado:')} ${chalk.yellow('+'+candidate)} ${chalk.white('¿Usar este número? (si/no): ')}`)
      confirm = (confirm || '').trim().toLowerCase()
      if (/^(s|si|sí)$/.test(confirm)) {
        number = candidate
      } else if (!/^no$/.test(confirm)) {
        const retry = await ask(`${chalk.yellow('Escribe si o no: ')}`)
        if (/^(s|si|sí)$/i.test(retry.trim())) number = candidate
      }
    }
    if (!number) {
      console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
      console.log(chalk.hex('#FF1493')(`┃   📞 INGRESO DE NÚMERO WHATSAPP             ┃`))
      console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
      console.log(chalk.hex('#1E90FF')(`┃ ✨ Introduce tu número con prefijo de país`))
      console.log(chalk.hex('#FF1493')(`┃ 🔃 Ejemplo: +57321XXXXXXX`))
      console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
      number = await ask(`${chalk.hex('#FF1493')('--->')} ${chalk.bold('Número: ')}`)
      if (!number) {
        console.log(chalk.red('[Pairing] No se obtuvo un número válido. Reinicia con --code.'))
        pairingRequested = false
        return
      }
      await persistBotNumberIfNeeded(number)
    } else if (!config.botNumber || config.botNumber.replace(/[^0-9]/g,'') !== number) {
      await persistBotNumberIfNeeded(number)
    }

    const launchCodeGeneration = async () => {
      if (pairingCodeGenerated || sock.authState.creds.registered) return
      pairingCodeGenerated = true
      try {
        console.log(chalk.hex('#FF69B4')(`[Pairing] Generando código para +${number} ...`))
        const started = Date.now()
        const code = await generatePairingCodeWithRetry(number)
        const ms = Date.now() - started
        const formatted = code.match(/.{1,4}/g)?.join('-') || code
        console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
        console.log(chalk.hex('#FF1493')(`┃   🔐 CÓDIGO DE VINCULACIÓN                 ┃`))
        console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
        console.log(chalk.hex('#1E90FF')(`┃ ${chalk.bold.red(formatted)} ${chalk.gray(`(${ms} ms)`)}`))
        console.log(chalk.hex('#FF1493')(`┃ Whatsapp > Dispositivos vinculados`))
        console.log(chalk.hex('#FF69B4')(`┃ > Vincular con número de teléfono`))
        console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
        if (!codeRegenInterface) {
          codeRegenInterface = readline.createInterface({ input: process.stdin, output: process.stdout })
          console.log(chalk.hex('#FF1493')('\n✏️  Escribe "otra" si expiró el código para regenerar otro.'))
          codeRegenInterface.on('line', async () => {
            if (sock.authState.creds.registered) {
              console.log(chalk.green('[Pairing] Ya vinculado.'))
              try { codeRegenInterface.close() } catch {}
              return
            }
            pairingCodeGenerated = false
            try { codeRegenInterface.close() } catch {}
            codeRegenInterface = null
            setTimeout(launchCodeGeneration, 400)
          })
        }
      } catch (e) {
        console.error('[PairingCode Error]', e.message || e)
        pairingRequested = false
        pairingCodeGenerated = false
      }
    }

    if (sock?.ws?.readyState === 1) launchCodeGeneration()
    else {
      const total = Object.keys(global.plugins).length
      console.log(chalk.hex('#FF69B4')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
      console.log(chalk.hex('#1E90FF')(`┃   🧩 PLUGINS CARGADOS                       ┃`))
      console.log(chalk.hex('#FF69B4')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
      console.log(chalk.hex('#FF1493')(`┃ 🧩 Total: ${chalk.white(total)} plugins`))
      console.log(chalk.hex('#FF69B4')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
      setTimeout(() => { if (!pairingCodeGenerated) launchCodeGeneration() }, 6000)
    }
  }

  setTimeout(maybeStartPairingFlow, 2500)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr && method === 'qr') {
      console.clear()
      console.log(chalk.hex('#FF1493')('📱 Escanea este QR con WhatsApp (Dispositivos vinculados):'))
      try { qrcode.generate(qr, { small: true }) } catch { console.log(qr) }
      console.log(chalk.hex('#FF69B4')('🔑 Para usar código de emparejamiento: reinicia con --code'))
    }
    if (method === 'code' && !sock.authState.creds.registered && !pairingRequested) {
      setTimeout(maybeStartPairingFlow, 800)
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log(chalk.hex('#FF1493')('🔄 Conectando....'))
        startBot()
      } else {
        console.log(chalk.hex('#FF69B4')('[Sesión cerrada] Borra la carpeta de credenciales y vuelve a vincular.'))
      }
    } else if (connection === 'open') {
      try {
        sock.__sessionOpenAt = Date.now()
        const rawId = sock?.user?.id || ''
        const userJid = rawId ? jidNormalizedUser(rawId) : 'desconocido'
        const userName = sock?.user?.name || sock?.user?.verifiedName || 'Desconocido'
        console.log(chalk.hex('#00FF7F')('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
        console.log(chalk.hex('#00FF7F')(`┃   ✅ CONEXIÓN EXITOSA                        ┃`))
        console.log(chalk.hex('#00FF7F')('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
        console.log(chalk.hex('#00FF7F')(`┃ 👤 Conectado a: ${userName}`))
        console.log(chalk.hex('#00FF7F')('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
        const jid = rawId
        const num = jid.split(':')[0].replace(/[^0-9]/g,'')
        if (num && !config.botNumber && !global.botNumber) {
          try {
            const cfgPath = path.join(__dirname, 'config.js')
            const file = await fs.promises.readFile(cfgPath, 'utf8')
            let updated = file
            const emptyAssign = /global\.botNumber\s*=\s*(?:global\.botNumber\s*\|\|\s*)?['"]\s*['"]\s*;?/m
            if (emptyAssign.test(updated)) {
              updated = updated.replace(emptyAssign, `global.botNumber = '${num}'`)
            } else if (/botNumber\s*:\s*''/m.test(updated)) {
              updated = updated.replace(/botNumber\s*:\s*''/m, `botNumber: '${num}'`)
            }
            if (updated !== file) {
              await fs.promises.writeFile(cfgPath, updated)
              if (config) config.botNumber = num
              global.botNumber = num
              console.log(chalk.gray('[Config] botNumber autocompletado en config.js'))
            }
          } catch (e) {
            console.log(chalk.red('[Config] Error guardando botNumber auto:', e.message))
          }
        }
      } catch (e) {
        console.log(chalk.red('[Open] Error en post-conexión:', e.message))
      }
    }
  })

  // LISTENER DE ACTUALIZACIONES DE GRUPO
  sock.ev.on('group-participants.update', async (ev) => {
    try {
      const { id, participants, action } = ev || {}
      if (!id || !participants || !participants.length) return

    } catch (e) { 
      console.error('[GroupParticipantsUpdate]', e) 
    }
  })
}

startBot()

const PLUGIN_DIR = path.join(__dirname, 'plugins')
let __syntaxErrorFn = null
try { const mod = await import('syntax-error'); __syntaxErrorFn = mod.default || mod } catch {}
global.reload = async (_ev, filename) => {
  try {
    if (!filename || !filename.endsWith('.js')) return
    const filePath = path.join(PLUGIN_DIR, filename)
    if (!fs.existsSync(filePath)) {
      console.log(chalk.hex('#FF69B4')(`⚠️ El plugin '${filename}' fue eliminado`))
      delete global.plugins[filename]
      return
    }
    if (__syntaxErrorFn) {
      try {
        const src = await fs.promises.readFile(filePath)
        const err = __syntaxErrorFn(src, filename, { sourceType: 'module', allowAwaitOutsideFunction: true })
        if (err) {
          console.log(chalk.hex('#FF1493')(`❌ Error en plugin: '${filename}'`))
          console.log(chalk.hex('#FF69B4')(`🧠 Mensaje: ${err.message}`))
          console.log(chalk.hex('#1E90FF')(`📍 Línea: ${err.line}, Columna: ${err.column}`))
          return
        }
      } catch {}
    }
    await importAndIndexPlugin(filePath)
    console.log(chalk.hex('#00FF7F')(`✅ Recargado plugin '${filename}'`))
  } catch (e) {
    console.error('[ReloadPlugin]', e.message || e)
  }
}
try {
  fs.watch(PLUGIN_DIR, { recursive: false }, (ev, fname) => {
    if (!fname) return
    global.reload(ev, fname).catch(() => {})
  })
} catch {}

async function isValidPhoneNumber(number) {
  try {
    let n = number.replace(/\s+/g, '')
    if (n.startsWith('+521')) {
      n = n.replace('+521', '+52')
    } else if (n.startsWith('+52') && n[4] === '1') {
      n = n.replace('+52 1', '+52')
      n = n.replace('+521', '+52')
    }
    const parsed = phoneUtil.parseAndKeepRawInput(n)
    return phoneUtil.isValidNumber(parsed)
  } catch (error) {
    return false
  }
}