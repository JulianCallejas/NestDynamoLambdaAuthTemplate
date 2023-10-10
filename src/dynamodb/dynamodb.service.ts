import { Injectable } from '@nestjs/common';
import { DynamoDB } from 'aws-sdk';

@Injectable()
export class DynamoDBService {
    private readonly dynamoDB: DynamoDB.DocumentClient = new DynamoDB.DocumentClient();

    async findById(tableName: string, id: {}): Promise<any> {
        const params = {
            TableName: tableName,
            Key: { ...id }, 
        };

        const result = await this.dynamoDB.get(params).promise();
        return result.Item;
    }

    async findByIndex(tableName: string, fieldName: string, value: any): Promise<any[]> {
        const indexname = `${fieldName}-index`
        const keyConditionExpression = `${fieldName} = :value`
        const params = {
            TableName: tableName,
            IndexName: indexname,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: { ':value': value },
        };

        // Filtrar Consulta
        // const params = {
        //   TableName: tableName,
        //   FilterExpression: `${fieldName} = :value`,
        //   ExpressionAttributeValues: { ':value': value },
        // };

        const result = await this.dynamoDB.query(params).promise();
        return result.Items;
    }

    async filterTable(tableName: string, fields: string[], value: string): Promise<any[]> {

        const params = {
            TableName: tableName,
            ProjectionExpression: fields.join(', '), // Include all specified fields
            FilterExpression: fields.map((attributeName) => `contains(#${attributeName}, :value)`).join(' OR '),
            ExpressionAttributeNames: fields.reduce((exprAttrNames, attributeName) => {
                exprAttrNames[`#${attributeName}`] = attributeName;
                return exprAttrNames;
            }, {}),
            ExpressionAttributeValues: {
                ':value': value,
            },
        };

        const result = await this.dynamoDB.scan(params).promise();
        return result.Items;
    }


    async createRecord(tableName: string, record: any): Promise<any> {
        const params = {
            TableName: tableName,
            Item: record,
        };

        await this.dynamoDB.put(params).promise();
        return record;
    }

    async updateRecord(tableName: string, id: {}, updates: any): Promise<any> {
        const params = {
            TableName: tableName,
            Key: {...id}, // Modify this based on your table's primary key structure
            UpdateExpression: 'SET ' + Object.keys(updates).map((key) => `${key} = :${key}`).join(', '),
            ExpressionAttributeValues: {},
        };
        
        for (const key of Object.keys(updates)) {
            params.ExpressionAttributeValues[`:${key}`] = updates[key];
        }

        await this.dynamoDB.update(params).promise();
        return updates;
    }

    async deleteRecord(tableName: string, id: {}): Promise<void> {
        const params = {
            TableName: tableName,
            Key: { ...id },
        };

        await this.dynamoDB.delete(params).promise();
    }
}