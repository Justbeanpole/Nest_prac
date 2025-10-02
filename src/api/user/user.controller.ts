import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { LocalServiceAuthGuard } from '../auth/guards/local-service.guard';
import { AuthService } from '../auth/auth.service';
import { JwtServiceAuthGuard } from '../auth/guards/jwt-service.guard';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtRefreshGuard } from '../auth/guards/jwt-refresh.guard';
import { Roles } from '../decorator/role.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserDto } from './dto/user.dto';
import { LoggerManager } from '@src/libs/LoggerManager.service';
import { Logger } from 'winston';

@ApiTags('User API')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: 'User 생성 API' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    //email 없으면 Error
    if (!createUserDto.email) {
      throw new BadRequestException('email is required');
    }
    //password 없으면 Error
    if (!createUserDto.password) {
      throw new BadRequestException('password is required');
    }
    //email로 User 찾기
    await this.userService.findOneByEmail(createUserDto.email);

    const hashPassword = await this.userService.hashPassword(
      createUserDto.password,
    );
    createUserDto.password = hashPassword;

    return await this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: 'User Login' })
  @UseGuards(LocalServiceAuthGuard)
  @ApiBody({ type: LoginUserDto })
  @Post('/login')
  async login(
    @Req() req,
    // @Res() res,
    @Body() loginUserDto: LoginUserDto,
  ) {
    const token = await this.authService.loginServiceUser(req.user);
    // return res.status(200).json({
    //   status: 200,
    //   message: 'success',
    //   data: token,
    // });
    return {
      status: 200,
      message: 'success',
      data: token,}
  }

  @ApiOperation({ summary: '모든 User 읽기 API' })
  @Get()
  async findAll() { // @Res() res
    const users = await this.userService.findAll();
    return users;
  }

  @ApiOperation({ summary: 'User 정보 수정 API' })
  @ApiParam({
    name: 'id', // Param Used ID
    description: '사용자 PK', //설명
    example: 8, //예시
    required: true, // 필수 여부
  })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      const hashPassword = await this.userService.hashPassword(
        updateUserDto.password,
      );
      updateUserDto.password = hashPassword;
    }
    return this.userService.update(+id, updateUserDto);
  }

  @ApiOperation({ summary: 'User 삭제 API' })
  @ApiParam({
    name: 'id', // Param 이름
    description: '사용자 PK', //설명
    example: 8, //예시
    required: true, // 필수 여부
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @ApiOperation({ summary: '내 정보 조회 API' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtServiceAuthGuard)
  @Get('/profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @ApiOperation({
    summary: 'Access Token 갱신',
  })
  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  async getRefresh(@Req() req) {
    return await this.authService.generateAccessToken(req.user);
  }

  @Get('/admin')
  @Roles('admin')
  @UseGuards(JwtServiceAuthGuard, RolesGuard)
  isAdmin(@Req() req) {
    try {
      // res.redirect('성공주소')
    } catch (e) {
      // res.redirect('성공주소 또는 에러주소')
    }
    // return req.user;
  }
}
