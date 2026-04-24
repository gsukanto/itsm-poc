import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  permissions: Set<string>;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly log = new Logger(JwtStrategy.name);
  constructor(private prisma: PrismaService) {
    const tenant = process.env.ENTRA_TENANT_ID;
    const audience = process.env.ENTRA_AUDIENCE ?? 'api://itsm';
    const useEntra = !!tenant;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience,
      ...(useEntra
        ? {
            issuer: `https://login.microsoftonline.com/${tenant}/v2.0`,
            algorithms: ['RS256'],
            secretOrKeyProvider: passportJwtSecret({
              cache: true,
              rateLimit: true,
              jwksRequestsPerMinute: 10,
              jwksUri: `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`,
            }),
          }
        : {
            algorithms: ['HS256'],
            secretOrKey: process.env.JWT_DEV_SECRET ?? 'dev-only-change-me',
          }),
    });
  }

  async validate(payload: any): Promise<AuthUser> {
    const oid = payload.oid ?? payload.sub;
    const email = payload.preferred_username ?? payload.email ?? payload.upn;
    if (!oid || !email) throw new UnauthorizedException('token missing oid/email');

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ entraOid: oid }, { email }] },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          entraOid: oid,
          email,
          displayName: payload.name ?? email,
        },
        include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
      });
      this.log.log(`JIT-provisioned user ${email}`);
    } else if (!user.entraOid && oid) {
      await this.prisma.user.update({ where: { id: user.id }, data: { entraOid: oid } });
    }

    const permissions = new Set<string>();
    const roles: string[] = [];
    for (const ur of user.roles) {
      roles.push(ur.role.key);
      for (const rp of ur.role.permissions) permissions.add(rp.permission.key);
    }
    return { id: user.id, email: user.email, displayName: user.displayName, permissions, roles };
  }
}
