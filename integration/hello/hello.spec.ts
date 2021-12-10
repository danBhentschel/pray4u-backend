import { Amplify, API } from 'aws-amplify';
import { Auth } from 'aws-amplify';


const serviceEndpoint = `https://api.dev.pray4u.org/${process.env.SERVERLESS_STAGE}`;

beforeEach(async () => {
    const config = await import(`../${process.env.SERVERLESS_STAGE}-stack-output.json`);
    Amplify.configure({
        Auth: {
            mandatorySignIn: true,
            region: config.region,
            userPoolId: config.userPoolId,
            identityPoolId: config.identityPoolId,
            userPoolWebClientId: config.userPoolClientId,
        },
        API: {
            endpoints: [
                {
                    name: 'hello',
                    endpoint: serviceEndpoint,
                    region: config.region,
                },
            ]
        },
    });
});

test('should be able to call hello', async () => {
    await Auth.signIn(process.env.COGNITO_USERNAME, process.env.COGNITO_PASSWORD);
    const response = await API.post('hello', '/hello', { body: { name: 'Fred' } });

    expect(response.message).toBe('Hello Fred, welcome to the exciting Serverless world!');
    expect(response.cognitoId).toMatch(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
});
