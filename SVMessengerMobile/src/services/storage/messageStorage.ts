/**
 * Message Storage Service
 * Локално съхранение на съобщения за offline support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../../types/message';

const STORAGE_KEYS = {
  MESSAGES: (conversationId: number) => `messages_${conversationId}`,
  OFFLINE_QUEUE: 'offline_message_queue',
  LAST_SYNC: (conversationId: number) => `last_sync_${conversationId}`,
};

class MessageStorageService {
  /**
   * Save messages for a conversation
   */
  async saveMessages(conversationId: number, messages: Message[]): Promise<void> {
    try {
      const key = STORAGE_KEYS.MESSAGES(conversationId);
      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: number): Promise<Message[]> {
    try {
      const key = STORAGE_KEYS.MESSAGES(conversationId);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * Add message to offline queue
   */
  async addToOfflineQueue(message: Message & { conversationId: number }): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      queue.push({
        ...message,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  }

  /**
   * Get offline message queue
   */
  async getOfflineQueue(): Promise<Array<Message & { conversationId: number }>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  /**
   * Clear offline queue
   */
  async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  }

  /**
   * Save last sync timestamp
   */
  async saveLastSync(conversationId: number, timestamp: Date): Promise<void> {
    try {
      const key = STORAGE_KEYS.LAST_SYNC(conversationId);
      await AsyncStorage.setItem(key, timestamp.toISOString());
    } catch (error) {
      console.error('Error saving last sync:', error);
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSync(conversationId: number): Promise<Date | null> {
    try {
      const key = STORAGE_KEYS.LAST_SYNC(conversationId);
      const data = await AsyncStorage.getItem(key);
      return data ? new Date(data) : null;
    } catch (error) {
      console.error('Error getting last sync:', error);
      return null;
    }
  }

  /**
   * Clear all data for a conversation
   */
  async clearConversation(conversationId: number): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES(conversationId));
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC(conversationId));
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  }
}

export const messageStorage = new MessageStorageService();

