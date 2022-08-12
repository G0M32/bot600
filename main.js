require('./settings')
const { default: cnfConnect, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require("@adiwajshing/baileys")
const { state, saveState } = useSingleFileAuthState(`./${sessionName}.json`)
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const yargs = require('yargs/yargs')
const chalk = require('chalk')
const FileType = require('file-type')
const { color, cnfLog } = require("./lib/color")
const figlet = require('figlet')
const path = require('path')
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/myfunc')
const moment = require('moment-timezone')

var low
try {
  low = require('lowdb')
} catch (e) {
  low = require('./lib/lowdb')
}

const { Low, JSONFile } = low
const mongoDB = require('./lib/mongoDB')

global.api = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '')

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(
  /https?:\/\//.test(opts['db'] || '') ?
    new cloudDBAdapter(opts['db']) : /mongodb/.test(opts['db']) ?
      new mongoDB(opts['db']) :
      new JSONFile(`database/database.json`)
)
global.db.data = {
    users: {},
    chats: {},
    database: {},
    game: {},
    settings: {},
    others: {},
    sticker: {},
    ...(global.db.data || {})
}

// save database every 30seconds
if (global.db) setInterval(async () => {
    if (global.db.data) await global.db.write()
  }, 30 * 1000)

async function startcnf() {
 console.log(color(figlet.textSync('ConfuBot\nVersion 5.2',{
font: 'Standard',
horizontalLayout: 'default',
vertivalLayout: 'default',
width: 80,
whitespaceBreak: false
}), 'cyan'))
console.log(color(`╔═════════════════════════╗` ,'white'))
console.log(color(`║ ` ,'white'), color(`✹ 𝙲𝚘𝚗𝚏𝚞𝙱𝚘𝚝-𝙼𝙳 ✹`, 'gold'))
console.log(color(`╠═════════════════════════╩═════════════════════════╗`, 'white'))
console.log(color(`║ `, 'white'), color(`[•]`, 'gold'), color(`Hola        : Usuario                        ║`, 'white'))
console.log(color(`║ `, 'white'), color(`[•]`, 'gold'), color(`Estado      : Online!                        ║`, 'white'))
console.log(color(`║ `, 'white'), color(`[•]`, 'gold'), color(`Bot Version : 1.2                            ║`, 'white'))
console.log(color(`║ `, 'white'), color(`[•]`, 'gold'), color(`Creado      : 29/7/22                        ║`, 'white'))
console.log(color(`╚═══════════════════════════════════════════════════╝`, 'white'))
    const cnf = cnfConnect({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['ConfuBot-MD5','Safari','1.0.0'],
        auth: state
    })

    store.bind(cnf.ev)
    
    // anticall auto block
    cnf.ws.on('CB:call', async (json) => {
    const callerId = json.content[0].attrs['call-creator']
    if (json.content[0].tag == 'offer') {
    let ffek = await cnf.sendContact(callerId, global.owner)
    cnf.sendMessage(callerId, { text: `*[❗] Sistema de bloqueo Automático*\n*¡No llames al bot❗*\n_Pregunta o comunícate con el propietario para desbloquearte_!`}, { quoted : ffek })
    await sleep(8000)
    await cnf.updateBlockStatus(callerId, "block")
    }
    })

    cnf.ev.on('messages.upsert', async chatUpdate => {
        //console.log(JSON.stringify(chatUpdate, undefined, 2))
        try {
        mek = chatUpdate.messages[0]
        if (!mek.message) return
        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        if (mek.key && mek.key.remoteJid === 'status@broadcast') return
        if (!cnf.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
        if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
        m = smsg(cnf, mek, store)
        require("./index")(cnf, m, chatUpdate, store)
        } catch (err) {
            console.log(err)
        }
    })
    
    // Group Update
    cnf.ev.on('groups.update', async pea => {
       //console.log(pea)
    // Get Profile Picture Group
       try {
       ppgc = await cnf.profilePictureUrl(pea[0].id, 'image')
       } catch {
       ppgc = 'https://shortlink.XeonBotIncarridho.my.id/rg1oT'
       }
       let lppgc = { url : ppgc }
       if (pea[0].announce == true) {
       cnf.send5ButImg(pea[0].id, `「 AJUSTES 」\n\n_El grupo ha sido cerrado por el administrador, ahora solo el administrador puede enviar mensajes_`, `${botname}`, lppgc, [])
       } else if(pea[0].announce == false) {
       cnf.send5ButImg(pea[0].id, `「 AJUSTES 」\n\n_El grupo ha sido abierto por el administrador, ahora los participantes pueden enviar mensajes_`, `${botname}`, lppgc, [])
       } else if (pea[0].restrict == true) {
       cnf.send5ButImg(pea[0].id, `「 AJUSTES 」\n\n_La información del grupo ha sido restringida, ahora solo el administrador puede editar la información del grupo_`, `${botname}`, lppgc, [])
       } else if (pea[0].restrict == false) {
       cnf.send5ButImg(pea[0].id, `「 AJUSTES 」\n\n_Ahora los participantes pueden editar la información del grupo_`, `${botname}`, lppgc, [])
       } else {
       cnf.send5ButImg(pea[0].id, `「 AJUSTES 」\n\nEl asunto del grupo se cambió a *${pea[0].subject}*`, `${botname}`, lppgc, [])
     }
    })
    
    //randoming function
function pickRandom(list) {
return list[Math.floor(list.length * Math.random())]
}
//document randomizer
let documents = [doc1,doc2,doc3,doc4,doc5,doc6]
let docs = pickRandom(documents)

    cnf.ev.on('group-participants.update', async (anu) => {
        console.log(anu)
        try {
            let metadata = await cnf.groupMetadata(anu.id)
            let participants = anu.participants
            for (let num of participants) {
                // Get Profile Picture User
                try {
                    ppuser = await cnf.profilePictureUrl(num, 'image')
                } catch {
                    ppuser = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg'
                }

                //Get Profile Picture Group\\
                try {
                    ppgroup = await cnf.profilePictureUrl(anu.id, 'image')
                } catch {
                    ppgroup = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg'
                }

//welcome\\
        let nama = await cnf.getName(num)
memb = metadata.participants.length
welcomeft = await getBuffer(`https://hardianto.xyz/api/welcome3?profile=${encodeURIComponent(ppuser)}&name=${encodeURIComponent(nama)}&bg=https://telegra.ph/file/d460e086f9f9bf6b04e17.jpg&namegb=${encodeURIComponent(metadata.subject)}&member=${encodeURIComponent(memb)}`)
//Welcmleft = await getBuffer(`https://hardianto.xyz/api/goodbye3?profile=${encodeURIComponent(ppuser)}&name=${encodeURIComponent(nama)}&bg=https://telegra.ph/file/d460e086f9f9bf6b04e17.jpg&namegb=${encodeURIComponent(metadata.subject)}&member=${encodeURIComponent(memb)}`)
                if (anu.action == 'add') {
    
                const bufferwlcm = await getBuffer(ppuser)
                let namein = num
                const fechain = moment.tz('America/Santiago').format('HH:mm:ss')
	            const datein = moment.tz('America/Santiago').format('DD/MM/YYYY')
	            const membersg = metadata.participants.length
                let docwel = {key: {fromMe: false,"participant":"0@s.whatsapp.net", "remoteJid": "916909137213-1604595598@g.us"}, "message": {orderMessage: {itemCount: 9999999,status: 200, thumbnail: welcomeft, surface: 200, message: `${metadata.subject}`, orderTitle: 'ConfuBot-MD', sellerJid: '0@s.whatsapp.net'}}, contextInfo: {"forwardingScore":999,"isForwarded":true},sendEphemeral: true}
				const fraw =['Estoy cansad@ de escuchar que siempre digan las mismas frases de "busca a alguien que te de paz", \n"si no te da tranquilidad no es la persona indicada". \n\nQuién quiere paz?\nA quién le gustan las relaciones lineadas y monótonas que viven en un punto exacto de equilibrio, \ndonde no existen los sube y baja? \nYo realmente no podría. \nYo necesito que mi relación sea una montaña rusa de emociones, \na veces en paz, otras guerra, hoy ganas de tú, mañana gano yo, \npasado toca empatar y empezar de cero, \npero siempre sin dejar de vivir. \nSon iguales de importantes los momentos de cariño cómo los de discusión. \nPorque sino fuera por las renconciliaciones donde el amor siempre sabe mejor, \nno tendría sentido nada, \nya la vida es demasiado monótona como para que las relaciones también lo sean\n\nMi consejo:\nSi te da paz y tranquilidad...ahí no es🤎','🌹Hazlo, comete errores, \nvuelve a intentarlo, \nfalla, manda todo a la mierda,\n y empieza otra vez si es necesario. \n\n     En serio, no pasa nada🩹☺️♥️','Siempre llega quien rompe todos tus miedos, \ntus inseguridades \ny hace que olvides el daño que alguna vez te hicieron, \ncon sus mimos, sus besos y abrazos, sus pequeños detalles que te alegran la vida y todo ese amor que guarda para hacerte feliz, \ny así, claro que te quedas🎆💜','“Donde hay amor, hay paz” ....\n\ndijeron alguna vez los labios de alguien\nHay personas que podrían estar de acuerdo...\n\nHay personas que lo \n     encontrarían confuso💜','🌹☕️Recuerda: \n\nNo importa que tan buena persona seas.\nTodos somos los malos en la historia de alguien.\nAsí que disfruta tu rol ,\ny al menos se un villano memorable✨','🍓La vida es como una caja de Pandora:\n\n    impredecible, \n        peligrosa, \n          y \n           llena de retos mentales y físicos♥','Una vez alguien me dijo:\n\nSi quieres que alguien te busque, deja de buscarle. \n\nSi quieres que alguien te quiera, deja de quererle. \n\nY si quieres que alguien regrese, \ndeja de rogarle....(ironías de la vida) \n\nY ahí entendí todo🤍✨','❌Cuidado con la gente que \nte acelere el corazón  sin tocarte.\n\n\nDuele el doble \ncuando desaparecen de golpe🥀','🌵✨El perdón te libera de la maldad ajena,\n aunque la otra persona no se arrepienta de lo que hizo...\n\nY tú perdonas porque sabes que es lo mejor para tu salud. \nPerdonar no es necesariamente olvidar. \nQuizás lo recuerdes por siempre, \npero sin tristeza ,\n ni amargura en el corazón💚✅𝗘𝗹',' 𝗔𝗺𝗼𝗿 𝗻𝗼 𝗱𝗲𝘀𝘁𝗿𝘂𝘆𝗲 𝗮 𝗹𝗮𝘀 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝘀...\n\n𝗟𝗮𝘀 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝘀 𝗱𝗲𝘀𝘁𝗿𝘂𝘆𝗲𝗻 𝗮 𝗹𝗮𝘀 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝘀🤍','♥️Las mujeres son como las canciones de Arjona....\n\nsi eres paciente y las escuchas, \nte darás cuenta \nde lo perfectas que son📀✨','📕Ꮮᗩ  ᗰᗩᏀᏆᗩ  ᗞᗴ  Ꮮᗴᗴᖇ ....\n\nᗴᔑᎢÁ  ᗴᑎ  ᗴᑎᑕᝪᑎᎢᖇᗩᖇ  ᖇᗴᖴᑌᏀᏆᝪ \n\n[ᗴᑎ  Ꮮᗩᔑ  ᏞᗴᎢᖇᗩᔑ  ᗞᗴ  ᝪᎢᖇᝪᔑ✍🏻♥️]','️☕️El café nunca se imaginó que podría tener un sabor tan suave,\nhasta que conoció el azúcar y la leche.\n\nTodos somos buenos individualmente,\npero nos volvemos mejores cuando nos\nmezclamos con las personas apropiadas🤎🤍','💡Todo el tiempo estamos diciendo\n "El físico no importa"...\n\npero no la pasamos leyendo o viendo (películas -series) ,donde los protagonistas son de cuerpos de infarto y belleza descomunal🌿','🪀Tenía la creencia de que si no te metías con nadie, nadie se metía contigo.\n\nPero no es así, \nporque hay gente a la que le molesta tu felicidad, \ntu físico, tu esencia, tus gustos, \nqué haces y que dejas de hacer✨🎍','♻️ Yo lo llamo “Karma”...\n\nPero la biblia dice :\n\n“Cosecharás lo que Siembras”🌱💚','⌛️El tiempo cura lo que el corazón destroza....\n\nY aun así,siguen hablando mal del tiempo y bien del amor💚🌿','🎈Aprende a soltar al amor de tu vida que según tú es el correcto pero en realidad ya se volvió costumbre,\n no te idealices con una persona si no has vivido nuevas experiencias con otras, \nno te cierres y pienses que los amores que vendrán son solo a medias. \nVive, date y quiérete♥️✨•','💘•\n\nMás que un lavado de manos,\nel mundo necesita un lavado de\n\n                                            CORAZÒN✨','Así como en la vida existe el\n" pasado, presente y futuro" ,\n\nen los sentimientos está el \n"perdona, olvida y continua"♥','🍎La vida es el eco, \nlo que envías es lo que regresa, \nlo que das es lo que recibes...\n\nPor eso nunca des a los demás \nlo que no quieras para ti ♥️✨','🌹Las personas sensibles tienen una característica:\n\nsufren mucho más que los demás, pero también se regocijan con intensidad similar de la felicidad ajena, disfrutándola como si fuera suya.\n\nLa sensibilidad es como la facultad de ver en un mundo de ciegos♥','SI FUERA LA PRIMERA VEZ:\n\nConoces los zapatos,que llevas puesto,no es la primera vez q te los pones.Ni la segunda.Y por eso al llegar a tu casa te las quita con ayuda del otro pie,ni siquiera te preocupas si se están ensuciando.\n\nPero si fuera la primera vez q te los pones,te los quitarías delicadamente.Solo si fuera la primera vez.Ahora no.Ahora llegas después de un día agotador y lanzas en teléfono  a la cama,pero si fuera nuevo lo dejarias en la mesa,y hasta tendrías miedo a que se raye.\n\nY lo mismo pasa con las personas ,con tu pareja,con la familia.\n\nSABEMOS QUE ESTAN ALLÍ ,\n  Y dejamos de mirarlos como si fuera\n        LA PRIMERA VEZ♥️','📸Somos una generación\nde fotos felices ,y corazones tristes🎞🥀','🌷𝗡𝗼 𝗱𝗲𝘀𝗲𝗼 𝗾𝘂𝗲 𝗹𝗮𝘀 𝗺𝘂𝗷𝗲𝗿𝗲𝘀 𝘁𝗲𝗻𝗴𝗮𝗻 𝗺𝗮𝘀 𝗽𝗼𝗱𝗲𝗿𝗲𝘀 𝘀𝗼𝗯𝗿𝗲 𝗹𝗼𝘀 𝗵𝗼𝗺𝗯𝗿𝗲𝘀....\n\n𝗦𝗶𝗻𝗼 𝗾𝘂𝗲 𝘁𝗲𝗻𝗴𝗮𝗻 𝗺á𝘀\n𝗣𝗢𝗗𝗘𝗥 𝘀𝗼𝗯𝗿𝗲 𝘀𝗶 𝗠𝗜𝗦𝗠𝗔𝗦🤍👑','💙No le digas a nadie que lo supere; ayúdale a superarlo.\n\nMuchas veces nos quedamos en el territorio del mero aliento o en el de las simples palabras de ánimo cuando, en realidad,\nlo que la otra persona necesita de ti es que te remangues y le ayudes de verdad a salir del pozo✨','☁️¿Alguna vez se han puesto mirar el cielo con atención?\n\n ¿Han notado que no parece real?\nParece una pintura,\nuna pintura de acuarelas💙🎨','El amor inmaduro dice: "te amo porque te necesito". El amor maduro dice: "te necesito porque te amo" (Erich Fromm)','La vida empieza cada cinco minutos (Andreu Buenafuente)','Donde las palabras fallan la música habla (Hans Christian Andersen)','Un buen viajante no tiene planes (Confucio)','Una vez aceptamos nuestros límites, vamos más allá de ello (Albert Einstein)','Lo que no nos mata nos hace más fuertes (Friedrich Nietzsche)','Si caminas solo, irás más rápido. Si caminas acompañado, llegarás más lejos.','Una vida llena de errores no solo es más honorable, sino que es más sabia que una vida gastada sin hacer nada','Es sencillo hacer que las cosas sean complicadas, pero difícil hacer que sean sencillas. F. Nietzsche','No pierdas nunca el sentido del humor y aprende a reírte de tus propios defectos','La preocupación es como una mecedora, te mantiene ocupado pero no te lleva a ninguna parte',' El hombre que más ha vivido no es aquel que más años ha cumplido, sino aquel que más ha experimentado la vida','Si lo puedes soñar, lo puedes hacer','Lo imposible es el fantasma de los tímidos y el refugio de los cobardes','El camino que nos toca recorrer está lleno de sorpresas. Nunca vas a estar preparado para las que te toquen a ti, sean dichosas o sombrías, pues eso es parte de adquirir experiencia. Y descubrir cuán gratas o desafortunadas son las que te esperan, es algo nunca podrás evadir','La felicidad no es algo que pospones para el futuro, es algo que diseñas para el presente','El amigo ha de ser como el dinero, que antes de necesitarle, se sabe el valor que tiene','Tus acciones serán el reflejo de la manera que tienes de ver la vida y las que te van definir ante los demás. No las malgastes en cosas y actitudes que no valen la pena, solo tú puedes decidir la forma en la que quieres que te recuerden, porque no estarás en este mundo para siempre','El amor es lo que mueve al mundo aunque a veces parezca lo contrario. A las personas no nos haría mal recordar esto de vez en cuando','Nunca terminas de conocer a la gente. Tus amigos, tu familia y hasta tú mismo, pueden ocultar sorpresas que en la vida te podrías haber imaginado, tanto buenas como malas','Todos tenemos el mismo destino, en esencia no hay manera de diferenciarnos si nacemos para llorar y reír. Recuérdalo, todos tenemos los días contados, vive cada uno de tus días como si fueran el regalo más grande, porque nadie puede asegurarte el mañana','Mientras vivas vas a encontrarte con todo tipo de personas, tanto buenas como malas. Es imposible adivinar las intenciones que oculta alguien detrás de su comportamiento, pero descubrirlo es la tarea más interesante y peligrosa con la que te puedes llegar a topar','Los tiempos felices en la humanidad son las páginas vacías de la historia','La decepción después de un amor fallido, puede llegar a oprimir tu corazón hasta el punto de no dejarte respirar. Pero nadie se ha muerto de amor','No llores por la gente que se ha ido, enfócate en quienes se encuentran a tu lado en el presente y quédate con los buenas recuerdos de los que se marcharon','No debes enfocarte en el dolor que puedes sentir si alguien te ha falla. Si no eres capaz de perdonar una equivocación, entiérrala y sigue adelante','Amar es la aventura más grande en la que te puedes embarcar. Porque te puede hacer volar más alto de lo que jamás imaginarte y también ponerte los pies de la tierra']
 				const frasew = fraw[Math.floor(Math.random() * fraw.length)]

                textbody = `┌─❖
│「 𝗛𝗶 👋 」
└┬❖ 「 @${namein.split("@")[0]} 」
   │✑  𝗕𝗶𝗲𝗻𝘃𝗲𝗻𝗶𝗱𝗼 𝗮
   │✑  ${metadata.subject}
   │✑  𝗨𝗻𝗮 𝗙𝗿𝗮𝘀𝗲 𝗽𝗮𝗿𝗮 𝘁𝗶✨  
   ┘  
_${frasew}_ 
   ┐
   └──────────────┈ ⳹`
let buttons = [
{buttonId: `plantillaw`, buttonText: {displayText: 'Plantilla📋👀'}, type: 1}
]
let buttonMessage = {
document: fs.readFileSync('./Media/theme/doc.xlsx'),
mimetype: docs,
jpegThumbnail:welcomeft,
mentions: [num],
fileName: `${metadata.subject}`,
fileLength: 99999999999999,
caption: textbody,
footer: `${botname}`,
buttons: buttons,
headerType: 4,
contextInfo:{externalAdReply:{
title: `${ownername}`,
body: `_No olvides leer la descripción del grupo_`,
mediaType:2,
thumbnail: welcomeft,
sourceUrl: `${websitex}`,
mediaUrl: `${websitex}`
}}
}
      linkft = ['https://i.ibb.co/dLssy8x/Confulogo.jpg']
       let lppgcc = { url : linkft }
cnf.send5ButImg(anu.id, `${textbody}`, `𝐂𝐨𝐧𝐟𝐮𝐁𝐨𝐭-𝐌𝐃5 𝐁𝐲 𝐂𝐨𝐧𝐟𝐮✨`, lppgcc, [])
//cnf.sendImage(anu.id, fs.readFileSync(`./Media/theme/bot.jpg), textbody, { quoted })
//cnf.send5ButImg(anu.id, textbody, `© ConfuMods 2021-2022`, cnf, [{"urlButton": {"displayText": "YouTube👀","url": `https://youtube.com/c/ConfuMods`}}])
//cnf.sendMessage(anu.id, buttonMessage, {quoted:docwel})
                }
            }
        } catch (err) {
            console.log(err)
        }
    })
	
  
    cnf.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }
    
    cnf.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = cnf.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    cnf.getName = (jid, withoutContact  = false) => {
        id = cnf.decodeJid(jid)
        withoutContact = cnf.withoutContact || withoutContact 
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = cnf.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === cnf.decodeJid(cnf.user.id) ?
            cnf.user :
            (store.contacts[id] || {})
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }
    
    cnf.sendContact = async (jid, kon, quoted = '', opts = {}) => {
	let list = []
	for (let i of kon) {
	    list.push({
	    	displayName: await cnf.getName(i + '@s.whatsapp.net'),
	    	vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await cnf.getName(i + '@s.whatsapp.net')}\nFN:${global.ownername}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click Aqui\nitem2.EMAIL;type=INTERNET:${global.ytname}\nitem2.X-ABLabel:YouTube\nitem3.URL:${global.socialm}\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${global.location};;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
	    })
	}
	cnf.sendMessage(jid, { contacts: { displayName: `${list.length} Contacto`, contacts: list }, ...opts }, { quoted })
    }
    
    cnf.setStatus = (status) => {
        cnf.query({
            tag: 'iq',
            attrs: {
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'status',
            },
            content: [{
                tag: 'status',
                attrs: {},
                content: Buffer.from(status, 'utf-8')
            }]
        })
        return status
    }
	
    cnf.public = true

    cnf.serializeM = (m) => smsg(cnf, m, store)

    cnf.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update	    
        if (connection === 'close') {
        let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason === DisconnectReason.badSession) { console.log(`Archivo de sesión con error, elimine la sesión y escanee de nuevo`); cnf.logout(); }
            else if (reason === DisconnectReason.connectionClosed) { console.log("[⚙️] Conexión terminada, reconectando...."); startcnf(); }
            else if (reason === DisconnectReason.connectionLost) { console.log("[⚙️] Conexión perdida del servidor, reconectando..."); startcnf(); }
            else if (reason === DisconnectReason.connectionReplaced) { console.log("[⚙️] Conexión reemplazada, otra nueva sesión abierta, cierre la sesión actual primero"); cnf.logout(); }
            else if (reason === DisconnectReason.loggedOut) { console.log(`[⚙️] Session finalizada, Por favor escanea el Qr de nuevo.`); cnf.logout(); }
            else if (reason === DisconnectReason.restartRequired) { console.log("[⚙️] Requiere Reiniciar, Reiniciando..."); startcnf(); }
            else if (reason === DisconnectReason.timedOut) { console.log("[⚙️] Conección terminada, Recolectando..."); startcnf(); }
            else cnf.end(`[⚙️] Motivo de desconexión desconocido: ${reason} | ${connection}`)
        }
        if (connection === 'connecting') {
        		console.log('Conectando...⏳')
}
        if (connection === 'open') {
        console.log('Conectado!')
        }
    })
   


    cnf.ev.on('creds.update', saveState)

   
    cnf.send5ButImg = async (jid , text = '' , footer = '', img, but = [], options = {}) =>{
        let message = await prepareWAMessageMedia({ image: img }, { upload: cnf.waUploadToServer })
        var template = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
        templateMessage: {
        hydratedTemplate: {
        imageMessage: message.imageMessage,
               "hydratedContentText": text,
               "hydratedFooterText": footer,
               "hydratedButtons": but
            }
            }
            }), options)
            cnf.relayMessage(jid, template.message, { messageId: template.key.id })
    }

    cnf.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
        let buttonMessage = {
            text,
            footer,
            buttons,
            headerType: 2,
            ...options
        }
        cnf.sendMessage(jid, buttonMessage, { quoted, ...options })
    }
    
    cnf.sendText = (jid, text, quoted = '', options) => cnf.sendMessage(jid, { text: text, ...options }, { quoted })

    cnf.sendImage = async (jid, path, caption = '', quoted = '', options) => {
	let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await cnf.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
    }

    cnf.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await cnf.sendMessage(jid, { video: buffer, caption: caption, gifPlayback: gif, ...options }, { quoted })
    }

    cnf.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await cnf.sendMessage(jid, { audio: buffer, ptt: ptt, ...options }, { quoted })
    }

   
    cnf.sendTextWithMentions = async (jid, text, quoted, options = {}) => cnf.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

    cnf.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options)
        } else {
            buffer = await imageToWebp(buff)
        }

        await cnf.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }

    cnf.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options)
        } else {
            buffer = await videoToWebp(buff)
        }

        await cnf.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }
	
    cnf.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
	let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename       
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    cnf.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
	}
        
	return buffer
     } 
    
   
    cnf.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
        let types = await cnf.getFile(path, true)
           let { mime, ext, res, data, filename } = types
           if (res && res.status !== 200 || file.length <= 65536) {
               try { throw { json: JSON.parse(file.toString()) } }
               catch (e) { if (e.json) throw e.json }
           }
       let type = '', mimetype = mime, pathFile = filename
       if (options.asDocument) type = 'document'
       if (options.asSticker || /webp/.test(mime)) {
        let { writeExif } = require('./lib/exif')
        let media = { mimetype: mime, data }
        pathFile = await writeExif(media, { packname: options.packname ? options.packname : global.packname, author: options.author ? options.author : global.author, categories: options.categories ? options.categories : [] })
        await fs.promises.unlink(filename)
        type = 'sticker'
        mimetype = 'image/webp'
        }
       else if (/image/.test(mime)) type = 'image'
       else if (/video/.test(mime)) type = 'video'
       else if (/audio/.test(mime)) type = 'audio'
       else type = 'document'
       await cnf.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options })
       return fs.promises.unlink(pathFile)
       }

    cnf.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let vtype
		if (options.readViewOnce) {
			message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
			vtype = Object.keys(message.message.viewOnceMessage.message)[0]
			delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
			delete message.message.viewOnceMessage.message[vtype].viewOnce
			message.message = {
				...message.message.viewOnceMessage.message
			}
		}

        let mtype = Object.keys(message.message)[0]
        let content = await generateForwardMessageContent(message, forceForward)
        let ctype = Object.keys(content)[0]
		let context = {}
        if (mtype != "conversation") context = message.message[mtype].contextInfo
        content[ctype].contextInfo = {
            ...context,
            ...content[ctype].contextInfo
        }
        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo ? {
                contextInfo: {
                    ...content[ctype].contextInfo,
                    ...options.contextInfo
                }
            } : {})
        } : {})
        await cnf.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
        return waMessage
    }

    cnf.cMod = (jid, copy, text = '', sender = cnf.user.id, options = {}) => {
		let mtype = Object.keys(copy.message)[0]
		let isEphemeral = mtype === 'ephemeralMessage'
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
		let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
		else if (content.caption) content.caption = text || content.caption
		else if (content.text) content.text = text || content.text
		if (typeof content !== 'string') msg[mtype] = {
			...content,
			...options
        }
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
		else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
		if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
		else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
		copy.key.remoteJid = jid
		copy.key.fromMe = sender === cnf.user.id

        return proto.WebMessageInfo.fromObject(copy)
    }



    cnf.send5ButImg = async (jid , text = '' , footer = '', img, but = [], thumb, options = {}) =>{
        let message = await prepareWAMessageMedia({ image: img, jpegThumbnail:thumb }, { upload: cnf.waUploadToServer })
        var template = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
        templateMessage: {
        hydratedTemplate: {
        imageMessage: message.imageMessage,
               "hydratedContentText": text,
               "hydratedFooterText": footer,
               "hydratedButtons": but
            }
            }
            }), options)
            cnf.relayMessage(jid, template.message, { messageId: template.key.id })
    }


    
        cnf.send5ButVid = async (jid , text = '' , footer = '', vid, but = [], options = {}) =>{
        let message = await prepareWAMessageMedia({ video: vid }, { upload: cnf.waUploadToServer })
        var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
        templateMessage: {
        hydratedTemplate: {
        videoMessage: message.videoMessage,
               "hydratedContentText": text,
               "hydratedFooterText": footer,
               "hydratedButtons": but
            }
            }
            }), options)
            cnf.relayMessage(jid, template.message, { messageId: template.key.id })
    }
    
    
    
            cnf.send5ButMsg = (jid, text = '' , footer = '', but = []) =>{
        let templateButtons = but
        var templateMessage = {
        text: text,
        footer: footer,
        templateButtons: templateButtons
        }
        cnf.sendMessage(jid, templateMessage)
        }



        cnf.sendListMsg = (jid, text = '', footer = '', title = '' , butText = '', sects = [], quoted) => {
        let sections = sects
        var listMes = {
        text: text,
        footer: footer,
        title: title,
        buttonText: butText,
        sections
        }
        cnf.sendMessage(jid, listMes, { quoted: quoted })
        }


    
        cnf.send5ButGif = async (jid , text = '' , footer = '', gif, but = [], options = {}) =>{
        let message = await prepareWAMessageMedia({ video: gif, gifPlayback: true }, { upload: cnf.waUploadToServer })
        var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
        templateMessage: {
        hydratedTemplate: {
        videoMessage: message.videoMessage,
               "hydratedContentText": text,
               "hydratedFooterText": footer,
               "hydratedButtons": but
            }
            }
            }), options)
            cnf.relayMessage(jid, template.message, { messageId: template.key.id })
    }


    /**
     * 
     * @param {*} path 
     * @returns 
     */
    cnf.getFile = async (PATH, save) => {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        //if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
        if (data && save) fs.promises.writeFile(filename, data)
        return {
            res,
            filename,
	    size: await getSizeMedia(data),
            ...type,
            data
        }

    }

    return cnf
}

startcnf()


let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Se actualizo ${__filename}`))
	delete require.cache[file]
	require(file)
})
