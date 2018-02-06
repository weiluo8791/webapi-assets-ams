import { RestApiRequestError } from '../../../errors';
import { Handler } from '../Handler';
import { Result } from '../../Protocol';
import { RequestContext } from '../../../RequestContext';

// import * as http from 'http';
// import * as https from 'https';
import { createConnection } from 'net';
// import { resolve } from 'url';
// import * as net from 'net';
// import * as StreamBuffers from 'stream-buffers';
// import * as URL from 'url';

async function getAmsData(type: string) {
    let HOST = '172.25.0.2';
    let PORT = 1022;
    let totalData = [];

    totalData = [];
    return new Promise((resolve, reject) => {
        let client = createConnection({ host: HOST, port: PORT }, () => {
            // 'connect' listener
            // console.log('connected to server!');
            let message = Buffer.from('0009000b52454d4f54455f41444452000d3137322e33302e35342e313236000b52454d4f54455f484f5354000d3137322e33302e35342e313236000f485454505f555345525f4147454e5400734d6f7a696c6c612f352e30202857696e646f7773204e542031302e303b2057696e36343b2078363429204170706c655765624b69742f3533372e333620284b48544d4c2c206c696b65204765636b6f29204368726f6d652f36332e302e333233392e313332205361666172692f3533372e3336000b485454505f434f4f4b4945019768756273706f7475746b3d61313033633763316232616239613033333932306539376433376634633537393b205f67613d4741312e322e3631353734363238362e313530383530393836363b205f6769643d4741312e322e313438303439323737392e313531363131333330383b205f5f687374633d3138383835393633362e61313033633763316232616239613033333932306539376433376634633537392e313530383936323436343831322e313531343330393238323730382e313531363133383435343530352e363b205f5f756e616d3d366434336436342d31363039336464653162332d32613961383532622d343b205f5f75746d613d3138383835393633362e3631353734363238362e313530383530393836362e313531363134303437312e313531363134303437312e313b205f5f75746d7a3d3138383835393633362e313531363134303437312e312e312e75746d6373723d28646972656374297c75746d63636e3d28646972656374297c75746d636d643d286e6f6e65293b20706373743d454b746f57796f4a4f3533343036350005485454505300036f6666000b5345525645525f504f52540002383000125345525645525f504f52545f53454355524500013000064e54555345520011776c756f406d656469746563682e636f6d00045459504500085775735369746573', 'hex');
            client.write(message);
        });
        client.on('data', (data) => {
            // console.log(`Received ${data.length} bytes of data.`);
            totalData.push(data);
        });
        client.on('close', () => {
            // console.log('disconnected from server');
            let data = Buffer.concat(totalData);
            client.destroy();
            resolve(data);
        });
    });
}

function processAmsData(buf) {
    let i = 0;
    let j = 0;
    let k = 0;
    let header = '';
    let resData = '';
    // process for header
    while (i < buf.length) {
        if (buf.readIntBE(i, 1) === 2) {
            j = i + 1; // value length position
            k = buf.readIntBE(j, 1); // value length
            // header terminate
            if (k === 1 && buf.readInt8(j + 1) === 10) {
                i = j + 2;
                break;
            }
            let value = buf.slice(j + 1, j + k + 1);
            header += value.toString();
        }
        i = j + k + 1;
    }
    // process for body
    while (i < buf.length) {
        if (buf.readIntBE(i, 1) === 2) {
            j = i + 1; // value length position
            k = buf.readIntBE(j, 1); // value length
            let value = buf.slice(j + 1, j + k + 1);
            resData += value.toString();
        }
        // data terminate
        if (buf.readIntBE(i, 1) === 1) {
            break;
        }
        i = j + k + 1;
    }
    // console.log('header', header);
    // console.log('data', resData);
    return JSON.parse(resData);
}

export class AMSApis extends Handler {
    /**
     * @inheritDoc
     */
    protected _execute_get(ctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {

        let task: string;
        let TYPE: string;

        Promise.all([ctx.apiInfo])
            .then(([apiInfo]) => {
                task = apiInfo.routeParams['Task'];
                TYPE = ctx.query['TYPE'];
                return getAmsData(TYPE);
            })
            .then(a => {
                let jdata = processAmsData(a);
                const json = {
                    resource: 'v1/resource/ams-view/_version/1/',
                    uri: 'v1/ams-view/',
                    Task: task,
                    displayName: jdata.displayName,
                    email: jdata.email,
                    sites: jdata.sites
                };
                return { json, statusCode: 200 };
            })
            .then(resolvePromise, rejectPromise);
    }

    /**
     * @inheritDoc
     */
    protected _execute_put(ctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {
        throw new RestApiRequestError(405);
    }

    /**
     * @inheritDoc
     */
    protected _execute_patch(ctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {

        throw new RestApiRequestError(405);
    }

    /**
     * @inheritDoc
     */
    protected _execute_delete(ctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {

        throw new RestApiRequestError(405);
    }

    /**
     * @inheritDoc
     */
    protected _execute_post(ctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {

        throw new RestApiRequestError(405);
    }

    /**
     * @inheritDoc
     */
    protected _execute_head(dctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {

        throw new RestApiRequestError(405);
    }
}

export default AMSApis;