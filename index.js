// ==============================================
// 🌸 Itsuki Nakano Wabot V4 🌸
// ==============================================
// 🤖 Creado por: FzTeis
// 🎨 Adaptado para: Itsuki Nakano IA V4
// 👨‍💻 Usado por: leoxitoDev.xyz
// 🔧 Base: Baileys (@whiskeysockets/baileys = "npm:wileys")
// ⚡ Versión: ^NewUpdate | V4
// ==============================================

process.env.TMPDIR = './temp';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const os = require('os');
const database = require('./lib/database');
const speed = require('./lib/speed');

// Intentar cargar cfonts, si no existe, usar alternativa simple
let cfonts;
try {
  cfonts = require('cfonts');
} catch (error) {
  console.log(chalk.yellow('[ADVERTENCIA]'), 'Módulo cfonts no encontrado. Usando alternativa...');
  // Alternativa simple si cfonts no está instalado
  cfonts = {
    say: (text, options) => {
      console.log(chalk.magenta.bold(`\n🌸 ${text} 🌸\n`));
    }
  };
}

function limpiarBasura() {
  const tempDir = './temp';
  const subsDir = './Sesiones/Subbot';
  const sesionDir = './Sesion';

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  let tempCount = 0;
  for (const file of fs.readdirSync(tempDir)) {
    const filePath = path.join(tempDir, file);
    try {
      fs.unlinkSync(filePath);
      tempCount++;
    } catch {}
  }

  if (tempCount > 0) {
    console.log(
      chalk.bgBlue.white(' 🌸 Itsuki Nakano V4 :'),
      '📌 Se han eliminado',
      chalk.hex('#FFA500')(tempCount),
      '🗑 archivos de la carpeta',
      chalk.cyan(tempDir)
    );
  } else {
    console.log(
      chalk.bgBlue.white(' 🌸 Itsuki Nakano V4 :'),
       '📌 No se encontró basura en la carpeta',
      chalk.cyan(tempDir),
      '🗑 para eliminar.'
    );
  }

  let sesionCount = 0;
  for (const file of fs.readdirSync(sesionDir)) {
    if (file === 'creds.json') continue;
    const filePath = path.join(sesionDir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        sesionCount++;
      } else if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        sesionCount++;
      }
    } catch {}
  }

  if (sesionCount > 0) {
    console.log(
      chalk.bgBlue.white(' 🌸 Itsuki Nakano V4 :'),
      '🗑 Se han eliminado',
      chalk.hex('#FF4C4C')(sesionCount),
      '🗂 archivos de la carpeta',
      chalk.cyan(sesionDir)
    );
  } else {
    console.log(
      chalk.bgBlue.white(' 🌸 Itsuki Nakano V4 :'),
      '📌 No se encontró basura en la carpeta',
      chalk.cyan(sesionDir),
      '🗑 para eliminar.'
    );
  }

  let subbotsCount = 0;
  if (fs.existsSync(subsDir)) {
    for (const subbot of fs.readdirSync(subsDir)) {
      const subPath = path.join(subsDir, subbot);
      if (!fs.statSync(subPath).isDirectory()) continue;
      for (const file of fs.readdirSync(subPath)) {
        if (file === 'creds.json') continue;
        const filePath = path.join(subPath, file);
        try {
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            fs.unlinkSync(filePath);
            subbotsCount++;
          } else if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
            subbotsCount++;
          }
        } catch {}
      }
    }
  }

  if (subbotsCount > 0) {
    console.log(
      chalk.bgBlue.white(' 🌸 Itsuki Nakano V4 :'),
      '🗑 Se han eliminado',
      chalk.hex('#00FF7F')(subbotsCount),
      '🗂 archivos de las carpetas de subbots en',
      chalk.cyan(subsDir)
    );
  } else {
    console.log(
      chalk.bgBlue.white(' 🌸 Itsuki Nakano V4 :'),
      '📌 No se encontró basura en las carpetas de subbots en',
      chalk.cyan(subsDir),
      '🗑 para eliminar.'
    );
  }
}

const cleanup = speed.measurePerformance('cleanup', limpiarBasura);
cleanup();
setInterval(cleanup, 6 * 60 * 60 * 1000);

const cachedStart = speed.measurePerformance('bot-start', async () => {
  global.db = await database.init();
  global.getUser = database.getUser;
  global.updateUser = database.updateUser;
  global.getChat = database.getChat;
  global.updateChat = database.updateChat;

  console.log(chalk.magentaBright('\nฅ^•ﻌ•^ฅ ɪᴛsᴜᴋɪ ɴᴀᴋᴀɴᴏ ^ɴᴇᴡ-ᴜᴘᴅᴀᴛᴇ | ᴠ4'));

  // Mostrar banner con cfonts (o alternativa)
  cfonts.say('Itsuki Nakano', {
    font: 'block',
    align: 'center',
    gradient: ['#ff69b4', '#ff1493']
  });

  cfonts.say('Wabot V4', {
    font: 'console',
    align: 'center',
    gradient: ['#c71585', '#db7093']
  });

  // Mostrar créditos
  console.log(chalk.bold.magenta('🌸 Made With | Itsuki Nakano IA Wabot V4'));
  console.log(chalk.bold.magenta('📱 Copyright (C) - ') + chalk.bold.cyan('Made by leoxitoDev.xyz'));
  console.log(chalk.bold.magenta('🎀 Versión: ') + chalk.bold.green('^NewUpdate | V4'));
  console.log('');

  // Mostrar información del sistema
  const ramInGB = os.totalmem() / (1024 * 1024 * 1024);
  const freeRamInGB = os.freemem() / (1024 * 1024 * 1024);
  const currentTime = new Date().toLocaleString();

  const info = `\n╭─────────────────────────────◉
│ ${chalk.bgMagenta.white.bold('        🖥 INFORMACIÓN DEL SISTEMA        ')}
│「 💻 」${chalk.yellow(`SO: ${os.type()}, ${os.release()} - ${os.arch()}`)}
│「 💾 」${chalk.yellow(`RAM Total: ${ramInGB.toFixed(2)} GB`)}
│「 💽 」${chalk.yellow(`RAM Libre: ${freeRamInGB.toFixed(2)} GB`)}
╰─────────────────────────────◉

╭─────────────────────────────◉
│ ${chalk.bgMagenta.white.bold('        🌸 INFORMACIÓN DEL BOT        ')}
│「 🎀 」${chalk.cyan(`Nombre » Itsuki Nakano Wabot`)}
│「 🍡 」${chalk.cyan(`Versión » ^NewUpdate | V4`)}
│「 📚 」${chalk.cyan(`Descripción » WhatsApp Bot Multifuncional`)}
│「 👨‍💻 」${chalk.cyan(`Creador » FzTeis`)}
│「 🎨 」${chalk.cyan('Adaptador » leoxitoDev.xyz')}
╰─────────────────────────────◉

╭─────────────────────────────◉
│ ${chalk.bgMagenta.white.bold('        ⏰ HORA ACTUAL        ')}
│「 🕒 」${chalk.magenta(`${currentTime}`)}
╰─────────────────────────────◉\n`;

  console.log(info);

  console.log(chalk.blueBright('[🌸]'), chalk.green('✅ Iniciando main.js...\n'));

  const subprocess = spawn('node', ['main.js'], { stdio: 'inherit' });

  subprocess.on('exit', (code) => {
    console.log(chalk.redBright('[BOT]'), chalk.yellow(`🔜 main.js salió con el código ${code}`));
    console.log(chalk.magentaBright('[BOT]'), chalk.cyan('🔄 Reiniciando en 3 segundos...\n'));
    setTimeout(cachedStart, 3000);
  });

  subprocess.on('error', (err) => {
    console.log(chalk.bgRed.white('[ERROR]'), chalk.red(`❌ Ocurrió un error: ${err.message}`));
    console.log(chalk.gray('✐ Esperando 3 segundos antes de reiniciar...\n'));
    setTimeout(cachedStart, 3000);
  });
});

cachedStart();

setInterval(() => {
  const cacheStats = speed.getCacheStats();
  if (cacheStats.keys > 0) {
    console.log(
      chalk.gray('[CACHE]'),
      `🚀 Keys: ${cacheStats.keys}, Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}, Hit Rate: ${cacheStats.hitRate.toFixed(2)}%`
    );
  }
}, 300 * 1000);