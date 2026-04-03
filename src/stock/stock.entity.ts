import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ length: 50 })
  godown: string;

  @Column({ name: 'sell_buy', length: 10 })
  sellBuy: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  qty: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount: number;

  @Column({ name: 'customer_name', length: 255, nullable: true })
  customerName: string;

  @Column({ name: 'weight_chorsa', type: 'decimal', precision: 10, scale: 3, default: 0 })
  weightChorsa: number;

  @Column({ name: 'weight_bank999', type: 'decimal', precision: 10, scale: 3, default: 0 })
  weightBank999: number;

  @Column({ name: 'weight_kachi_silver', type: 'decimal', precision: 10, scale: 3, default: 0 })
  weightKachiSilver: number;

  @Column({ name: 'weight_bank_peti', type: 'decimal', precision: 10, scale: 3, default: 0 })
  weightBankPeti: number;

  @Column({ name: 'weight_total', type: 'decimal', precision: 10, scale: 3, nullable: true, insert: false, update: false })
  weightTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rate: number;

  @Column({ name: 'balance_total', type: 'decimal', precision: 15, scale: 2, nullable: true })
  balanceTotal: number;

  @Column({ name: 'avg_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  avgRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  bank: number;

  @CreateDateColumn()
  createdAt: Date;
}
