import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath, pathToFileURL } from 'url'
import fs from 'fs'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import { dirname } from 'path' 

global.__dirname = (url) => dirname(fileURLToPath(url));


//aquí los retirados👑🥀
global.retirado = [
['51906278352','RootBTFC',true]
];

/*habrán comandos especiales para los retirados algo q los identifique | nota ustedes pondrán los coamndos y q solo funcione para los retirados*/

// Configuraciones principales
global.roowner = ['51906278352', '51932884973']
global.owner = [
   ['51906278352', 'Root Botnet', true],
   ['5132884973', '𝐒𝐨𝐩𝐨𝐫𝐭𝐞 𝐱 𝐒𝐭𝐚𝐟𝐟 𝐈𝐭𝐬𝐮𝐤𝐢 👨🏻‍💻👑', true],
     ];

global.mods = ['51906278352', '51932884973']
global.suittag = ['51906278352', '51932884973']
global.prems = ['51906278352', '595972314588', '51921826291', '5216671548329']

// Información del bot 
global.libreria = 'Baileys'
global.baileys = 'V 6.7.9'
global.languaje = 'Español'
global.vs = '7.5.2'
global.vsJB = '5.0'
global.nameqr = 'Itsukiqr'
global.namebot = 'Itsuki-IA'
global.sessions = "Sessions/Principal"
global.jadi = "Sessions/SubBot"
global.ItsukiJadibts = true
global.Choso = true
global.prefix = ['.', '!', '/' , '#', '%']
global.apikey = 'ItsukiNakanoIA'
global.botNumber = '18482389332'
// Números y settings globales para varios códigos
global.packname = '𝗟𝗮 𝗠𝗲𝗷𝗼𝗿 𝗕𝗼𝘁 𝗗𝗲 𝗪𝗵𝗮𝘁𝘀𝗮𝗽𝗽 🫰🏻🤖'
global.botname = '🧋 𝐈 𝐓 𝐒 𝐔 𝐊 𝐈 - 𝐍 𝐄 𝐖 ❄️'
global.wm = '© 𝐋𝐞𝐨'
global.wm3 = '⫹⫺ 𝙈𝙪𝙡𝙩𝙞-𝘿𝙚𝙫𝙞𝙘𝙚 💻'
global.author = '👑 ᗰᗩᗪᗴ ᗷY ᒪᗴO 🧃'
global.dev = '© 𝙾𝚆𝙽𝙴𝚁-𝙻𝙴𝙾 𝙳𝙴𝚅 👑'
global.textbot = 'Itsuki-Nakano|IAV3 Leo'
global.etiqueta = '@Leo Xzsy'
global.gt = '© 𝐂𝐫𝐞𝐚𝐝𝐨 𝐏𝐨𝐫 𝐋𝐞𝐨𝐃𝐞𝐯 𝐈𝐭𝐬𝐮𝐤𝐢-𝐂𝐡𝐚𝐧 𝐓𝐡𝐞 𝐁𝐞𝐬𝐭 𝐁𝐨𝐭𝐬 𝐎𝐟 𝐖𝐡𝐚𝐭𝐬𝐚𝐩𝐩 🤖👑'
global.me = '🌨️ 𝙸𝚃𝚂𝚄𝙺𝙸 𝙽𝙰𝙺𝙰𝙽𝙾 𝙼𝙴𝚆 𝚄𝙿𝙳𝙰𝚃𝙴 ☃️'
global.listo = '*Aqui tiene*'
global.moneda = 'Yenes'
global.multiplier = 69
global.maxwarn = 3
global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment

// Enlaces oficiales del bot
global.gp1 = 'https://chat.whatsapp.com/EteP5pnrAZC14y9wReGF1V'
global.comunidad1 = 'https://chat.whatsapp.com/DeJvBuS7QgB3Ybp1BZulWL'
global.channel = 'https://whatsapp.com/channel/0029Vb4cQJu2f3EB7BS7o11M'
global.channel2 = 'https://whatsapp.com/channel/0029ValMlRS6buMFL9d0iQ0S'
global.md = 'https://github.com/xzzys26/Itsuki-Nakano'
global.correo = 'xzzysultra@gmail.com'

// Apis para las descargas y más
global.APIs = {
  ryzen: 'https://api.ryzendesu.vip',
  xteam: 'https://api.xteam.xyz',
  lol: 'https://api.lolhuman.xyz',
  delirius: 'https://delirius-apiofc.vercel.app',
  siputzx: 'https://api.siputzx.my.id', // usado como fallback para sugerencias IA
  mayapi: 'https://mayapi.ooguy.com'
}

global.APIKeys = {
  'https://api.xteam.xyz': 'YOUR_XTEAM_KEY',
  'https://api.lolhuman.xyz': 'API_KEY',
  'https://api.betabotz.eu.org': 'API_KEY',
  'https://mayapi.ooguy.com': 'may-f53d1d49'
}

// Endpoints de IA
global.SIPUTZX_AI = {
  base: global.APIs?.siputzx || 'https://api.siputzx.my.id',
  bardPath: '/api/ai/bard',
  queryParam: 'query',
  headers: { accept: '*/*' }
}


global.chatDefaults = {
  isBanned: false,
  sAutoresponder: '',
  welcome: true,
  autolevelup: false,
  autoAceptar: false,
  autosticker: false,
  autoRechazar: false,
  autoresponder: false,
  detect: true,
  antiBot: false,
  antiBot2: false,
  modoadmin: false,
  antiLink: true,
  antiImg: false,
  reaction: false,
  nsfw: false,
  antifake: false,
  delete: false,
  expired: 0,
  antiLag: false,
  per: [],
  antitoxic: false
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  try { import(pathToFileURL(file).href + `?update=${Date.now()}`) } catch {}
})

// Configuraciones finales
export default {
  prefix: global.prefix,
  owner: global.owner,
  sessionDirName: global.sessions,
  sessionName: global.sessions,
  botNumber: global.botNumber,
  chatDefaults: global.chatDefaults
}
