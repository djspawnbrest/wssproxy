require('dotenv').config()

const WS = require('ws')
const port = process.env.PORT || 9000
const target = 'ws://st-chat.shas.tel'
const wss = new WS.Server({ port })

wss.on('connection', function connection(inbound) {

  const outbound = new WS(target)
  const queue = []

  inbound.on('message', (message) => {
    if(outbound.readyState === WS.OPEN){
      outbound.send(message)
    }else{
      queue.push(message)
    }
  })

  outbound.on('message', (message) => {
    if(inbound.readyState === WS.OPEN)
      inbound.send(message)
  })

  outbound.on('open', () => {
    while(queue.length) {
      const m = queue.shift()
      outbound.send(m)
    }
  })

  let clean = false
  const cleanup = () => {
    if(clean) return

    console.log("Cleaning up connections")

    if(inbound.readyState === WS.OPEN)
      inbound.close()

    if(outbound.readyState === WS.OPEN)
      outbound.close()

    while(queue.length) {queue.shift()}

    clean = true
  }

  inbound.on('close', cleanup)
  outbound.on('close', cleanup)

  inbound.on('error', e => console.error(`inbound error: ${e}`))
  outbound.on('error', e => console.error(`outbound error: ${e}`))

});
