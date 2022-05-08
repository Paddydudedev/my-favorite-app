const Telegraf = require('telegraf');
const Stage = require('telegraf/stage');
const {session} = require('telegraf');
const dotenv = require('dotenv');
const privateKeyScene = require('./Scenes/privateKeyScene');
const sendWithAddressScene = require('./Scenes/sendWithAddressScene');
const getMnemonicScene = require('./Scenes/getMnemonicScene');
const mnemonicScene = require('./Scenes/mnemonicScene');
const sendWithQRCodeScene = require('./Scenes/sendWithQRCodeScene');
const {existingAccountKeyboard, mainKeyboard, optionsKeyboard, selectAccountKeyboard } = require('./keyboards');
const { showBalance, getAddress } = require('./eth/handleEther');
const { dbHandlers } = require('./Controllers/dbHandlers');
const { get, set } = require('./Controllers/redisHandlers');
const { receiveAction, sendingOptionAction, removeAccount } = require('./botActions');
const addAccountScene = require('./Scenes/addAccountScene');
const constants = require('constants')

dotenv.config()

const bot = new Telegraf(process.env.BOT_TOKEN)

const stage = new Stage([privateKeyScene, sendWithAddressScene, sendWithQRCodeScene, addAccountScene, getMnemonicScene ,mnemonicScene])
bot.use(session())
bot.use(stage.middleware())

isAuth = async (ctx, next) => {
    console.log("STARTER");
    let sessionAddress
    try {
        let userCurrentAddress = `current_address:${ctx.from.id}`
        sessionAddress = await get(userCurrentAddress)
    } catch (e) {
        console.log(e)
        try {
            let { rows } = await dbHandlers.findPrivateKey(ctx.from.id)
            let privateKey = constants.decrypt(rows[0].private_key)
            console.log("GOT PrIVAte key")
            sessionAddress = await getAddress(privateKey)
        } catch (e) {
            console.log(e)
        }
    }
    if (sessionAddress) {
        let balance = await showBalance(sessionAddress)
        return ctx.reply(balance, optionsKeyboard())
    }
    next()
}

doesAccountExist = async (ctx, next) => {
    let sessionAddress
    try {
        let userCurrentAddress = `current_address:${ctx.from.id}`
        sessionAddress = await get(userCurrentAddress)
    } catch (e) {
        console.log(e)
    }
    if (!sessionAddress) {
        return ctx.reply('no accounts yet')
    }
    return next()
}

isLessThanFive = async (ctx, next) => {
    let { rows } = await dbHandlers.findAddressByID(ctx.from.id)
    if (rows[4]) {
        return ctx.reply('You cannot have more than five accounts')
    }
    return next()  
}

bot.start(async (ctx) => {  
    console.log("START IT ");
    let { rows } = await dbHandlers.findAddressByID(ctx.from.id); 
    console.log(JSON.stringify(rows[0]))
    if(rows.length > 0){
        console.log("LENGTH GOOD")
        await ctx.reply(`Welcome to the Telegram Crypto Trading App. Currently using account : `+rows[0].address, optionsKeyboard())
    } else {   
        await ctx.reply(`Welcofme to the Telegram Crypto Trading app. Get Started`, mainKeyboard())
    }
    await ctx.replyWithSticker('CAACAgIAAxkBAAEBHMNgaK0CrGPgywKRGYud8unuyPhLfgAC0AwAArTbOUvJjieRZ4UaQh4E')
})
bot.hears('❖ Wallet', isAuth, Stage.enter('privateKeyScene'))
bot.hears('📋 About', ctx => ctx.reply('Created bfkslajflkasjfklfy @cyrclone'))
bot.hears('Secrets', isAuth, Stage.enter('getMnemonicScene'))
bot.hears('New Account', Stage.enter('mnemonicScene'))

bot.action('receiveEth', doesAccountExist, ctx => receiveAction(ctx))
bot.action('sendEth', doesAccountExist, ctx => sendingOptionAction(ctx))

bot.action('selectAccount', doesAccountExist, async ctx => await selectAccountKeyboard(ctx))
bot.action('addAccount', isLessThanFive, Stage.enter('addAccountScene'))
bot.action('removeAccount', ctx => removeAccount(ctx))

bot.action('sendWithAddress', Stage.enter('sendWithAddressScene'))
bot.action('sendWithQRCode', Stage.enter('sendWithQRCodeScene'))

bot.on('callback_query', async ctx => {
    console.log("CALLBACK QUERE")
    let privateKey = ctx.callbackQuery.data
    try {
        let address = await getAddress(privateKey)
        let userCurrentAddress = `current_address:${ctx.from.id}`
        await set(userCurrentAddress, address)
        let balance = await showBalance(address)
        return ctx.reply(balance, optionsKeyboard())
    } catch {
        return
    }
})

bot.launch()