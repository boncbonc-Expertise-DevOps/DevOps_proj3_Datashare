import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export type FilesStatusQuery = 'all' | 'active' | 'expired' | 'deleted';

export class ListFilesQueryDto {
  @ApiPropertyOptional({
    description: 'Filtre sur le statut des fichiers',
    enum: ['all', 'active', 'expired', 'deleted'],
    example: 'active',
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'active', 'expired', 'deleted'])
  status?: FilesStatusQuery;

  @ApiPropertyOptional({
    description: 'Numéro de page (>= 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Taille de page (1..100)',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
