import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email is not valid!' })
  @IsNotEmpty({ message: 'Email is required!' })
  email!: string;
  @IsNotEmpty({ message: 'Password is required!' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters!' })
  password!: string;
  @IsNotEmpty({ message: 'Name is required!' })
  @IsString()
  name!: string;
  @IsString()
  @IsOptional()
  phone?: string;
}
