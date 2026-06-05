import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Category name is required!' })
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  description: string;
}
