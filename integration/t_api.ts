import { API } from "aws-amplify";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export const post = async (apiName: any, path: any, init: any): Promise<any> => {
    const start = Date.now();
    let lastError: any;

    do {
        try {
            return await API.post(apiName, path, init);
        } catch (e) {
            lastError = e;
            console.warn(JSON.stringify(e));
            await sleep(200);
        }
    } while (Date.now() - start < 60000);

    throw lastError;
};
