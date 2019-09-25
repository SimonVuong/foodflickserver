import io from 'socket.io';
// left off here. dont use jsonparser
import parser from 'socket.io-json-parser';

const handleBrokerMessage = (socketConn, obj) => socketConn.send(obj);

class PrinterService {
  broker;

  constructor(broker) {
    this.broker = broker;
  }

  openReceiverRegistration(webServer) {
    const socket = io.attach(webServer, {
      parser,
      // allowRequest: (req, fn) => {
      //   console.log(req);
      //   fn(400, true);
      // },
      // allowUpgrades: false,
      serveClient: false
    });

    // FYI, there is a known issue where the same socket client sometimes makes mulitple connections on server restart.
    // this is why we can't generate custom socket connection ids equal to the receiver id. luckily, these random "ghost"
    // connections disappear on their own.
    socket.on('connect', async conn => {
      console.log(`[Socket] connected '${conn.id}'`);
      const receiverId = conn.handshake.query.id;
      conn.send('testing123');
      let isListening = await this.broker.listen(receiverId, json => handleBrokerMessage(conn, json));
      if (isListening) {
        console.log(`[Socket] '${conn.id}' listening for messages to '${receiverId}'`);
      } else {
        console.log(`[Socket] '${conn.id}' failed to listen for message to '${receiverId}'. Trying again in 5 seconds.`)
        // necessary because it's possible that upon receiver restart, that the receiver establishes a new socket
        // connection so fast that it triggers a broker consumption on Q <receiverId> before the previous socket
        // connection canceled the previous consumption
        setTimeout(async () => {
          isListening = await this.broker.listen(receiverId, obj => handleBrokerMessage(conn, obj));
          if (isListening) console.log(`[Socket] '${conn.id}' listening for messages to ${receiverId}`);
        }, 5000);
      }
      conn.once('disconnect', () => {
        console.log(`[Socket] ${conn.id} disconnected`);
        if (isListening) this.broker.cancelListen(receiverId);
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
