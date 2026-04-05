import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class InventoryService {
  constructor(private readonly dataSource: DataSource) {}

  async getInventory(): Promise<{ silver_type: string; current_stock: number }[]> {
    return this.dataSource.query('SELECT silver_type, current_stock FROM inventory_view ORDER BY silver_type');
  }
}
