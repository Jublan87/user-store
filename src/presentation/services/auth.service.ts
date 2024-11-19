import { bcryptAdapter, envs, JwtAdapter } from '../../config';
import userModel from '../../data/mongo/models/user.model';
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from '../../domain';
import { EmailService } from './email.service';

export class AuthService {
  constructor(
    private readonly emailService: EmailService,
  ) {}

  public async registerUser(registerUserDto: RegisterUserDto) {
    const existUser = await userModel.findOne({ email: registerUserDto.email });
    if (existUser) throw CustomError.badRequest('User already exist');

    try {
      const user = new userModel(registerUserDto);

      user.password = bcryptAdapter.hash(registerUserDto.password);

      await user.save();

      await this.sendEmailValidationLink(user.email); 

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

  public validateEmail = async (token: string) => {
    const payload = await JwtAdapter.validateToken(token);
    if (!payload) throw CustomError.unauthorized('Invalid token');

    const {email} = payload as {email: string};
    if (!email) throw CustomError.internalServer('Email not in token');

    const user = await userModel.findOne({ email });
    if (!user) throw CustomError.internalServer('Email not found');

    user.emailValidated = true;
    await user.save();

    return true;
  }

  private readonly generateToken = async (payload: any) => {
    const token = await JwtAdapter.generateToken({ ...payload });
    if (!token) throw CustomError.internalServer('Token not generated');
    return token;
  }

  private readonly sendEmailValidationLink = async (email: string) => {
    const token = await this.generateToken({ email });
    const link = `${envs.WEBSERVICE_URL}/auth/validate-email/${token}`;
    const emailContent = `
      <h1>Validate your email</h1>
      <p>Click the link below to validate your email</p>
      <a href="${link}">Validate email here</a>
    `;

    const options = {
      to: email,
      subject: 'Validate your email',
      htmlBody: emailContent,
    }

    const isSet = await this.emailService.sendEmail(options);

    if (!isSet) throw CustomError.internalServer('Email not send');

    return isSet;
  }
}
