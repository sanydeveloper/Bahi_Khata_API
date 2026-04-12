import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { StockService } from './stock.service';
import { ExportService } from './export.service';
import { StockResponseDto } from './dto/stock-response.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly exportService: ExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all stock data' })
  @ApiResponse({ status: 200, description: 'List of stocks', type: [StockResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAll() {
    return this.stockService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new stock entry' })
  @ApiResponse({ status: 201, description: 'Stock created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateStockDto) {
    return this.stockService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a stock entry by id' })
  @ApiResponse({ status: 200, description: 'Stock updated' })
  @ApiResponse({ status: 404, description: 'Stock not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStockDto) {
    return this.stockService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock entry by id' })
  @ApiResponse({ status: 200, description: 'Stock deleted' })
  @ApiResponse({ status: 404, description: 'Stock not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.stockService.remove(id);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export stock ledger as Excel file' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Excel file downloaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportExcel(@Res() res: Response) {
    const buffer = await this.exportService.exportStocksToExcel();
    const filename = `stock-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
