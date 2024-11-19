import jwt from 'jsonwebtoken';
import { envs } from './envs';

const { JWT_SEED } = envs;

export class JwtAdapter {
  static generateToken(payload: any, duration: string = '2h') {
    return new Promise((resolve) => {
      jwt.sign(payload, JWT_SEED, { expiresIn: duration }, (err, token) => {
        if (err) return resolve(null);
        resolve(token);
      });
    });
  }

  static async validateToken<T>(token: string): Promise<T | null> {
    try {
      const decoded = jwt.verify(token, JWT_SEED);
      return decoded as T;
    } catch (err) {
      return null;
    }
  }
}
