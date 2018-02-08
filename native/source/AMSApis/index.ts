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
            let message = Buffer.from('000a000b52454d4f54455f41444452000b3137322e33302e35312e32000b52454d4f54455f484f5354000b3137322e33302e35312e32000f485454505f555345525f4147454e540014506f73746d616e52756e74696d652f372e312e31000b485454505f434f4f4b49450014706373743d73554d504f4a51724c3533373237320005485454505300036f6666000b5345525645525f504f52540002383000125345525645525f504f52545f53454355524500013000064e54555345520013524f47455253406d656469746563682e636f6d00045459504500075461736b47657400047461736b000734323935363038', 'hex');
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
                task = apiInfo.routeParams['task'];
                TYPE = ctx.query['TYPE'];
                return getAmsData(TYPE);
            })
            .then(a => {
                let jdata = processAmsData(a);
                const json = {
                    resource: 'v1/resource/ams-view/_version/1/',
                    uri: 'v1/ams-view/',
                    task: task,
                    site: jdata.site,
                    module: jdata.module,
                    'ams.task.entry.time': jdata['ams.task.entry.time'],
                    'task.status': jdata['task.status'],
                    'task.priority': jdata['task.priority'],
                    'ams.task.patient.safety': jdata['ams.task.patient.safety'],
                    'ams.task.reference.number': jdata['ams.task.reference.number'],
                    'ams.task.description': jdata['ams.task.description'],
                    'task.request.type': jdata['task.request.type'],
                    'ams.task.live.system': jdata['ams.task.live.system'],
                    'ams.task.test.system': jdata['ams.task.test.system'],
                    'ams.task.update.system': jdata['ams.task.update.system'],
                    'ams.task.contact': jdata['ams.task.contact'],
                    'ams.task.contact.phone': jdata['ams.task.contact.phone'],
                    'module.notifications': jdata['module.notifications'],
                    'task.received.by': jdata['task.received.by'],
                    'task.application.specialist': jdata['task.application.specialist'],
                    'task.other.staff': jdata['task.other.staff'],
                    'task.last.edit': jdata['task.last.edit']
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