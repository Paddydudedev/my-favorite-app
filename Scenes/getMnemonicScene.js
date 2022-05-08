const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const { backKeyboard, mainKeyboard, optionsKeyboard } = require('../keyboards');
const { showBalance, getAddress } = require('../eth/handleEther');
const { dbHandlers } = require('../Controllers/dbHandlers');
const { hset, incr } = require('../Controllers/redisHandlers');
const { set } = require('../Controllers/redisHandlers');
const constants = require('../constants')


function encrypt(plainText, algorithm, key) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }
  
  function decrypt(encrypted, algorithm, key) {
    const decrypt = crypto.createDecipheriv(algorithm, key, iv);
    let text = decrypt.update(encrypted, 'base64', 'utf8');
    text += decrypt.final('utf8')
    return text;
  }

const cancelCommand = (ctx) => {
    ctx.reply('Hi! You can use me as a simple ether wallet. Save your private key here and I will be happy with it.', mainKeyboard())
    return ctx.scene.leave()
}

const step1 = async (ctx) => {
    ctx.reply('Enter your private key', backKeyboard())
    console.log("IN HERE");
    try {
        console.log("IN THIS PART 11");
        let { rows } = await dbHandlers.addPrivateKey(ctx.from.id)
       // await ctx.reply("YOUR SECRET "+rows[0])
    } catch (e) {
        console.log(e)
    }
    return ctx.wizard.next()
}

const step2 = new Composer()

step2.on('text', async (ctx) => {
console.log("IN HERE");
    try {
        console.log("IN THIS PART 11");
        let { rows } = await dbHandlers.findSecretBy(ctx.from.id)
        await ctx.reply("YOUR SECRET "+rows[0])
    } catch (e) {
        console.log(e)
    }

    let privateKey = ctx.update.message.text
    let currentStep = ctx.wizard.cursor
    if (privateKey === '🔙 Return') {
        return cancelCommand(ctx)
    }
    if (privateKey === '/cancel') {
        return cancelCommand(ctx)
    }
    let address



    return ctx.scene.leave()
})

module.exports = new WizardScene('getMnemonicScene', step1, step2)