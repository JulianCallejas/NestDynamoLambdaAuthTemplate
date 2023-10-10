import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from './auth.service';
import { ValidRoles } from './interfaces';
import { Auth, GetUser } from './decorators';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';


@Controller('user')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.registerUser(createUserDto);
  }

  @Post('login')
  login(@Body('email') email: string, @Body('password') password: string) {
    return this.authService.loginUser(email, password);
  }

  @Post('create')
  @Auth(ValidRoles.admin)
  create(
    @Body() createUserDto: CreateUserDto,
    @GetUser(['empresaId', 'empresa']) datosEmpresa: { empresaId: string, empresa: string }
  ) {

    return this.authService.createUser(createUserDto, datosEmpresa);
  }

  @Patch('update/:email')
  @Auth()
  updateUser(
    @Param('email') email: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() requesterUser: User
  ) {
    return this.authService.updateUser(email, updateUserDto, requesterUser);
  }

  @Delete('delete/:email')
  @Auth()
  deleteUser(
    @Param('email') email: string,
    @GetUser() requesterUser: User
  ) {
    return this.authService.deleteUser(email, requesterUser);
  }


  @Get('empresa')
  @Auth()
  getAllUsersByEmpresa(
    @GetUser() user: User
  ) {

    if (user.rol === "admin" || user.rol === "dev") return this.authService.findUsersByCompanyId(user.empresaId);
    return this.authService.findUserByEmail(user.email);
  }



  // @Get('/')
  // @Auth(ValidRoles.admin)
  // getUsers() {

  //   const user = this.authService.getAllUsers();
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   return user

  // }

}
