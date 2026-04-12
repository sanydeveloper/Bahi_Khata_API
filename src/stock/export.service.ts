import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  constructor(private readonly dataSource: DataSource) {}

  async exportStocksToExcel(): Promise<ExcelJS.Buffer> {
    const rows = await this.dataSource.query('SELECT * FROM get_stocks()');
    const inventory = await this.dataSource.query('SELECT silver_type, current_stock FROM inventory_view ORDER BY silver_type');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bahi Khata API';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Stock Ledger', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    // ── Title Row ──────────────────────────────────────────────
    sheet.mergeCells('A1:V1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BAHI KHATA — STOCK LEDGER';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
    sheet.getRow(1).height = 36;

    // ── Generated Date Row ─────────────────────────────────────
    sheet.mergeCells('A2:V2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Generated on: ${new Date().toLocaleString('en-IN')}`;
    dateCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF595959' } };
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    sheet.getRow(2).height = 20;

    // ── Column Definitions ─────────────────────────────────────
    sheet.columns = [
      { key: 'id',                  width: 6  },
      { key: 'bill_no',             width: 10 },
      { key: 'date',                width: 14 },
      { key: 'godown',              width: 14 },
      { key: 'customer_name',       width: 22 },
      { key: 'amount',              width: 14 },
      { key: 'weight_chorsa',       width: 14 },
      { key: 'weight_bank999',      width: 14 },
      { key: 'weight_kachi_silver', width: 16 },
      { key: 'weight_bank_peti',    width: 14 },
      { key: 'weight_total',        width: 14 },
      { key: 'total_stock_kg',      width: 14 },
      { key: 'rate',                width: 12 },
      { key: 'avg_rate',            width: 12 },
      { key: 'booking_rate',        width: 14 },
      { key: 'booking_weight',      width: 14 },
      { key: 'balance_total',       width: 16 },
      { key: 'profit',              width: 12 },
      { key: 'net_profit',          width: 14 },
      { key: 'bank',                width: 14 },
      { key: 'created_at',          width: 20 },
    ];

    // ── Header Row ─────────────────────────────────────────────
    const headers = [
      '#', 'Bill No', 'Date', 'Godown', 'Customer',
      'Amount', 'Wt. Chorsa', 'Wt. Bank999', 'Wt. Kachi Silver', 'Wt. Bank Peti',
      'Wt. Total', 'Total Stock (kg)', 'Rate', 'Avg Rate',
      'Booking Rate', 'Booking Wt.', 'Balance', 'Profit', 'Net Profit',
      'Bank', 'Created At',
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFBDD7EE' } },
        bottom: { style: 'thin', color: { argb: 'FFBDD7EE' } },
        left:   { style: 'thin', color: { argb: 'FFBDD7EE' } },
        right:  { style: 'thin', color: { argb: 'FFBDD7EE' } },
      };
    });

    // ── Data Rows ──────────────────────────────────────────────
    const numericCols = new Set([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

    rows.forEach((r: any, index: number) => {
      const isBuy = r.bill_no?.startsWith('p');
      const rowData = [
        index + 1,
        r.bill_no,
        r.date ? new Date(r.date).toLocaleDateString('en-IN') : '',
        r.godown,
        r.customer_name ?? '',
        r.amount != null ? parseFloat(r.amount) : '',
        r.weight_chorsa != null ? parseFloat(r.weight_chorsa) : '',
        r.weight_bank999 != null ? parseFloat(r.weight_bank999) : '',
        r.weight_kachi_silver != null ? parseFloat(r.weight_kachi_silver) : '',
        r.weight_bank_peti != null ? parseFloat(r.weight_bank_peti) : '',
        r.weight_total != null ? parseFloat(r.weight_total) : '',
        r.total_stock_kg != null ? parseFloat(r.total_stock_kg) : '',
        r.rate != null ? parseFloat(r.rate) : '',
        r.avg_rate != null ? parseFloat(r.avg_rate) : '',
        r.booking_rate != null ? parseFloat(r.booking_rate) : '',
        r.booking_weight != null ? parseFloat(r.booking_weight) : '',
        r.balance_total != null ? parseFloat(r.balance_total) : '',
        r.profit != null ? parseFloat(r.profit) : '',
        r.net_profit != null ? parseFloat(r.net_profit) : '',
        r.bank ?? '',
        r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '',
      ];

      const dataRow = sheet.addRow(rowData);
      dataRow.height = 20;

      // Alternate row background
      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFDAE3F3';

      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top:    { style: 'hair', color: { argb: 'FFBDD7EE' } },
          bottom: { style: 'hair', color: { argb: 'FFBDD7EE' } },
          left:   { style: 'hair', color: { argb: 'FFBDD7EE' } },
          right:  { style: 'hair', color: { argb: 'FFBDD7EE' } },
        };

        if (numericCols.has(colNumber)) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
          }
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });

      // Highlight buy rows (bill starts with p) in light green, sell in light orange
      const rowColor = isBuy ? 'FFE2EFDA' : 'FFFFF2CC';
      dataRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
      dataRow.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: isBuy ? 'FF375623' : 'FF833C00' } };

      // Highlight profit cell in green if positive, red if negative
      const profitCell = dataRow.getCell(18);
      if (r.profit != null) {
        const profitVal = parseFloat(r.profit);
        profitCell.font = {
          name: 'Calibri', size: 10, bold: true,
          color: { argb: profitVal >= 0 ? 'FF375623' : 'FF9C0006' },
        };
        profitCell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: profitVal >= 0 ? 'FFC6EFCE' : 'FFFFC7CE' },
        };
      }
    });

    // ── Summary Row ────────────────────────────────────────────
    const lastRow = rows[rows.length - 1];
    const summaryRow = sheet.addRow([
      '', 'TOTALS', '', '', '',
      rows.reduce((s: number, r: any) => s + (parseFloat(r.amount) || 0), 0),
      '', '', '', '',
      rows.reduce((s: number, r: any) => s + (parseFloat(r.weight_total) || 0), 0),
      lastRow ? parseFloat(lastRow.total_stock_kg) || 0 : 0,
      '', '', '', '',
      lastRow ? parseFloat(lastRow.balance_total) || 0 : 0,
      '', lastRow ? parseFloat(lastRow.net_profit) || 0 : 0,
      '', '',
    ]);

    summaryRow.height = 24;
    summaryRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
      cell.border = {
        top:    { style: 'medium', color: { argb: 'FFBDD7EE' } },
        bottom: { style: 'medium', color: { argb: 'FFBDD7EE' } },
        left:   { style: 'thin',   color: { argb: 'FFBDD7EE' } },
        right:  { style: 'thin',   color: { argb: 'FFBDD7EE' } },
      };
      if (numericCols.has(colNumber) && typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    // Freeze header rows
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

    // ── Inventory Sheet ────────────────────────────────────────
    const invSheet = workbook.addWorksheet('Inventory', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    });

    // Title
    invSheet.mergeCells('A1:C1');
    const invTitle = invSheet.getCell('A1');
    invTitle.value = 'BAHI KHATA — INVENTORY SUMMARY';
    invTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    invTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    invTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
    invSheet.getRow(1).height = 36;

    // Generated date
    invSheet.mergeCells('A2:C2');
    const invDate = invSheet.getCell('A2');
    invDate.value = `Generated on: ${new Date().toLocaleString('en-IN')}`;
    invDate.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF595959' } };
    invDate.alignment = { horizontal: 'right', vertical: 'middle' };
    invDate.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    invSheet.getRow(2).height = 20;

    // Columns
    invSheet.columns = [
      { key: 'sr',            width: 8  },
      { key: 'silver_type',   width: 28 },
      { key: 'current_stock', width: 22 },
    ];

    // Header
    const invHeader = invSheet.addRow(['#', 'Silver Type', 'Current Stock (kg)']);
    invHeader.height = 28;
    invHeader.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFBDD7EE' } },
        bottom: { style: 'thin', color: { argb: 'FFBDD7EE' } },
        left:   { style: 'thin', color: { argb: 'FFBDD7EE' } },
        right:  { style: 'thin', color: { argb: 'FFBDD7EE' } },
      };
    });

    // Silver type label map
    const typeLabels: Record<string, string> = {
      chorsa:       'Chorsa',
      bank999:      'Bank 999',
      kachi_silver: 'Kachi Silver',
      bank_peti:    'Bank Peti',
    };

    let totalStock = 0;
    inventory.forEach((inv: any, index: number) => {
      const stock = inv.current_stock != null ? parseFloat(inv.current_stock) : 0;
      totalStock += stock;
      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFDAE3F3';
      const dataRow = invSheet.addRow([
        index + 1,
        typeLabels[inv.silver_type] ?? inv.silver_type,
        stock,
      ]);
      dataRow.height = 22;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top:    { style: 'hair', color: { argb: 'FFBDD7EE' } },
          bottom: { style: 'hair', color: { argb: 'FFBDD7EE' } },
          left:   { style: 'hair', color: { argb: 'FFBDD7EE' } },
          right:  { style: 'hair', color: { argb: 'FFBDD7EE' } },
        };
        cell.alignment = colNumber === 3
          ? { horizontal: 'right', vertical: 'middle' }
          : { horizontal: 'left', vertical: 'middle' };
        if (colNumber === 3 && typeof cell.value === 'number') {
          cell.numFmt = '#,##0.000';
        }
      });
    });

    // Total row
    const invTotal = invSheet.addRow(['', 'TOTAL STOCK', totalStock]);
    invTotal.height = 26;
    invTotal.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
      cell.border = {
        top:    { style: 'medium', color: { argb: 'FFBDD7EE' } },
        bottom: { style: 'medium', color: { argb: 'FFBDD7EE' } },
        left:   { style: 'thin',   color: { argb: 'FFBDD7EE' } },
        right:  { style: 'thin',   color: { argb: 'FFBDD7EE' } },
      };
      cell.alignment = colNumber === 3
        ? { horizontal: 'right', vertical: 'middle' }
        : { horizontal: 'center', vertical: 'middle' };
      if (colNumber === 3 && typeof cell.value === 'number') {
        cell.numFmt = '#,##0.000';
      }
    });

    invSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

    return workbook.xlsx.writeBuffer();
  }
}
