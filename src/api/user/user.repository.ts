import { Repository } from 'typeorm';
import { User } from '../entity/index';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository extends Repository<User> {}
