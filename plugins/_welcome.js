// welcome.js

import { WAMessageStubType } from '@whiskeysockets/baileys';
import fetch from 'node-fetch';

/**
 * Función para formatear el número de miembro (ej: 1st, 2nd, 3rd, 4th)
 * @param {number} num - El número a formatear
 * @returns {string} El número formateado
 */
const formatMemberNumber = (num) => {
    if (num % 100 >= 11 && num % 100 <= 13) {
        return `${num}th`;
    }
    switch (num % 10) {
        case 1: return `${num}st`;
        case 2: return `${num}nd`;
        case 3: return `${num}rd`;
        default: return `${num}th`;
    }
};

/**
 * Función principal que se ejecuta antes de procesar otros eventos
 */
export async function before(m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return true;

    const chat = globalThis.db.data.chats[m.chat];
    if (!chat.welcome) return true;

    const userJid = m.messageStubParameters[0];
    const user = globalThis.db.data.users[userJid] || {};
    const name = user.name || await conn.getName(userJid);
    const ppUrl = await conn.profilePictureUrl(userJid, 'image')
        .catch(() => "https://files.catbox.moe/s41dnk.jpg");

    const actionUserJid = m.key.participant;
    const actionUserName = actionUserJid ? await conn.getName(actionUserJid) : null;

    // --- CÁLCULO DEL NÚMERO DE MIEMBRO ---
    let memberCount = participants.length;
    let memberNumberText = '';
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {
        memberCount += 1;
        memberNumberText = `Eres el ${formatMemberNumber(memberCount)} miembro`;
    } else if ([WAMessageStubType.GROUP_PARTICIPANT_REMOVE, WAMessageStubType.GROUP_PARTICIPANT_LEAVE].includes(m.messageStubType)) {
        memberNumberText = `Era el ${formatMemberNumber(memberCount + 1)} miembro`;
    }

    // --- INFORMACIÓN CLAVE ---
    const userNumber = userJid.split('@')[0];
    const groupId = m.chat;

    const actionMessages = {
        [WAMessageStubType.GROUP_PARTICIPANT_ADD]: actionUserName ? `\n┊✨ *Agregado por:* @${actionUserJid.split('@')[0]}` : '',
        [WAMessageStubType.GROUP_PARTICIPANT_REMOVE]: actionUserName ? `\n┊⚠️ *Eliminado por:* @${actionUserJid.split('@')[0]}` : '',
        [WAMessageStubType.GROUP_PARTICIPANT_LEAVE]: '┊👋 *Se fue por decisión propia*'
    };

    /**
     * Función para formatear el texto con las variables solicitadas
     * @param {string} template - El texto base
     * @returns {string} El texto formateado
     */
    const formatText = (template) => {
        return template
            // Variables del Usuario
            .replace('@user', `@${userJid.split('@')[0]}`) // Mención al usuario
            .replace('@name', name) // Nombre del usuario
            .replace('@userid', userJid) // ID del usuario
            .replace('@number', userNumber) // Número de teléfono
            // Variables del Grupo
            .replace('@group', groupMetadata.subject) // Nombre del grupo
            .replace('@groupid', groupId) // ID del grupo
            // Variables de Conteo
            .replace('@users', `${memberCount}`) // Total de miembros
            .replace('@membernum', memberNumberText) // "Eres el Xº miembro"
            // Variables de Acción y Tiempo
            .replace('@type', actionMessages[m.messageStubType])
            .replace('@date', new Date().toLocaleString('es-ES', { timeZone: 'America/Mexico_City' }));
    };

    // --- PLANTILLAS DE BIENVENIDA SIMPLIFICADAS ---
    const welcomeTemplates = {
        simple: `✨ ¡Bienvenido/a a @group!\n┊👤 @name (@user)\n┊🔢 @membernum\n┊👥 Ahora somos @users.`,
        detailed: `╔═══💫 *BIENVENIDO/A* 💫═══╗\n┊👤 *Usuario:* @name (@user)\n┊🆔 *ID:* @userid\n┊🔢 *Número:* @membernum\n┊🏠 *Grupo:* @group\n┊🆔 *ID del Grupo:* @groupid\n┊📅 *Fecha:* @date\n@type\n╚═══════════════════════╝`,
    };

    // --- PLANTILLAS DE DESPEDIDA SIMPLIFICADAS ---
    const byeTemplates = {
        simple: `👋 @name (@user) se ha ido.\n┊🔢 @membernum\n┊👥 Ahora somos @users.`,
        detailed: `╔═══👋 *DESPEGADA* 👋═══╗\n┊👤 *Usuario:* @name (@user)\n┊🆔 *ID:* @userid\n┊🔢 *Número:* @membernum\n┊🏠 *Grupo:* @group\n┊🆔 *ID del Grupo:* @groupid\n┊📅 *Fecha:* @date\n@type\n╚═══════════════════════╝`,
    };

    // Seleccionar la plantilla. Puedes cambiar 'detailed' por 'simple'
    const selectedWelcomeTemplate = chat.sWelcome || welcomeTemplates.detailed;
    const selectedByeTemplate = chat.sBye || byeTemplates.detailed;

    const welcomeMessage = formatText(selectedWelcomeTemplate);
    const byeMessage = formatText(selectedByeTemplate);

    const mentions = [userJid, actionUserJid].filter(Boolean);

    /**
     * Función para generar imagen usando la API externa
     */
    async function generateAPIImage() {
        try {
            const params = new URLSearchParams({
                username: name,
                guildName: groupMetadata.subject,
                memberCount: memberCount,
                avatar: ppUrl,
                background: "https://i.ibb.co/4YBNyvP/images-76.jpg",
                key: "rmF1oUJI529jzux8"
            });

            const apiUrl = `https://api-nv.ultraplus.click/api/generate/welcome2?${params.toString()}`;
            console.log('Solicitando imagen a la API:', apiUrl);

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
            const imageBuffer = await response.buffer();
            if (!imageBuffer || imageBuffer.length === 0) throw new Error('La API devolvió una imagen vacía.');
            
            console.log('Imagen generada exitosamente.');
            return imageBuffer;

        } catch (error) {
            console.error('Error al generar imagen con la API:', error);
            throw error;
        }
    }

    const fakeContext = {
        contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363403726798403@newsletter",
                serverMessageId: -1,
                newsletterName: "Miku Y Team"
            },
            externalAdReply: {
                title: '✧ Yotsuba IA ✧',
                body: 'Sistema de avisos del grupo',
                thumbnailUrl: "https://files.catbox.moe/s41dnk.jpg",
                mediaType: 1,
                renderLargerThumbnail: false,
                sourceUrl: "https://github.com/BRUNOBOTOFFICIAL"
            },
            mentionedJid: mentions
        }
    };

    // Manejar bienvenidas
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {
        try {
            const welcomeImageBuffer = await generateAPIImage();
            await conn.sendMessage(m.chat, { image: welcomeImageBuffer, caption: welcomeMessage, ...fakeContext }, { quoted: m });
        } catch (error) {
            console.error('Fallo al enviar imagen de bienvenida, enviando solo texto:', error);
            await conn.sendMessage(m.chat, { text: welcomeMessage, ...fakeContext }, { quoted: m });
        }
    }

    // Manejar despedidas
    if ([WAMessageStubType.GROUP_PARTICIPANT_LEAVE, WAMessageStubType.GROUP_PARTICIPANT_REMOVE].includes(m.messageStubType)) {
        try {
            const byeImageBuffer = await generateAPIImage();
            await conn.sendMessage(m.chat, { image: byeImageBuffer, caption: byeMessage, ...fakeContext }, { quoted: m });
        } catch (error) {
            console.error('Fallo al enviar imagen de despedida, enviando solo texto:', error);
            await conn.sendMessage(m.chat, { text: byeMessage, ...fakeContext }, { quoted: m });
        }
    }

    return true; // Importante: Devuelve true para no detener el flujo de otros comandos
}