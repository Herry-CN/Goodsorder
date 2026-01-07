
import { SYNC_CHANNEL_NAME } from '../constants';

type SyncMessage = {
  type: 'ORDER_UPDATE' | 'PRODUCT_UPDATE';
  payload: any;
};

class SyncManager {
  private channel: BroadcastChannel;

  constructor() {
    this.channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }

  subscribe(callback: (msg: SyncMessage) => void) {
    this.channel.onmessage = (event) => callback(event.data);
  }

  broadcast(message: SyncMessage) {
    this.channel.postMessage(message);
  }

  unsubscribe() {
    this.channel.onmessage = null;
  }

  close() {
    this.channel.close();
  }
}

export const syncManager = new SyncManager();
