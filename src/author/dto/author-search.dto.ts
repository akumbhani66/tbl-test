import { IsOptional, IsString, IsInt, Min, Max, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthorSearchDto {
  @IsOptional()
  @IsString()
  @Length(1, 100, {
    message: 'Search query must be between 1 and 100 characters',
  })
  @Transform(({ value }) => value?.trim())
  query?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Transform(({ value }) => Number(value))
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Offset cannot be negative' })
  @Transform(({ value }) => Number(value))
  offset?: number;
}
