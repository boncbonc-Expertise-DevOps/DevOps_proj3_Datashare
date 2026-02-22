import { IsString, MinLength } from 'class-validator';

export class DownloadPasswordDto {
  @IsString()
  @MinLength(6)
  password!: string;
}
