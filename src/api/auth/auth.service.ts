import { ForbiddenException, Injectable } from '@nestjs/common';
import { User } from '../entity';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from '../user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from '../user/dto/user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  //가입유무, 비밀번호 일치 확인
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new ForbiddenException('Unregistered user');
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw new ForbiddenException('The password you entered is incorrect.');
    }
    return user;
  }

  async validateRefresh(id: number, refreshToken: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new ForbiddenException('Unregistered user');
    }
    if (!user.refreshToken) {
      throw new ForbiddenException('Not Found RefreshToken');
    }
    const isRefreshMatching = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshMatching) {
      throw new ForbiddenException("Refresh Token doesn't match");
    }
    return user;
  }
  async generateAccessToken(userDto: UserDto) {
    const payload = {
      id: userDto.id,
      email: userDto.email,
      role: userDto.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('ACCESS_SECRET_KEY'),
      expiresIn: '20m',
    });
    return accessToken;
  }

  async generateRefreshToken(userDto: UserDto) {
    const payload = {
      id: userDto.id,
      email: userDto.email,
      role: userDto.role,
    };
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('REFRESH_SECRET_KEY'),
      expiresIn: '1h',
    });
    return refreshToken;
  }

  async loginServiceUser(userDto: UserDto) {
    const accessToken = await this.generateAccessToken(userDto);
    const refreshToken = await this.generateRefreshToken(userDto);
    const hashRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userDto.id, {
      refreshToken: hashRefreshToken,
    });
    return { accessToken, refreshToken };
  }
}
