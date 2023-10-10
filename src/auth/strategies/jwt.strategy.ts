import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";

import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { User } from "../entities/user.entity";
import { DynamoDBService } from "src/dynamodb/dynamodb.service";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    
    constructor(
        private readonly dynamoDBService: DynamoDBService,
        private readonly configService: ConfigService
    ) {
        super({
            secretOrKey: configService.get('JWT_SECRET'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate(payload: JwtPayload): Promise<User> {

        const { userId } = payload;
        let user: User;
        // const params = {
        //     TableName: this.configService.get('DYNAMODB_TABLE_USERS'), // Replace with your actual table name
        //     Key: { userId },
        // };

        // const result = await this.dynamoDB.get(params).promise();
        const result = await this.dynamoDBService.findById(this.configService.get('DYNAMODB_TABLE_USERS'), {userId});
        
        if (result) user = result as User;

        if (!user || !user.isActive) throw new UnauthorizedException('Token invalido');

        return user;
    }


}