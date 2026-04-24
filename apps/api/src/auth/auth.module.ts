import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { CurrentUserService } from './current-user.service';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  providers: [JwtStrategy, CurrentUserService],
  exports: [CurrentUserService],
})
export class AuthModule {}
