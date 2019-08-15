class PrinterService {
  app;
  receivers = {};

  constructor(app) {
    this.app = app;
  }

  openReceiverRegistration() {
    this.app.use('/register-receiver', (req, res) => {
      const receiverId = req.query.id;
      if (this.receivers[receiverId]) {
        const staleRes = this.receivers[receiverId];
        staleRes.end(`Received newer registration for ${receiverId}`);
        console.log(`Will update receiver ${receiverId}`)
      }
      res.status(200).set({
        connection: 'keep-alive',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
      });

      // empty write to 'solidify' connection.
      // https://devcenter.heroku.com/articles/request-timeout#long-polling-and-streaming-responses
      res.write('1');

      // 50 seconds because heroku timesout in 55
      const heartbeat = setInterval(() => {
        res.write('1');
      }, 50000) // 50 seconds because heroku timesout in 30 seconds

      req.on('close', () => {
        // todo 0: think about how we should clear these from memory if it's NOT being replaced,
        // ex: restaurant stops using ff and removes receiver
        console.log(`${receiverId} req closed`);
        clearInterval(heartbeat)
      });
      req.on('end', () => {
        console.log(`${receiverId} req ended`);
        clearInterval(heartbeat)
      });

      this.receivers[receiverId] = res;
      console.log('Saved receiver', receiverId);
    });
  }

  printOrder(signedInUserName, tableNumber, receiver, items, costs) {
    const registeredReceiver = this.getRegisteredReceiver(receiver.receiverId);
    if (!registeredReceiver) throw new Error('Could not process order. Please verify with the manager that the receiver is properly setup');
    registeredReceiver.write(JSON.stringify({
      receiptPrinters: receiver.printers.filter(printer => printer.isReceipt),
      data: {
        customerName: signedInUserName,
        tableNumber,
        items,
        costs,
      }
    }))
  }

  getRegisteredReceiver (receiverId) {
    return this.receivers[receiverId];
  }
}

let printerService;

export const getPrinterService = app => {
  if (printerService) return printerService;
  printerService = new PrinterService(app);
  printerService.openReceiverRegistration();
  return printerService;
}
