import { API } from "aws-amplify";
import { amplifyConfigure, amplifySignIn } from "./api_configure";

const MINUTES_TO_WAIT = 5;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const post = async (apiName: any, path: any, init: any): Promise<any> => {
    const start = Date.now();
    let lastError: any;

    do {
        try {
            return await API.post(apiName, path, init);
        } catch (e) {
            console.debug(`FAILED: ${e.message}`);
            if (e.message !== 'Request failed with status code 403') {
                throw e;
            }
            lastError = e;
            await sleep(1000);
        }
    } while (Date.now() - start < MINUTES_TO_WAIT * 60 * 1000);

    throw lastError;
};

(async () => {
    console.debug('Configuring Amplify');
    await amplifyConfigure();
    console.debug('Signing into Cognito');
    await amplifySignIn();

    console.debug('Attempting to post');
    const result = await post('hello', '/hello', { body: { name: 'Fred' } });
    console.debug(`SUCCESS: ${result.message}`);
})();
