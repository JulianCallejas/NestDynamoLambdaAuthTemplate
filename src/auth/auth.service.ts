import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { v4 as uuid } from "uuid";
import * as bcrypt from 'bcryptjs';

import { CreateUserDto } from './dto/create-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { DynamoDBService } from 'src/dynamodb/dynamodb.service';
import { GetDate } from 'src/common/helpers';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';


@Injectable()
export class AuthService {

  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly dynamoDBService: DynamoDBService,
    private readonly jwtService: JwtService

  ) { }


  async registerUser(dto: CreateUserDto): Promise<any> {
    this.logger.log(`POST: user/register: Register user iniciado`);
    // Check if password and passwordConfirmation match
    if (dto.password !== dto.passwordconf) throw new BadRequestException('La contraseña no coincide');

    //Data to lower case
    dto.email = dto.email.toLowerCase();
    dto.apellido = dto.apellido.toLowerCase();
    dto.empresa = dto.empresa.toLowerCase();
    dto.nombre = dto.nombre.toLowerCase();

    //Email exists
    const userexists = await this.findUserByEmail(dto.email);
    //Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    //Generate UUIDs for user and company
    const userId = uuid();
    const empresaId = uuid();

    if (userexists) {
      if (userexists.isActive) throw new BadRequestException('Este correo ya se encuentra registrado');
      try {

        const nuevaEmpresa = await this.dynamoDBService.createRecord(process.env.DYNAMODB_TABLE_COMPANIES, {
          empresaId,
          empresaNombre: dto.empresa,
          createdAt: GetDate.getFullDate()
        });
        this.logger.log(`POST: user/register: Empresa creada: ${nuevaEmpresa}`);

        const usuarioActivado = await this.dynamoDBService.updateRecord(process.env.DYNAMODB_TABLE_USERS, { userId: userexists.userId }, {
          pais: dto.pais,
          nombre: dto.nombre,
          apellido: dto.apellido,
          empresaId: empresaId,
          empresa: dto.empresa,
          telefono: dto.telefono,
          password: hashedPassword,
          rol: 'admin',
          isActive: true,
          updatedAt: GetDate.getFullDate()
        })

        this.logger.log(`POST: user/register: Usuario activado: ${usuarioActivado}`);

        return {
          email: dto.email,
          nombre: dto.nombre,
          apellido: dto.apellido,
          empresaId,
          empresa: dto.empresa,
          rol: 'admin',
          token: this.getJwtToken({
            userId: userId,
          })
        }
      } catch (error) {
        this.logger.error(`POST: user/register: Error: ${error}`);
        throw new InternalServerErrorException('Error creating user');
      }
    } else {
      try {
        // Save user to DynamoDB
        const nuevaEmpresa = await this.dynamoDBService.createRecord(process.env.DYNAMODB_TABLE_COMPANIES, {
          empresaId,
          empresaNombre: dto.empresa,
          createdAt: GetDate.getFullDate()
        });
        this.logger.log(`POST: user/register: Empresa creada: ${nuevaEmpresa}`);

        const usuarioCreado = await this.dynamoDBService.createRecord(process.env.DYNAMODB_TABLE_USERS, {
          userId,
          pais: dto.pais,
          nombre: dto.nombre,
          apellido: dto.apellido,
          empresaId: empresaId,
          empresa: dto.empresa,
          telefono: dto.telefono,
          email: dto.email,
          password: hashedPassword,
          rol: 'admin',
          isActive: true,
          createdAt: GetDate.getFullDate()
        });

        this.logger.log(`POST: user/register: Usuario creado: ${usuarioCreado}`);

        return {
          email: dto.email,
          nombre: dto.nombre,
          apellido: dto.apellido,
          empresaId,
          empresa: dto.empresa,
          rol: 'admin',
          token: this.getJwtToken({
            userId: userId,
          })
        };
      }
      catch (error) {
        throw new InternalServerErrorException('Error creating user');
      }
    }
  }


  async loginUser(email: string, password: string): Promise<any> {
    this.logger.log(`POST: user/login: Login iniciado: ${email}`);
    let user;
    try {
      const result = await this.dynamoDBService.findByIndex(process.env.DYNAMODB_TABLE_USERS, 'email', email);
      user = result[0];

    } catch (error) {
      this.logger.error(`POST: user/login: error: ${error}`);
      throw new InternalServerErrorException('Error getting user');

    }

    if (!user) {
      throw new BadRequestException('Credenciales incorrectas');
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new Error('Credenciales incorrectas');
    }
    delete user.password;
    this.logger.log(`POST: user/login: Usuario aceptado: ${user}`);
    return {
      email,
      nombre: user.nombre,
      apellido: user.apellido,
      empresaId: user.empresaId,
      empresa: user.empresa,
      rol: user.rol,
      token: this.getJwtToken({
        userId: user.userId,
      })
    };
  }

  async createUser(dto: CreateUserDto, datosEmpresa): Promise<any> {
    this.logger.log(`POST: user/create: Crear usuario iniciado`);
    // Check if password and passwordConfirmation match
    if (dto.password !== dto.passwordconf) throw new BadRequestException('La contraseña no coincide');

    //Check rol
    if (!dto.rol || (dto.rol !== 'admin' && dto.rol !== 'user')) throw new BadRequestException('Rol no permitido');

    //Data to lower case
    dto.email = dto.email.toLowerCase();
    dto.apellido = dto.apellido.toLowerCase();
    dto.empresa = datosEmpresa.empresa.toLowerCase();
    dto.nombre = dto.nombre.toLowerCase();

    //Email exists
    const userexists = await this.findUserByEmail(dto.email);
    //Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    //Generate UUIDs for user and company
    const userId = uuid();
    const empresaId = datosEmpresa.empresaId;

    if (userexists) {
      if (userexists.isActive) throw new BadRequestException('Este correo ya se encuentra registrado');
      try {

        const newUser = await this.dynamoDBService.updateRecord(process.env.DYNAMODB_TABLE_USERS, { userId: userexists.userId }, {
          pais: dto.pais,
          nombre: dto.nombre,
          apellido: dto.apellido,
          empresaId: empresaId,
          empresa: dto.empresa,
          telefono: dto.telefono,
          password: hashedPassword,
          rol: dto.rol,
          isActive: true,
          updatedAt: GetDate.getFullDate()
        })

        if (newUser) delete newUser.password;
        this.logger.log(`POST: user/create: Usuario activado: ${newUser}`);
        return { ...newUser, userId };

      } catch (error) {
        this.logger.error(`POST: user/create: error: ${error}`);
        throw new InternalServerErrorException('Error creating user');
      }
    } else {
      try {

        const newUser = await this.dynamoDBService.createRecord(process.env.DYNAMODB_TABLE_USERS, {
          userId,
          pais: dto.pais,
          nombre: dto.nombre,
          apellido: dto.apellido,
          empresaId: empresaId,
          empresa: dto.empresa,
          telefono: dto.telefono,
          email: dto.email,
          password: hashedPassword,
          rol: dto.rol,
          isActive: true,
          createdAt: GetDate.getFullDate()
        });

        if (newUser) delete newUser.password;
        this.logger.log(`POST: user/create: Usuario creado: ${newUser}`);

        return { ...newUser, userId };

      }
      catch (error) {
        this.logger.error(`POST: user/create: error: ${error}`);
        throw new InternalServerErrorException('Error creating user');
      }
    }
  }

  async updateUser(email: string, dto: UpdateUserDto, requesterUser: User): Promise<any> {
    this.logger.log(`PATCH: user/update: Solicitado por ${requesterUser.userId} ${requesterUser.email}`);
    this.logger.log(`PATCH: user/update: Update iniciado ${email}`);
    const userToUpdate = await this.findUserByEmail(email);
    if (!userToUpdate || !userToUpdate.isActive) throw new BadRequestException('Email no encontrado');
    if (!dto) throw new BadRequestException('No hay campos para actualizar');
    if (userToUpdate.userId !== requesterUser.userId &&
      (requesterUser.rol !== 'admin' || userToUpdate.empresaId !== requesterUser.empresaId)) throw new UnauthorizedException('No tiene permisos para actualizar este usuario');

    if (dto.password) {
      if (dto.password !== dto.passwordconf) throw new BadRequestException('La contraseña no coincide');
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    dto['updatedAt'] = GetDate.getFullDate();
    if (dto.email) dto.email = dto.email.toLowerCase();
    if (dto.apellido) dto.apellido = dto.apellido.toLowerCase();
    if (dto.nombre) dto.nombre = dto.nombre.toLowerCase();
    if (dto.empresa) {
      if (requesterUser.rol === "admin") {
        
        
        try {
          dto.empresa = dto.empresa.toLowerCase();
          const empresaActualizada = await this.dynamoDBService.updateRecord(process.env.DYNAMODB_TABLE_COMPANIES, { empresaId: userToUpdate.empresaId }, { empresaNombre: dto.empresa, updatedAt: dto.updatedAt })
          
          this.logger.log(`PATCH: user/update: Empresa actualizada ${empresaActualizada}`);
  
          let empresaUsers = await this.findUsersByCompanyId(userToUpdate.empresaId);
          if (empresaUsers && empresaUsers.length > 0) {
            empresaUsers.forEach(empresaUser => {
              this.dynamoDBService.updateRecord(process.env.DYNAMODB_TABLE_USERS, { userId: empresaUser.userId }, { empresa: dto.empresa })
              this.logger.log(`PATCH: user/update: Empresa actualizada a usuario: ${ empresaUser.userId } ${ empresaUser.email }`);
            });
          }
        } catch (error) {
          this.logger.error(`PATCH: user/update: Error: ${error}`);
          throw new InternalServerErrorException('Error updating user');
        }


      }
      delete dto.empresa;
    }
    if (dto.rol && requesterUser.rol !== "admin") delete dto.rol;

    try {

      const result = await this.dynamoDBService.updateRecord(process.env.DYNAMODB_TABLE_USERS, { userId: userToUpdate.userId }, dto);
      let userupdated = result ? { ...userToUpdate, ...dto } : {};
      delete userupdated.password;

      this.logger.log(`PATCH: user/update: Usuario actualizado ${userupdated}`);

      return userupdated;

    } catch (error) {
      this.logger.error(`PATCH: user/update: Error: ${error}`);
      throw new InternalServerErrorException('Error updating user');
    }
  }

  async deleteUser(email: string, requesterUser: User): Promise<any> {
    this.logger.log(`DELETE: user/delete: delete user solicitado por: ${requesterUser.userId} ${requesterUser.email}`);
    this.logger.log(`DELETE: user/delete: delete iniciado: ${email}`);
    const userToUpdate = await this.findUserByEmail(email);
    if (!userToUpdate || !userToUpdate.isActive) throw new BadRequestException('Email no encontrado');

    if (userToUpdate.userId !== requesterUser.userId &&
      (requesterUser.rol !== 'admin' || userToUpdate.empresaId !== requesterUser.empresaId)) throw new UnauthorizedException('No tiene permisos para actualizar este usuario');

    try {
      await this.dynamoDBService.updateRecord(process.env.DYNAMODB_TABLE_USERS, { userId: userToUpdate.userId }, { isActive: false, updatedAt: GetDate.getFullDate() });
      
      this.logger.log(`DELETE: user/delete: Usario desactivado: ${email}`);
      
      return {
        ok: true,
        deletedUser: userToUpdate.email
      };
    } catch (error) {
      this.logger.error(`DELETE: user/delete: error: ${error}`);
      throw new InternalServerErrorException('Error deleting user');
    }

  }


  async findUsersByCompanyId(empresaId: string): Promise<any[]> {
    this.logger.log(`GET: user/empresa: consulta iniciada`);
    const result = await this.dynamoDBService.findByIndex(process.env.DYNAMODB_TABLE_USERS, 'empresaId', empresaId);
    return result;

  }

  async findUserByEmail(email: string): Promise<any> {
    
    const result = await this.dynamoDBService.findByIndex(process.env.DYNAMODB_TABLE_USERS, 'email', email);
    const user = result[0];
    if (user) delete user.password;

    return user;
  }

  // async getAllUsers(): Promise<any> {

  //   const result = await this.dynamoDBService.findByIndex(process.env.DYNAMODB_TABLE_USERS, 'empresaId', 'ea19abdf-9c2c-453b-aebf-921872cea28y');
  //   return result;

  // }

  private getJwtToken(payload: JwtPayload) {

    const token = this.jwtService.sign(payload);
    return token;

  }


}





