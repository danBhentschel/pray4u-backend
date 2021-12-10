import { Amplify, Auth } from 'aws-amplify';

const serviceEndpoint = `https://api.dev.pray4u.org/${process.env.SERVERLESS_STAGE}`;

export const amplifyConfigure = async () => {
    const config = await import(`${__dirname}/${process.env.SERVERLESS_STAGE}-stack-output.json`);

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
};

export const amplifySignIn = async () => {
    await Auth.signIn(process.env.COGNITO_USERNAME, process.env.COGNITO_PASSWORD);
};
