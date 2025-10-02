import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {} //CreateUserDto에서 상속 받아서 모든 속성이 선택사항으로 설정됨.
