import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class UserDto {
  @ApiProperty({
    example: '1',
    description: 'User ID',
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  id: number;

  @ApiProperty({
    example: 'dev123@gmail.com',
    description: 'User email',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'pw123123',
    description: 'User PW',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    example: 'Ian',
    description: 'User Name',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  refreshToken: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}
