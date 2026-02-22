import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export type FilesStatusQuery = 'all' | 'active' | 'expired' | 'deleted';

export class ListFilesQueryDto {
  @IsOptional()
  @IsIn(['all', 'active', 'expired', 'deleted'])
  status?: FilesStatusQuery;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
