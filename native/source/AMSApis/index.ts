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
// import { ApiInfo } from '../../../util/Url';

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
const text_L = '0004';
const start_L = '0005';
const end_L = '0003';

// interface for AMS package for GET
interface AmsPackageGet {
    REMOTE_ADDR: string;
    REMOTE_HOST: string;
    HTTP_USER_AGENT: string;
    HTTPS: string;
    SERVER_PORT: string;
    SERVER_PORT_SECURE: string;
    NTUSER: string;
    TYPE: string;
    task: string;
    text: string;
    start: string;
    end: string;
    AMS_PARAM_TOTAL: string;
}

// interface for AMS package PUT
interface AmsPackagePut {
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

async function putAmsData(amsPacket: string) {
    // Define constant
    const HOST = '172.25.0.2';
    const PORT = 1022;
    // Define variable
    let totalData = [];

    totalData = [];
    return new Promise((resolve, reject) => {
        let client = createConnection({ host: HOST, port: PORT }, () => {
            // 'connect' listener
            // console.log('connected to server!');
            // let message = Buffer.from('0017000c485454505f52454645524552002d687474703a2f2f61747765626465762e6d656469746563682e636f6d2f70726f6772616d732f416d732e657865000b52454d4f54455f41444452000e3137322e33302e3139302e313933000b52454d4f54455f484f5354000e3137322e33302e3139302e313933000f485454505f555345525f4147454e5400734d6f7a696c6c612f352e30202857696e646f7773204e542031302e303b2057696e36343b2078363429204170706c655765624b69742f3533372e333620284b48544d4c2c206c696b65204765636b6f29204368726f6d652f36332e302e333233392e313332205361666172692f3533372e3336000b485454505f434f4f4b4945019768756273706f7475746b3d61313033633763316232616239613033333932306539376433376634633537393b205f67613d4741312e322e3631353734363238362e313530383530393836363b205f6769643d4741312e322e313438303439323737392e313531363131333330383b205f5f687374633d3138383835393633362e61313033633763316232616239613033333932306539376433376634633537392e313530383936323436343831322e313531343330393238323730382e313531363133383435343530352e363b205f5f756e616d3d366434336436342d31363039336464653162332d32613961383532622d343b205f5f75746d613d3138383835393633362e3631353734363238362e313530383530393836362e313531363134303437312e313531363134303437312e313b205f5f75746d7a3d3138383835393633362e313531363134303437312e312e312e75746d6373723d28646972656374297c75746d63636e3d28646972656374297c75746d636d643d286e6f6e65293b20706373743d5d475255795b706a413533343438330005485454505300036f6666000b5345525645525f504f52540002383000125345525645525f504f52545f53454355524500013000064e54555345520011776c756f406d656469746563682e636f6d000454595045000c5461736b4564697446696c6500045461736b0007363730363533330006434f4f4b4945000f5d475255795b706a41353334343833000357414300055a5a5a4353000464657363001854455354494e4720544845204e4f544946434154494f4e530007636f6e74616374000e416e646572736f6e2c446f6e6e79000c636f6e7461637470686f6e6500000007686f737072656600000005656d61696c0000000a6e6f74696679747970650000000a6c69766573797374656d00026f6e000a7465737473797374656d00026f6e00086465736374657874000474657374000574736b737400014f', 'hex');
            client.write(amsPacket);
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

function putPackageAmsSend(task: string, Type: string, ctx: RequestContext) {
    // Define variable
    let localIp = getLocalIp()[0];
    let totalParameters: string;
    let body: string;
    let bodyJson: string[];

    body = JSON.stringify(ctx.body);
    bodyJson = body.match(/.{1,200}/g);
    totalParameters = hex16(9 + bodyJson.length);

    let amsPackage: AmsPackagePut = {
        REMOTE_ADDR: localIp,
        REMOTE_HOST: localIp,
        HTTP_USER_AGENT: 'PostmanRuntime/7.1.1',
        HTTPS: 'off',
        SERVER_PORT: '80',
        SERVER_PORT_SECURE: '0',
        NTUSER: 'WLUO@meditech.com',
        TYPE: Type,
        task: task,
        AMS_PARAM_TOTAL: totalParameters
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
    bodyJson.forEach((element, index) => {
        let name_L = hex16(('jsonBody' + index).length);
        let name = stringToHex('jsonBody' + index);
        let value_L = hex16(element.length);
        let value = stringToHex(element);
        amsPacket += name_L + name + value_L + value;
    });
    return amsPacket;
}

function getPackageAmsSend(task: string, Type: string, text?: string, start?: string, end?: string) {
    let localIp = getLocalIp()[0];
    let totalParameters: string;

    if (text) {
        totalParameters = '000C';
    } else {
        totalParameters = '0009';
    }
    let amsPackage: AmsPackageGet = {
        REMOTE_ADDR: localIp,
        REMOTE_HOST: localIp,
        HTTP_USER_AGENT: 'PostmanRuntime/7.1.1',
        HTTPS: 'off',
        SERVER_PORT: '80',
        SERVER_PORT_SECURE: '0',
        NTUSER: 'WLUO@meditech.com',
        TYPE: Type,
        task: task,
        text: text,
        start: start,
        end: end,
        AMS_PARAM_TOTAL: totalParameters
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

    if (text) {
        amsPacket += text_L + stringToHex('text') + hex16(amsPackage.text.length) + stringToHex(amsPackage.text);
        amsPacket += start_L + stringToHex('start') + hex16(amsPackage.start.length) + stringToHex(amsPackage.start);
        amsPacket += end_L + stringToHex('end') + hex16(amsPackage.end.length) + stringToHex(amsPackage.end);
    }

    return amsPacket;
}

export class AMSApis extends Handler {
    /**
     * @inheritDoc
     */
    protected _execute_get(ctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {

        let task: string;
        let range: string;
        let start: string;
        let end: string;
        let TYPE: string;
        let text: string;

        Promise.all([ctx.apiInfo])
            .then(([apiInfo]) => {
                task = apiInfo.routeParams['task'];
                switch (apiInfo.id) {
                    case 'ams-view._':
                        TYPE = 'TaskGet';
                        return getPackageAmsSend(task, TYPE);
                    case 'ams-view._.customerText._':
                        TYPE = 'TaskGetText';
                        range = apiInfo.routeParams['range'];
                        if (range) {
                            text = 'C';
                        } else {
                            text = 'TC';
                        }
                        start = range.split('-')[0];
                        end = range.split('-')[1];
                        return getPackageAmsSend(task, TYPE, text, start, end);
                    case 'ams-view._.inhouseText._':
                        TYPE = 'TaskGetText';
                        range = apiInfo.routeParams['range'];
                        if (range) {
                            text = 'I';
                        } else {
                            text = 'TI';
                        }
                        start = range.split('-')[0];
                        end = range.split('-')[1];
                        return getPackageAmsSend(task, TYPE, text, start, end);
                    default:
                        throw new RestApiRequestError(500);
                }
            })
            .then(p => {
                return getAmsData(p);
            })
            .then(a => {
                let jdata = processAmsData(a);

                if (text === 'C') {
                    if (jdata['errors']) {
                        const errors = {
                            resource: 'v1/resource/customerText/_version/1/',
                            uri: 'v1/customerText/',
                            task: task,
                            errors: jdata['errors']
                        };
                        // return { errors, statusCode: 500 };
                        throw new RestApiRequestError(400, '', {}, errors);
                    } else {
                        // require fields
                        const json = {
                            resource: 'v1/resource/customerText/_version/1/',
                            uri: 'v1/customerText/',
                            task: task,
                            text: text,
                            start: start,
                            end: end,
                            event: jdata['event']
                        };
                        return { json, statusCode: 200 };
                    }
                } else if (text === 'I') {
                    if (jdata['errors']) {
                        const errors = {
                            resource: 'v1/resource/inhouseText/_version/1/',
                            uri: 'v1/inhouseText/',
                            task: task,
                            errors: jdata['errors']
                        };
                        // return { errors, statusCode: 500 };
                        throw new RestApiRequestError(400, '', {}, errors);
                    } else {
                        // require fields
                        const json = {
                            resource: 'v1/resource/inhouseText/_version/1/',
                            uri: 'v1/inhouseText/',
                            task: task,
                            text: text,
                            start: start,
                            end: end,
                            event: jdata['event']
                        };
                        return { json, statusCode: 200 };
                    }
                } else if (text === 'TC') {
                    if (jdata['errors']) {
                        const errors = {
                            resource: 'v1/resource/inhouseText/_version/1/',
                            uri: 'v1/inhouseText/',
                            task: task,
                            errors: jdata['errors']
                        };
                        // return { errors, statusCode: 500 };
                        throw new RestApiRequestError(400, '', {}, errors);
                    } else {
                        // require fields
                        const json = {
                            resource: 'v1/resource/inhouseText/_version/1/',
                            uri: 'v1/inhouseText/',
                            task: task,
                            text: text,
                            count: jdata['count']
                        };
                        return { json, statusCode: 200 };
                    }
                } else if (text === 'TI') {
                    if (jdata['errors']) {
                        const errors = {
                            resource: 'v1/resource/inhouseText/_version/1/',
                            uri: 'v1/inhouseText/',
                            task: task,
                            errors: jdata['errors']
                        };
                        // return { errors, statusCode: 500 };
                        throw new RestApiRequestError(400, '', {}, errors);
                    } else {
                        // require fields
                        const json = {
                            resource: 'v1/resource/inhouseText/_version/1/',
                            uri: 'v1/inhouseText/',
                            task: task,
                            text: text,
                            count: jdata['count']
                        };
                        return { json, statusCode: 200 };
                    }
                } else {
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
                }
            })
            .then(resolvePromise, rejectPromise);
    }

    /**
     * @inheritDoc
     */
    protected _execute_put(ctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {
        // Define variable
        let task: string;
        let TYPE: string;
        // let body: string;

        Promise.all([ctx.apiInfo])
            .then(([apiInfo]) => {
                task = apiInfo.routeParams['Task'];
                switch (apiInfo.id) {
                    case 'ams-edit._':
                        TYPE = 'TaskPut';
                        return putPackageAmsSend(task, TYPE, ctx);
                    default:
                        throw new RestApiRequestError(500);
                }
            })
            .then(p => {
                return putAmsData(p);
            })
            .then(a => {
                // let jdata = processAmsData(a);
                const json = {
                    resource: 'v1/resource/ams-edit/_version/1/',
                    uri: 'v1/ams-edit/',
                    task: task
                };
                return { json, statusCode: 200 };
            })
            .then(resolvePromise, rejectPromise);
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