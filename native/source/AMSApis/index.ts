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
import * as os from 'os';

// constant for name length
const REMOTE_ADDR_L = '000b';
const REMOTE_HOST_L = '000b';
const HTTP_USER_AGENT_L = '000f';
const HTTPS_L = '0005';
const SERVER_PORT_L = '000b';
const SERVER_PORT_SECURE_L = '0012';
const NTUSER_L = '0006';
const TYPE_L = '0004';
const task_L = '0004';

// interface for AMS package
interface AmsPackage {
    REMOTE_ADDR: string;
    REMOTE_HOST: string;
    HTTP_USER_AGENT: string;
    HTTPS: string;
    SERVER_PORT: string;
    SERVER_PORT_SECURE: string;
    NTUSER: string;
    TYPE: string;
    task: string;
    AMS_PARAM_TOTAL: string;
}

async function getAmsData(amsPackage: string) {
    const HOST = '172.25.0.2';
    const PORT = 1022;
    let totalData = [];

    totalData = [];
    return new Promise((resolve, reject) => {
        let client = createConnection({ host: HOST, port: PORT }, () => {
            // 'connect' listener
            // console.log('connected to server!');
            let message = Buffer.from(amsPackage, 'hex');
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

    return JSON.parse(resData);
}

// return localIP in array
function getLocalIp() {
    let interfaces = os.networkInterfaces();
    let addresses = [];
    for (let k in interfaces) {
        for (let k2 in interfaces[k]) {
            let address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    return addresses;
}

// for length in the format of hex 0000
function hex16(val) {
    val &= 0xFFFF;
    let hex = val.toString(16).toUpperCase();
    return ('0000' + hex).slice(-4);
}

// from string  in for format of hex 00
function stringToHex(str) {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
}

function packageAmsSend(task: string, Type: string) {
    let localIp = getLocalIp()[0];
    let amsPackage: AmsPackage = {
        REMOTE_ADDR: localIp,
        REMOTE_HOST: localIp,
        HTTP_USER_AGENT: 'PostmanRuntime/7.1.1',
        HTTPS: 'off',
        SERVER_PORT: '80',
        SERVER_PORT_SECURE: '0',
        NTUSER: 'WLUO@meditech.com',
        TYPE: Type,
        task: task,
        AMS_PARAM_TOTAL: '0009'
    };

    let amsPacket = '';
    amsPacket += amsPackage.AMS_PARAM_TOTAL;
    amsPacket += REMOTE_ADDR_L + stringToHex('REMOTE_ADDR') + hex16(amsPackage.REMOTE_ADDR.length) + stringToHex(amsPackage.REMOTE_ADDR);
    amsPacket += REMOTE_HOST_L + stringToHex('REMOTE_HOST') + hex16(amsPackage.REMOTE_HOST.length) + stringToHex(amsPackage.REMOTE_HOST);
    amsPacket += HTTP_USER_AGENT_L + stringToHex('HTTP_USER_AGENT') + hex16(amsPackage.HTTP_USER_AGENT.length) + stringToHex(amsPackage.HTTP_USER_AGENT);
    amsPacket += HTTPS_L + stringToHex('HTTPS') + hex16(amsPackage.HTTPS.length) + stringToHex(amsPackage.HTTPS);
    amsPacket += SERVER_PORT_L + stringToHex('SERVER_PORT') + hex16(amsPackage.SERVER_PORT.length) + stringToHex(amsPackage.SERVER_PORT);
    amsPacket += SERVER_PORT_SECURE_L + stringToHex('SERVER_PORT_SECURE') + hex16(amsPackage.SERVER_PORT_SECURE.length) + stringToHex(amsPackage.SERVER_PORT_SECURE);
    amsPacket += NTUSER_L + stringToHex('NTUSER') + hex16(amsPackage.NTUSER.length) + stringToHex(amsPackage.NTUSER);
    amsPacket += TYPE_L + stringToHex('TYPE') + hex16(amsPackage.TYPE.length) + stringToHex(amsPackage.TYPE);
    amsPacket += task_L + stringToHex('task') + hex16(amsPackage.task.length) + stringToHex(amsPackage.task);

    return amsPacket;
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
                return packageAmsSend(task, TYPE);
            })
            .then(p => {
                return getAmsData(p);
            })
            .then(a => {
                let jdata = processAmsData(a);
                // ams error give a 400
                if (jdata['errors']) {
                    const errors = {
                        resource: 'v1/resource/ams-view/_version/1/',
                        uri: 'v1/ams-view/',
                        task: task,
                        errors: jdata['errors']
                    };
                    // return { errors, statusCode: 500 };
                    throw new RestApiRequestError(400, '', {}, errors);
                } else {
                    // require fields
                    const json = {
                        resource: 'v1/resource/ams-view/_version/1/',
                        uri: 'v1/ams-view/',
                        task: task,
                        site: jdata.site,
                        module: jdata.module,
                        'ams.task.received.date': jdata['ams.task.received.date'],
                        'ams.task.product.group': jdata['ams.task.product.group'],
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
                        'email': jdata['email'],
                        'task.received.by': jdata['task.received.by'],
                        'task.application.specialist': jdata['task.application.specialist'],
                        'task.other.staff': jdata['task.other.staff'],
                        'task.last.edit': jdata['task.last.edit']
                    };
                    // optional fields
                    if (jdata['task.status.completed.date']) {
                        json['task.status.completed.date'] = jdata['task.status.completed.date'];
                    }
                    if (jdata['priority.lists']) {
                        json['priority.lists'] = jdata['priority.lists'];
                    }
                    if (jdata['module.notifications']) {
                        json['module.notifications'] = jdata['module.notifications'];
                    }
                    if (jdata['task.responsible.user']) {
                        json['task.responsible.user'] = jdata['task.responsible.user'];
                    }
                    if (jdata['integrated.modules']) {
                        json['integrated.modules'] = jdata['integrated.modules'];
                    }
                    if (jdata['related.issues']) {
                        json['related.issues'] = jdata['related.issues'];
                    }
                    if (jdata['web.uploaded.files']) {
                        json['web.uploaded.files'] = jdata['web.uploaded.files'];
                    }
                    if (jdata['ams.added.files']) {
                        json['ams.added.files'] = jdata['ams.added.files'];
                    }
                    if (jdata['ams.kb.articles']) {
                        json['ams.kb.articles'] = jdata['ams.kb.articles'];
                    }
                    if (jdata['warnings']) {
                        json['warnings'] = jdata['warnings'];
                    }
                    return { json, statusCode: 200 };
                }
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