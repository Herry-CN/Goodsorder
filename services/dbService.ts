import { Product, Order } from '../types';

class DatabaseService {
  async init(): Promise<void> {
    // Call initialization endpoint to ensure tables exist
    try {
      const res = await fetch('/api/init');
      if (!res.ok) {
        let errorMsg = res.statusText;
        try {
          const err = await res.json();
          errorMsg = err.error || err.message || res.statusText;
        } catch (e) {
          // ignore json parse error
        }
        throw new Error(`Database initialization failed: ${errorMsg}`);
      }
      console.log('Database initialized and connected');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const response = await fetch(`/api/${storeName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${storeName}: ${response.statusText}`);
    }
    return await response.json();
  }

  async put(storeName: string, data: any): Promise<void> {
    const response = await fetch(`/api/${storeName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const err = await response.json();
        errorMsg = err.error || err.message || response.statusText;
      } catch (e) {
        // ignore
      }
      throw new Error(`Failed to put to ${storeName}: ${errorMsg}`);
    }
  }

  async delete(storeName: string, id: string): Promise<void> {
    const response = await fetch(`/api/${storeName}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete from ${storeName}: ${response.statusText}`);
    }
  }

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }
    
    const data = await response.json();
    return data.path;
  }

  async saveAll(storeName: string, items: any[]): Promise<void> {
    for (const item of items) {
      await this.put(storeName, item);
    }
  }
}

export const dbService = new DatabaseService();
