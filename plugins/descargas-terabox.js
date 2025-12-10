import axios from 'axios';
import FormData from 'form-data';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

async function getTurnstileToken() {
    try {
        const response = await axios.post("https://api.nekolabs.web.id/tools/bypass/cf-turnstile", {
            "url": "https://www.teraboxfast.com",
            "siteKey": "0x4AAAAAACEmVld3mW71ziZP"
        }, {
            headers: {
                "Content-Type": "application/json",
                "User-Agent": USER_AGENT
            }
        });
        return response.data.result;
    } catch (error) {
        return null;
    }
}

/**
 * @param {string} videoUrl 
 * @param {string} turnstileToken 
 */
async function getTeraboxDownloadLink(videoUrl, turnstileToken) {
    const data = new FormData();
    data.append('url', videoUrl);
    data.append('cf-turnstile-response', turnstileToken);

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://get-api140030.teraboxfast.com/',
        headers: { 
            'User-Agent': USER_AGENT, 
            'Referer': 'https://www.teraboxfast.com/', 
            'Origin': 'https://www.teraboxfast.com',
            'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            ...data.getHeaders()
        },
        data : data
    };

    try {
        const response = await axios.request(config);

        if (response.data && response.data.data && response.data.data.download_link) {
            const downloadLink = response.data.data.download_link;
            const urlObj = new URL(downloadLink);
            const id = urlObj.searchParams.get('id');

            if (id) {
                const workerUrl = `https://get-hey.teraboxfast2.workers.dev/?id=${id}`;
                
                const workerConfig = {
                    method: 'get',
                    url: workerUrl,
                    headers: { 
                        'User-Agent': USER_AGENT, 
                        'Referer': 'https://www.teraboxfast.com/', 
                        'Origin': 'https://www.teraboxfast.com',
                        'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"'
                    }
                };

                const workerResponse = await axios.request(workerConfig);
                return workerResponse.data.direct_download;
            }
        }

        return null;
    } catch (error) {
        console.error('Error en la petición:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
        return null;
    }
}

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
    const q = text?.trim() || args?.[0];
    if (!q) return m.reply(`> *» Uso: ${usedPrefix + command} <link de terabox>*`);

    await m.react('🕛').catch(() => {});

    try {
        const token = await getTurnstileToken();
        if (!token) {
            await m.react('🔴').catch(() => {});
            return m.reply('> *No se pudo obtener el token de seguridad. Intenta más tarde.*');
        }

        const downloadLink = await getTeraboxDownloadLink(q, token);
        
        if (downloadLink) {
            await conn.sendMessage(m.chat, { 
                video: { url: downloadLink }, 
                caption: '𝘼𝙦𝙪𝙞 𝙏𝙞𝙚𝙣𝙚𝙨 𝙏𝙪 𝙑𝙞𝙙𝙚𝙤 𝘿𝙚 𝙏𝙚𝙧𝙖𝙗𝙤𝙭 📦', 
                mimetype: 'video/mp4' 
            }, { quoted: m });
            
            await m.react('✅').catch(() => {});
        } else {
            await m.react('🔴').catch(() => {});
            m.reply('> *No se pudo obtener el enlace de descarga. Verifica la URL o intenta de nuevo.*');
        }

    } catch (e) {
        console.error(e);
        await m.react('🔴').catch(() => {});
        m.reply(`Ocurrió un error: ${e.message || e}`);
    }
}

handler.help = ['terabox <link>'];
handler.tags = ['downloader'];
handler.command = ['terabox', 'tb'];

export default handler;