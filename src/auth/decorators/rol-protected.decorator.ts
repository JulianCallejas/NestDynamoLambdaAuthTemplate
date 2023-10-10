import { SetMetadata } from '@nestjs/common';
import { ValidRoles } from 'src/auth/interfaces';

export const META_ROLES = 'rol'

export const RolProtected = (...args: ValidRoles[]) => {
    
    if (args && args.length > 0) args.push(ValidRoles.dev);

    return SetMetadata(META_ROLES, args)

};
