import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryResponseDto } from './dto/inventory-response.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get current inventory per silver type' })
  @ApiResponse({ status: 200, description: 'Inventory per silver type', type: [InventoryResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getInventory() {
    return this.inventoryService.getInventory();
  }
}
