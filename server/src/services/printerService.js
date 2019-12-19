import io from 'socket.io';
import parser from 'socket.io-json-parser';
import { getRestService } from './restService';

const handleBrokerMessage = (socketConn, obj) => socketConn.send(obj);

class PrinterService {
  broker;

  constructor(broker) {
    this.broker = broker;
  }

  openReceiverRegistration(webServer) {
    const socket = io(webServer, {
      parser,
      transports:	['websocket'],
      serveClient: false
    });

    socket.on('connect', async conn => {
      console.log(`[Socket] connected '${conn.id}'`);
      const receiverId = conn.handshake.query.id;
      let isListening = await this.broker.listen(receiverId, json => handleBrokerMessage(conn, json));
      const { profile, location } = await getRestService().getRestByRecieverId(receiverId)
      if (isListening) {
        console.log(`[Socket] '${conn.id}' listening for messages to '${receiverId}'`);
        conn.send({
          type: 'REST_DETAILS',
          data: {
            name: profile.name,
            address: location.address,
            phone: profile.phone,
          }
        });
      } else {
        console.log(`[Socket] '${conn.id}' failed to listen for message to '${receiverId}'. Trying again in 5 seconds`)
        // necessary because it's possible that upon receiver restart, that the receiver establishes a new socket
        // connection so fast that it triggers a broker consumption on Q <receiverId> before the previous socket
        // connection canceled the previous consumption
        setTimeout(async () => {
          isListening = await this.broker.listen(receiverId, obj => handleBrokerMessage(conn, obj));
          if (isListening) {
            console.log(`[Socket] '${conn.id}' listening for messages to ${receiverId}`);
            conn.send({
              type: 'REST_DETAILS',
              data: {
                name: profile.name,
                address: location.address,
                phone: profile.phone,
              }
            });
          } else {
            console.log(`[Socket] '${conn.id}' failed to listen for message to '${receiverId}'`)
          }
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

  printTickets(customerName, orderType, tableNumber, serverName, receiver, items) {
    return this.broker.send(receiver.receiverId,{
      type: 'TICKETS',
      data: {
        customerName,
        orderType,
        tableNumber,
        serverName,
        items,
      }
    });
  }

  printReceipts(customerName, orderType, tableNumber, serverName, receiver, items, costs) {
    return this.broker.send(receiver.receiverId, {
      type: 'RECEIPTS',
      data: {
        receiptPrinters: receiver.printers.filter(printer => printer.isReceipt),
        customerName,
        orderType,
        serverName,
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
