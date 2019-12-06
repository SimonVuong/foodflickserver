import rabbit from 'amqplib';
import { activeConfig } from '../config';

const SENDING_CHANNEL = 'sending';

class BrokerService {
  conn = null;
  // separate channel for sending + each consume because channels die easily. so if we put everyone on 1 channel and it
  // and it dies, then we lose all the consumers on that channel.
  channels = {};

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

  async openChannel(name) {
    try {
      if (this.channels[name]) {
        console.warn(`[Broker] channel '${name}' already exists`);
        return null;
      }
      console.log(`[Broker] channel '${name}' creating`);
      const channel = await this.conn.createChannel();
      channel.on('error', e => {
        console.error(`[Broker] channel '${name}' error`, e.message);
      });
      channel.on('close', async () => {
        console.log(`[Broker] channel '${name}' closed`);
        delete this.channels[name];
        if (name === SENDING_CHANNEL) {
          let isSendingChannelOpen = await this.openChannel(SENDING_CHANNEL);
          while (!isSendingChannelOpen) {
            isSendingChannelOpen = await this.openChannel(SENDING_CHANNEL);
          }
        }
      });
      console.log(`[Broker] channel '${name}' created`);
      this.channels[name] = channel;
      return channel;
    } catch (e) {
      console.error(`[Broker] channel '${name}' creation failed`, e.message);
      return null;
    }
  }

  async send(receiverId, obj) {
    try {
      await this.channels[SENDING_CHANNEL].checkQueue(receiverId);
    } catch (e) {
      console.error(`[Broker] enqueue to '${receiverId} failed since queue does not exist.`, e.message);
      return false;
    }
    this.channels[SENDING_CHANNEL].sendToQueue(receiverId, Buffer.from(JSON.stringify(obj)), {
      persistent: false,
    });
    return true;
  }

  async listen(receiverId, onReceive) {
    const channel = await this.openChannel(receiverId);
    if (!channel) return false;
    try {
      await channel.assertQueue(receiverId, {
        autoDelete: true,
      });
    } catch (e) {
      console.error('[Broker] assertQueue error', e);
      return false;
    }
    try {
      await channel.consume(
        receiverId,
        ({ content }) => {
          const obj = JSON.parse(content);
          onReceive(obj);
        },
        {
          consumerTag: receiverId,
          noAck: true,
          exclusive: true,
        }
      );
      console.log(`[Broker] consuming Q '${receiverId}'`)
    } catch (e) {
      console.error('[Broker] consuming error', e);
      return false;
    }
    return true;
  }

  async cancelListen(receiverId) {
    const channel = this.channels[receiverId];
    if (channel) {
      await channel.cancel(receiverId);
      channel.close();
    }
  }
}

let brokerService;

export const getBrokerService = async () => {
  if (brokerService) return brokerService;
  brokerService = new BrokerService();
  const connected = await brokerService.connect();
  if (connected) await brokerService.openChannel(SENDING_CHANNEL);
  return brokerService;
}
