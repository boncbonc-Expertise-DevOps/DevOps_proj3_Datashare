import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DownloadPasswordDto {
  @ApiProperty({
    description: 'Mot de passe du fichier (min 6 caractères)',
    example: 'secret1',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
