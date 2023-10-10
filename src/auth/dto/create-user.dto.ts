import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, MinLength, NotContains } from "class-validator";


export class CreateUserDto {

    @IsString()
    @Length(2)
    pais: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(3)
    nombre: string;

    @IsString()
    @MinLength(3)
    apellido: string;

    @IsString()
    telefono: string;

    @IsString()
    @MinLength(3)
    empresa: string;

    @IsString()
    @MinLength(6)
    @MaxLength(16)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'El password debe tener al menos 6 caracteres, una nimúscula, una mayúscula y un número',
    })
    @NotContains(' ', { message: 'El password no debe contener espacios' }) 
    password: string;
    
    @IsString()
    passwordconf: string;

    @IsString()
    @IsOptional()
    rol?: string;

}
