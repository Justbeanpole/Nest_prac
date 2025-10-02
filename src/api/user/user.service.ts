import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { User } from '../entity';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UserService {
  private logger = new Logger('SSE');
  constructor(
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
  ) {}

  //비밀번호 암호화
  async hashPassword(password: string): Promise<string> {
    try {
      const hashPassword = await bcrypt.hash(password, 10);
      this.logger.log('[user][hashPassword]', {
        data: {
          hashPassword,
        },
      });
      return hashPassword;
    } catch (e: any) {
      throw new Error(`[user][hashPassword] Error: ${e.message}`);
    }
  }

  //전체 조회
  async findAll() {
    return await this.userRepository.find();
  }

  //ID로 조회
  findOneById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  //Email로 조회
  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('This user already exists');
    }
    return user;
  }

  //User 생성
  create(createUserDto: CreateUserDto) {
    return this.userRepository.save(createUserDto);
  }

  //User 수정
  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  //User 삭제
  async remove(id: number) {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.userRepository.remove(user);
  }
}
