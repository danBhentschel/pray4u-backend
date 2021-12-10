import { APIGatewayEventIdentity } from 'aws-lambda';
import { getCognitoId } from './cognito';

const realProviderInfo = 'cognito-idp.us-east-1.amazonaws.com/us-east-1_HqMx1CWjI,cognito-idp.us-east-1.amazonaws.com/us-east-1_HqMx1CWjI:CognitoSignIn:eb4b889f-7ad8-4025-9013-8816b6ba0c90';

test('should parse pool id from real provider info', () => {
    const { userPoolId } = getCognitoId(makeCognitoIdStructure(realProviderInfo));

    expect(userPoolId).toBe('us-east-1_HqMx1CWjI');
});

test('should parse user id from real provider info', () => {
    const { userPoolUserId } = getCognitoId(makeCognitoIdStructure(realProviderInfo));

    expect(userPoolUserId).toBe('eb4b889f-7ad8-4025-9013-8816b6ba0c90');
});

test('should throw an exception for malformed provider info', () => {
    expect(() => getCognitoId(makeCognitoIdStructure('Something crazy here'))).toThrow();
});

test('should throw if "CognitoSignIn" not present in provider info', () => {
    expect(() => getCognitoId(makeCognitoIdStructure(
        'cognito-idp.us-east-1.amazonaws.com/us-east-1_HqMx1CWjI,cognito-idp.us-east-1.amazonaws.com/us-east-1_HqMx1CWjI:NotCognito:eb4b889f-7ad8-4025-9013-8816b6ba0c90'
    ))).toThrow();
});

test('should throw if userPoolUserId doesn\'t match the expected pattern', () => {
    expect(() => getCognitoId(makeCognitoIdStructure(
        'cognito-idp.us-east-1.amazonaws.com/us-east-1_HqMx1CWjI,cognito-idp.us-east-1.amazonaws.com/us-east-1_HqMx1CWjI:CognitoSignIn:eb4b89f-7d8-425-913-816b6ba0c90'
    ))).toThrow();
});

// ************* SUPPORT FUNCTIONS

const makeCognitoIdStructure = (providerInfo: string): APIGatewayEventIdentity => {
    return <APIGatewayEventIdentity>{
        cognitoAuthenticationProvider: providerInfo,
    };
};
