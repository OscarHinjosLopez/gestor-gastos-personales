import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private write<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors for now
    }
  }

  async getAll<T>(key: string): Promise<T[] | null> {
    return this.read<T[]>(key);
  }

  async put<T extends { id: string }>(key: string, item: T): Promise<void> {
    const arr = (this.read<T[]>(key) || []) as T[];
    const idx = arr.findIndex((a) => a.id === item.id);
    if (idx >= 0) arr[idx] = item;
    else arr.push(item);
    this.write(key, arr);
  }

  async delete(key: string, id: string): Promise<void> {
    const arr = (this.read<{ id: string }[]>(key) || []) as { id: string }[];
    const filtered = arr.filter((a) => a.id !== id);
    this.write(key, filtered);
  }
}
