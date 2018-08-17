const Captcha = require('recaptcha2')
const recaptcha = new Captcha({
  siteKey: '6LfGJ0AUAAAAAM-K7ZLJMqWaI_ueGhxx3jzzVyLR',
  secretKey: '6LfGJ0AUAAAAAOvW0kne3xJgMwISOKrKRJWuT6cO'
})

module.exports = recaptcha
