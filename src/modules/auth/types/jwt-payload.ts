export interface JwtPayload {
  sub: string;
  username: string | null;
  iat?: number;
  exp?: number;
}