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
        staleRes.end(JSON.stringify({
          message: `Received newer registration for ${receiverId}`,
        }));
        console.log(`Will update receiver ${receiverId}`)
      }
      res.status(200).set({
        connection: 'keep-alive',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
      });
      this.receivers[receiverId] = res;
      console.log('Saved receiver', receiverId);
    });
  }

  printOrder(signedInUser, receiver, items, costs) {
    const registeredReceiver = this.getRegisteredReceiver(receiver.receiverId);
    registeredReceiver.write(JSON.stringify({
      receiptPrinters: receiver.printers.filter(printer => printer.isReceipt),
      data: {
        customer: signedInUser.email,
        items,
        costs,
      }
    }))
  }

  getRegisteredReceiver (receiverId) {
    const receiver = this.receivers[receiverId];
    return receiver;
  }
}

let printerService;

export const getPrinterService = app => {
  if (printerService) return printerService;
  printerService = new PrinterService(app);
  printerService.openReceiverRegistration();
  return printerService;
}
