import { API } from "aws-amplify";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export const post = async (apiName: any, path: any, init: any): Promise<any> => {
    const start = Date.now();
    let lastError: any;

    do {
        try {
            return await API.post(apiName, path, init);
        } catch (e) {
            if (e.message !== 'Request failed with status code 403') {
                throw e;
            }
            lastError = e;
            await sleep(500);
        }
    } while (Date.now() - start < 4 * 60 * 1000);

    throw lastError;
};
