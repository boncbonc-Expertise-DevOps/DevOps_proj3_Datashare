import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: 'alice@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Mot de passe (min 8 caractères)',
    example: 'P4ssw0rd!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
