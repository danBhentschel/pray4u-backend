import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { formatJSONResponse } from '@libs/apiGateway';
import { getAuthId } from '@libs/authId';
import { middyfy } from '@libs/lambda';

import schema from './schema';

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log(JSON.stringify(event.requestContext));
  const id = getAuthId(event.requestContext.identity).authId;
  return formatJSONResponse({
    message: `Hello ${event.body.name}, welcome to the exciting Serverless world!`,
    cognitoId: id,
  });
}

export const main = middyfy(hello);
