import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { StockResponseDto } from './dto/stock-response.dto';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stock data' })
  @ApiResponse({ status: 200, description: 'List of stocks', type: [StockResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAll(): Promise<StockResponseDto[]> {
    return this.stockService.findAll();
  }
}
