/**
 * Sync Manager Service
 * Manages offline queue and syncs data with server
 */

import Store from 'electron-store';
import log from 'electron-log';
import { generateId } from '../../../shared/utils';
import { SYNC_STATUS } from '../../../shared/constants/APP_CONSTANTS';
import type { SyncQueueItem, SyncState } from '../../../shared/types';

const SYNC_QUEUE_KEY = 'sync_queue';

export class SyncManager {
  private store: Store;
  private syncState: SyncState;

  constructor(store: Store) {
    this.store = store;
    this.syncState = {
      status: SYNC_STATUS.IDLE,
      pendingItems: 0,
      failedItems: 0,
    };
  }

  /**
   * Start syncing pending items
   */
  async startSync(): Promise<void> {
    try {
      log.info('Starting sync');
      this.syncState.status = SYNC_STATUS.SYNCING;

      const queue = this.getQueue();
      
      for (const item of queue) {
        try {
          await this.syncItem(item);
        } catch (error) {
          log.error('Error syncing item:', error);
          this.markItemFailed(item.id, (error as Error).message);
        }
      }

      this.syncState.status = SYNC_STATUS.SUCCESS;
      this.syncState.lastSync = Date.now();
      
      log.info('Sync completed');
    } catch (error) {
      log.error('Error during sync:', error);
      this.syncState.status = SYNC_STATUS.ERROR;
      throw error;
    }
  }

  /**
   * Get sync status
   */
  getStatus(): SyncState {
    const queue = this.getQueue();
    this.syncState.pendingItems = queue.length;
    this.syncState.failedItems = queue.filter(item => item.error).length;
    return this.syncState;
  }

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<void> {
    const queue = this.getQueue();
    const failedItems = queue.filter(item => item.error);

    for (const item of failedItems) {
      try {
        await this.syncItem(item);
      } catch (error) {
        log.error('Error retrying item:', error);
      }
    }
  }

  /**
   * Get pending items
   */
  getPendingItems(): SyncQueueItem[] {
    return this.getQueue();
  }

  /**
   * Add item to queue
   */
  addToQueue(type: SyncQueueItem['type'], data: unknown): void {
    const queue = this.getQueue();
    
    const item: SyncQueueItem = {
      id: generateId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    queue.push(item);
    this.store.set(SYNC_QUEUE_KEY, queue);
  }

  /**
   * Get queue
   */
  private getQueue(): SyncQueueItem[] {
    return this.store.get(SYNC_QUEUE_KEY, []) as SyncQueueItem[];
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    // TODO: Implement actual API calls based on item type
    log.info('Syncing item:', item.type, item.id);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    // Remove from queue on success
    this.removeFromQueue(item.id);
  }

  /**
   * Mark item as failed
   */
  private markItemFailed(id: string, error: string): void {
    const queue = this.getQueue();
    const updated = queue.map(item =>
      item.id === id
        ? { ...item, error, retryCount: item.retryCount + 1, lastAttempt: Date.now() }
        : item
    );
    this.store.set(SYNC_QUEUE_KEY, updated);
  }

  /**
   * Remove item from queue
   */
  private removeFromQueue(id: string): void {
    const queue = this.getQueue();
    const updated = queue.filter(item => item.id !== id);
    this.store.set(SYNC_QUEUE_KEY, updated);
  }
}

