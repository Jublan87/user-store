import { bcryptAdapter, JwtAdapter } from '../../config';
import userModel from '../../data/mongo/models/user.model';
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from '../../domain';

export class AuthService {
  constructor() {}

  public async registerUser(registerUserDto: RegisterUserDto) {
    const existUser = await userModel.findOne({ email: registerUserDto.email });
    if (existUser) throw CustomError.badRequest('User already exist');

    try {
      const user = new userModel(registerUserDto);

      user.password = bcryptAdapter.hash(registerUserDto.password);

      await user.save();

      // Email de confirmacion

      const { password, ...userEntity } = UserEntity.fromObject(user);
      
      const token = await this.generateToken({
        id: user.id,
      });

      return {
        user: userEntity,
        token: token,
      };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  public async loginUser(loginUserDto: LoginUserDto) {
    const user = await userModel.findOne({ email: loginUserDto.email });
    if (!user) throw CustomError.badRequest('Email or password not match');

    try {
      const passwordMatch = bcryptAdapter.compare(
        loginUserDto.password,
        user.password
      );

      if (!passwordMatch) throw CustomError.badRequest('Password not match');

      const { password, ...userEntity } = UserEntity.fromObject(user);
      
      const token = await this.generateToken({
        id: user.id,
      });

      return {
        user: userEntity,
        token: token,
      };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  private async generateToken(payload: any) {
    const token = await JwtAdapter.generateToken({ payload: payload });
    if (!token) throw CustomError.internalServer('Token not generated');
    return token;
  }
}
