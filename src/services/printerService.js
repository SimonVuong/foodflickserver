class PrinterService {
  app;
  receivers = {};

  constructor(app) {
    this.app = app;
  }

  forward() {
    this.app.use('/register-receiver', (req, res) => {
      const receiverId = req.query.id;
      if (this.receivers[receiverId]) {
        const staleRes = this.receivers[receiverId];
        staleRes.status(409).send(`Received newer registration for ${receiverId}`);
        console.log(`Updating receiver ${receiverId}`)
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

  getRestPrinter (receiverId) {
    const receiver = this.receivers[receiverId];
    receiver.print = receiver.write;
    return receiver;
  }
}

let printerService;

export const setupPrintForwarder = app => {
  printerService = new PrinterService(app);
  printerService.forward();
  return printerService;
};

export const getPrinterService = () => printerService;

export {
  getPrinterService
}