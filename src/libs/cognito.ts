import type { APIGatewayEventIdentity } from "aws-lambda"

export interface UserCognitoInfo {
    readonly userPoolId: string,
    readonly userPoolUserId: string
}

export const getCognitoId = (identity: APIGatewayEventIdentity): UserCognitoInfo => {
    const parseFailure = new Error(
        `Can't parse cognitoAuthenticationProvider value <${identity.cognitoAuthenticationProvider}>`
    );

    const [uris, cognitoSignIn, userPoolUserId] = identity.cognitoAuthenticationProvider.split(':');

    if (cognitoSignIn !== 'CognitoSignIn') {
        throw parseFailure;
    }

    if (!userIdMatchesExpectedPattern(userPoolUserId)) {
        throw parseFailure;
    }

    const uriList = uris.split(',');

    if (uriList.length < 1) {
        throw parseFailure;
    }

    const [_server, userPoolId] = uriList[1].split('/');

    if (!userPoolId) {
        throw parseFailure;
    }

    return {
        userPoolId,
        userPoolUserId
    };
};

const userIdMatchesExpectedPattern = (id: string): boolean => {
    return /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/.test(id);
};
