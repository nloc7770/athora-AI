import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  name?: string;

  @IsInt()
  @Min(5)
  @Max(120)
  @IsOptional()
  daily_goal_minutes?: number;

  @IsBoolean()
  @IsOptional()
  notifications_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  reminder_enabled?: boolean;
}
