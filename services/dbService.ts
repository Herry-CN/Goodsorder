
import { Product, Order } from '../types';

class DatabaseService {
  async init(): Promise<void> {
    // Check if server is reachable
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Server not reachable');
      console.log('Connected to backend server');
    } catch (error) {
      console.error('Failed to connect to backend server:', error);
    }
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const response = await fetch(`/api/${storeName}`);
      if (!response.ok) throw new Error(`Failed to fetch ${storeName}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to get all from ${storeName}:`, error);
      return [];
    }
  }

  async put(storeName: string, data: any): Promise<void> {
    try {
      const response = await fetch(`/api/${storeName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to put to ${storeName}`);
    } catch (error) {
      console.error(`Failed to put data into ${storeName}:`, error);
      throw error;
    }
  }

  async delete(storeName: string, id: string): Promise<void> {
    try {
      const response = await fetch(`/api/${storeName}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Failed to delete from ${storeName}`);
    } catch (error) {
      console.error(`Failed to delete from ${storeName}:`, error);
      throw error;
    }
  }

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload file');
      
      const data = await response.json();
      return data.path; // Returns relative path like /uploads/filename.ext
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  async saveAll(storeName: string, items: any[]): Promise<void> {
    try {
      for (const item of items) {
        await this.put(storeName, item);
      }
    } catch (error) {
      console.error(`Failed to save all to ${storeName}:`, error);
      throw error;
    }
  }
}

export const dbService = new DatabaseService();
