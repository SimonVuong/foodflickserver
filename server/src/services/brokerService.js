import rabbit from 'amqplib';
import { activeConfig } from '../config';

class BrokerService {
  conn = null;
  channel = null;

  constructor() {}

  async connect() {
    try {
      this.conn = await rabbit.connect(activeConfig.broker);
      console.log('[Broker] connected');
      this.conn.on('error', e => {
        if (e.message !== 'Connection closing') {
          console.error('[Broker] connection error', e.message);
        }
      });
      this.conn.on('close', () => {
        console.error('[Broker] reconnecting');
        setTimeout(this.connect.bind(this), 2000);
      });
      return true;
    } catch (e) {
      console.error('[Broker] connection failed', e.message);
      setTimeout(this.connect.bind(this), 2000);
      return false;
    }
  }

  async openSession() {
    try {
      console.log('[Broker] channel creating');
      this.channel = await this.conn.createChannel();
      this.channel.on('error', e => {
        console.error('[Broker] channel error', e.message);
      });
      this.channel.on('close', () => {
        console.log('[Broker] channel closed');
        setTimeout(this.openSession.bind(this), 2000);
      });
      console.log('[Broker] channel created');
    } catch (e) {
      console.error('[Broker] channel creation failed', e.message);
      this.closeConnOnErr(e);
    }
  }

  send(receiverId, obj) {
    this.channel.sendToQueue(receiverId, Buffer.from(JSON.stringify(obj)), {
      persistent: false,
    });
  }

  async listen(receiverId, onReceive) {
    try {
      await this.channel.assertQueue(receiverId, {
        autoDelete: true,
      });
    } catch (e) {
      console.error('[Broker] assertQueue error', e);
      this.closeConnOnErr(e);
      return false;
    }
    try {
      await this.channel.consume(
        receiverId,
        ({ content }) => {
          const json = JSON.parse(content);
          onReceive(json);
        },
        {
          consumerTag: receiverId,
          noAck: true,
          // decided against true because when true, channel dies if there is already another consumer of queue <receiverId>.
          // this is problematic even though we cancel the consume on socket disconnect, there's no guarantee that
          // the cancel finishes before the another socket reconnects and tries to re-consume on queue named <receiverId>
          exclusive: false,
        }
      );
      console.log(`[Broker] consuming Q: ${receiverId}`)
    } catch (e) {
      console.error('[Broker] consuming error', e);
      return false;
    }
    return true;
  }

  cancelListen(receiverId) {
    this.channel.cancel(receiverId);
  }

  closeConnOnErr(e) {
    if (!e) return false;
    console.error('[Broker] error', e);
    this.conn.close();
    return true;
  }
}

let brokerService;

export const getBrokerService = async () => {
  if (brokerService) return brokerService;
  brokerService = new BrokerService();
  const connected = await brokerService.connect();
  if (connected) await brokerService.openSession();
  return brokerService;
}
