import { API } from 'aws-amplify';
import { amplifyConfigure, amplifySignIn } from '../api_configure';

beforeEach(async () => {
    await amplifyConfigure();
    await amplifySignIn();
});

test('should be able to call hello', async () => {
    const response = await API.post('hello', '/hello', { body: { name: 'Fred' } });

    expect(response.message).toBe('Hello Fred, welcome to the exciting Serverless world!');
    expect(response.cognitoId).toMatch(/^cognito:[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
});
