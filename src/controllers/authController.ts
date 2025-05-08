// src/controllers/authController.ts
import { Request, ResponseToolkit } from '@hapi/hapi';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import AppDataSource from '../data-source';
import { Employee } from '../entities/Employee';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

export class AuthController {
  static async login(req: Request, h: ResponseToolkit) {
    const { username, password } = req.payload as { username: string; password: string };

    const userRepo = AppDataSource.getRepository(Employee);
    const user = await userRepo.findOne({ where: { username } });

    if (!user) {
      return h.response({ message: 'Invalid username or password' }).code(401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return h.response({ message: 'Invalid username or password' }).code(401);
    }

    const payload = {
      id: user.id,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    return h.response({ token }).code(200);
  }
}
