import {
  IsNotEmpty,
  IsNumber,
  isObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Product name is required!' })
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  description: string;
  @IsString()
  @IsNotEmpty({ message: 'Product category is required' })
  categoryId: string;
  @IsNumber({}, { message: 'Product stock must be a number' })
  @IsOptional()
  stock: number;
  @IsNumber({}, { message: 'Product price must be a number' })
  @IsNotEmpty({ message: 'Product price is required' })
  price: number;
}
