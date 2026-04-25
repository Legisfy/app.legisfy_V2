require('dotenv').config();

const payload = {
  number: '5527999205531',
  text: 'Teste de ping via Node jsonOptions + text',
  options: {
    delay: 1200,
    presence: 'composing',
    linkPreview: false
  }
};

fetch('https://legisfy-evolution-api.hzesxq.easypanel.host/message/sendText/gabinete-c74f4d75', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': process.env.EVOLUTION_API_KEY
  },
  body: JSON.stringify(payload)
})
.then(res => res.json().then(data => ({status: res.status, data})))
.then(result => {
  console.log('Result text:', JSON.stringify(result, null, 2));
})
.catch(console.error);

const payload2 = {
  number: '5527999205531',
  textMessage: { text: 'Teste de ping via Node textMessage' },
  options: {
    delay: 1200,
    presence: 'composing',
    linkPreview: false
  }
};

fetch('https://legisfy-evolution-api.hzesxq.easypanel.host/message/sendText/gabinete-c74f4d75', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': process.env.EVOLUTION_API_KEY
  },
  body: JSON.stringify(payload2)
})
.then(res => res.json().then(data => ({status: res.status, data})))
.then(result => {
  console.log('Result textMessage:', JSON.stringify(result, null, 2));
})
.catch(console.error);
