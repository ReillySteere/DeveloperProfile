import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

export interface IAuthService {
  validateUser(
    username: string,
    password: string,
  ): Promise<Partial<User> | null>;
  login(user: Partial<User>): { access_token: string };
  register(username: string, password: string): Promise<User>;
}

@Injectable()
export class AuthService implements IAuthService {
  readonly #jwtService: JwtService;
  readonly #userRepository: Repository<User>;

  constructor(
    jwtService: JwtService,
    @InjectRepository(User) userRepository: Repository<User>,
  ) {
    this.#jwtService = jwtService;
    this.#userRepository = userRepository;
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user = await this.#userRepository.findOne({ where: { username } });
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: Partial<User>): { access_token: string } {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.#jwtService.sign(payload),
    };
  }

  async register(username: string, password: string): Promise<User> {
    const existingUser = await this.#userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.#userRepository.create({
      username,
      password: hashedPassword,
    });

    return this.#userRepository.save(newUser);
  }
}
