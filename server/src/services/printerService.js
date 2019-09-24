import io from 'socket.io';
import parser from 'socket.io-json-parser';

class PrinterService {
  broker;
  socketConn;

  constructor(broker) {
    this.broker = broker;
  }

  openReceiverRegistration(webServer) {
    const socket = io(webServer, {
      parser,
      serveClient: false
    });

    socket.on('connect', async conn => {
      this.socketConn = conn;
      console.log('[Socket] connected', conn.id);
      const receiverId = conn.handshake.query.id;
      const isListening = await this.broker.listen(receiverId, (json => {
        console.log(`[Socket] ${conn.id} sending json type: ${json.type}` )
        this.socketConn.send(json);
      }).bind(this));
      if (isListening) console.log(`[Socket] ${conn.id} tied to Q: ${receiverId}`);
      conn.on('disconnect', () => {
        console.log('[Socket] disconnected', conn.id);
        this.broker.cancelListen(receiverId);
      });
    });
  }

  testPrinter(receiver, printer) {
    this.broker.send(receiver.receiverId, {
      type: 'TEST',
      data: {
        printer,
      }
    });
  }

  printTickets(signedInUserName, tableNumber, receiver, items) {
    this.broker.send(receiver.receiverId,{
      type: 'TICKETS',
      data: {
        customerName: signedInUserName,
        tableNumber,
        items,
      }
    });
  }

  printReceipts(signedInUserName, tableNumber, receiver, items, costs) {
    this.broker.send(receiver.receiverId, {
      type: 'RECEIPTS',
      data: {
        receiptPrinters: receiver.printers.filter(printer => printer.isReceipt),
        customerName: signedInUserName,
        tableNumber,
        items,
        costs,
      }
    });
  }
}

let printerService;

export const getPrinterService = broker => {
  if (printerService) return printerService;
  printerService = new PrinterService(broker);
  return printerService;
}
