const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const { backKeyboard, mainKeyboard, optionsKeyboard } = require('../keyboards');
const { showBalance, getAddress } = require('../eth/handleEther');
const { dbHandlers } = require('../Controllers/dbHandlers');
const { hset, incr } = require('../Controllers/redisHandlers');
const { set } = require('../Controllers/redisHandlers');
const ethers = require('ethers');
const constants = require('../constants')
const crypto = require('crypto');

const iv = Buffer.alloc(16); // zeroed-out iv

async function init() {
    const mnemonicWallet = ethers.Wallet.createRandom();
    var wallets = [mnemonicWallet]
    for(var i=0; i<4; i++){
        var tempWallet = ethers.Wallet.fromMnemonic(mnemonicWallet.mnemonic.phrase, "m/44'/60'/0'/0/"+(i+1)); 
        wallets.push(tempWallet);
    }
    /*console.log('address:', wallet.address)
    console.log('mnemonic:', wallet.mnemonic.phrase)
    console.log('privateKey:', wallet.privateKey)*/
    return wallets;
}


const cancelCommand = (ctx) => {
    ctx.reply('Hi! You can use me as a simple ether wallet. Save your private key here and I will be happy with it.', mainKeyboard())
    return ctx.scene.leave()
}

const step1 = async(ctx) => {
    console.log("HERE BUDDY")
    console.log("EHRE");
   // const mnemonic = randomWords(12);
    //mnemonic to private, public key and address
    const wallets = await init();
  //  console.log("MNMEONIC IS "+)
    const hw = await constants.encrypt(wallets[0].mnemonic.phrase.toString());
    dbHandlers.addSecret(ctx.from.id, hw);
    
    const privateKey = wallets[0].privateKey.toString();
    console.log("PRIVATE KET IS "+privateKey);
    let currentStep = ctx.wizard.cursor

    for(var i=0; i<wallets.length; i++){
        const privKey = await constants.encrypt(wallets[i].privateKey.toString());
        dbHandlers.addPrivateKey(ctx.from.id, privKey, wallets[i].address.toString());
    }
   // console.log("decoded: ", decrypt(hw, constants.algorithm, paddedKey).toString());
   // console.log("decoded: ", decrypt(privKey, constants.algorithm, paddedKey).toString());
    //decrypt(wallets[i].privateKey.toString(), constants.algorithm, paddedKey).toString()



    let address

    try {
        address = await getAddress(privateKey)
    } catch {
        await ctx.reply('ow key. try again')
        return ctx.wizard.selectStep(currentStep)
    }
    if (!address) {
        await ctx.reply('invalid address. try again')
        return ctx.wizard.selectStep(currentStep)
    }

    try {
        let userAddress = `address:${ctx.from.id}`
        let userCurrentAddress = `current_address:${ctx.from.id}`
        let userAddressKey = await incr('key:address')
        await hset(userAddress, userAddressKey, address)
        await set(userCurrentAddress, address)
    } catch (e) {
        console.log(e)
    }


    let balance
    try {
        balance = await showBalance(address)
    } catch (e) {
        console.log(e)
        await ctx.reply('cannot get balance. try again')
        return ctx.wizard.selectStep(currentStep)
    }
    if (!balance) {
        await ctx.reply('invalid address. try again')
        return ctx.wizard.selectStep(currentStep)
    }
    try {
        await ctx.reply('Your key was saved. Now you can receive payments or send a transaction.', mainKeyboard())
    } catch {
        return ctx.reply('Some error happened. Hit /cancel to return to the main menu')
    }
    await ctx.reply(balance, optionsKeyboard())

    return ctx.wizard.next()
}

const step2 = new Composer()

step2.on('text', async (ctx) => {
    let privateKey = ctx.update.message.text
    let currentStep = ctx.wizard.cursor
    if (privateKey === '🔙 Return') {
        return cancelCommand(ctx)
    }
    if (privateKey === '/cancel') {
        return cancelCommand(ctx)
    }
    let address

    try {
        address = await getAddress(privateKey)
    } catch {
        await ctx.reply('ow key. try again')
        return ctx.wizard.selectStep(currentStep)
    }
    if (!address) {
        await ctx.reply('invalid address. try again')
        return ctx.wizard.selectStep(currentStep)
    }

    try {
        let userAddress = `address:${ctx.from.id}`
        let userCurrentAddress = `current_address:${ctx.from.id}`
        let userAddressKey = await incr('key:address')
        await hset(userAddress, userAddressKey, address)
        await set(userCurrentAddress, address)
    } catch (e) {
        console.log(e)
    }

    try {
        console.log("IN THE OTHER PART");
        dbHandlers.addPrivateKey(ctx.from.id, privateKey, address)
    } catch (e) {
        console.log(e)
    }
    let balance
    try {
        balance = await showBalance(address)
    } catch (e) {
        console.log(e)
        await ctx.reply('cannot get balance. try again')
        return ctx.wizard.selectStep(currentStep)
    }
    if (!balance) {
        await ctx.reply('invalid address. try again')
        return ctx.wizard.selectStep(currentStep)
    }
    try {
        await ctx.reply('Your key was saved. Now you can receive payments or send a transaction.', mainKeyboard())
    } catch {
        return ctx.reply('Some error happened. Hit /cancel to return to the main menu')
    }
    await ctx.reply(balance, optionsKeyboard())
    return ctx.scene.leave()
})

module.exports = new WizardScene('mnemonicScene', step1, step2)