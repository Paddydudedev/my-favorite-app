const Markup = require('telegraf/markup');
const { dbHandlers } = require('./Controllers/dbHandlers');
const constants = require('./constants')
const { showBalance, getAddress } = require('./eth/handleEther');

exports.mainKeyboard = () => Markup.keyboard(['❖ Wallet', 'New Account']).resize().extra()
exports.backKeyboard = () => Markup.keyboard(['🔙 Return']).resize().extra()
exports.removeKeyboard = () => Markup.removeKeyboard().extra()

exports.existingAccountKeyboard = () => Markup.keyboard(['List']).resize().extra();

exports.optionsKeyboard = () => Markup.inlineKeyboard([
[
    Markup.callbackButton('♢ Receive Ether', 'receiveEth'),
    Markup.callbackButton('♢ Send Ether', 'sendEth')
],
[Markup.callbackButton('Select account', 'selectAccount')],
[Markup.callbackButton('Add new account', 'addAccount')],
[Markup.callbackButton('Remove this account', 'removeAccount')]
]).extra()

exports.sendingOptionsKeyboard = () => Markup.inlineKeyboard([
    [Markup.callbackButton('I have an address', 'sendWithAddress')],
    [Markup.callbackButton('I have QR code', 'sendWithQRCode')],
]).extra()

exports.exitKeyboard = () => Markup.keyboard(['🔙 Return', 'Exit']).resize().extra()

async function getNewArray (ctx) {
    let newArr = []
    let tempArr = []
    let {rows} = await dbHandlers.findPrivateKeyByUserId(ctx.from.id)
    //console.log(JSON.stringify)
    for(var i=0; i<rows.length; i++){
        var privKey = await constants.decrypt(rows[i].private_key.toString());
        console.log(privKey)
        let address = await getAddress(privKey.substring(2))
        newArr.push([Markup.callbackButton(address, privKey.substring(2))]);
        //tempArr.push("WOW");
    }
   // rows.map(key => newArr.push([Markup.callbackButton(`${constants.decrypt(key.private_key.toString())}`, `${constants.decrypt(key.private_key.toString())}`)]))
   //console.log("RETURNING "+JSON.stringify(newArr));
    return newArr;
}

exports.selectAccountKeyboard = async (ctx) =>{
    let newArr = await getNewArray(ctx)

    newArr.length > 1 ?
     ctx.reply('Choose an account below', Markup.inlineKeyboard(await getNewArray(ctx)).resize().extra()) :
     ctx.reply('You have only one account')
}