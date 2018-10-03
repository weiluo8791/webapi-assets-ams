import { RestApiRequestError } from '../../../errors';
import { Handler } from '../Handler';
import { Result } from '../../Protocol';
import { RequestContext } from '../../../RequestContext';
import { createConnection } from 'net';
import * as os from 'os';

import * as path from 'path';
import JsonPatch from 'fast-json-patch';
import * as StringUtil from '../../../util/String';
import * as FsUtil from '../../../util/Filesystem';
import { CacheClass, LoadResult, del as deleteCache, update as updateCache, get as getCache } from '../../../Cache';
import { resolve as resolveModel } from '../../../models/Model';
import { TYPEURI as resourceTypeUri, Resource } from '../../../models/v1/resource';


// constant for name length
const REMOTE_ADDR_L = '000b';
const REMOTE_HOST_L = '000b';
const HTTP_USER_AGENT_L = '000f';
const HTTPS_L = '0005';
const SERVER_PORT_L = '000b';
const SERVER_PORT_SECURE_L = '0012';
const NTUSER_L = '0006';
const TYPE_L = '0004';
const Task_L = '0004';
const WAC_L = '0003';
const COOKIE_L = '0006';
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
    WAC: string;
    COOKIE: string;
    task: string;
    AMS_PARAM_TOTAL: string;
}

// async GET function for sending ams packet and getting response from AMS
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
            // console.log(message.toString());
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
            // console.log(data.toString());
            resolve(data);
        });
    });
}

// async PUT function for sending ams packet and getting response from AMS
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
            let message = Buffer.from(amsPacket, 'hex');
            // console.log(message.toString());
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
            // console.log(data.toString());
            resolve(data);
        });
    });
}

// process AMS buffer response, separate header and body
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

/* // pad index with zero on left
function pad(num, size) {
    let s = num + '';
    while (s.length < size) {
        s = '0' + s;
    }
    return s;
} */

// setup a AMS PUT packet
function putPackageAmsSend(task: string, Type: string, ctx: RequestContext) {
    // Define variable
    let localIp = getLocalIp()[0];
    let totalParameters: string;
    let body: string;
    let bodyJson: string[];

    body = JSON.stringify(ctx.body);
    bodyJson = body.match(/.{1,100}/g);
    // totalParameters = hex16(11 + bodyJson.length);
    totalParameters = hex16(12);

    let amsPackage: AmsPackagePut = {
        REMOTE_ADDR: localIp,
        REMOTE_HOST: localIp,
        HTTP_USER_AGENT: 'PostmanRuntime/7.1.1',
        HTTPS: 'off',
        SERVER_PORT: '80',
        SERVER_PORT_SECURE: '0',
        NTUSER: 'WLUO@MEDITECH.COM',
        TYPE: Type,
        WAC: 'ZZZ',
        COOKIE: 'RYCVcUkbZ382619',
        task: task,
        AMS_PARAM_TOTAL: totalParameters
    };

    let amsPacket = '';
    let body_L = hex16(body.length);
    let bodyName_L = hex16(8);
    amsPacket += amsPackage.AMS_PARAM_TOTAL;
    amsPacket += REMOTE_ADDR_L + stringToHex('REMOTE_ADDR') + hex16(amsPackage.REMOTE_ADDR.length) + stringToHex(amsPackage.REMOTE_ADDR);
    amsPacket += REMOTE_HOST_L + stringToHex('REMOTE_HOST') + hex16(amsPackage.REMOTE_HOST.length) + stringToHex(amsPackage.REMOTE_HOST);
    amsPacket += HTTP_USER_AGENT_L + stringToHex('HTTP_USER_AGENT') + hex16(amsPackage.HTTP_USER_AGENT.length) + stringToHex(amsPackage.HTTP_USER_AGENT);
    amsPacket += HTTPS_L + stringToHex('HTTPS') + hex16(amsPackage.HTTPS.length) + stringToHex(amsPackage.HTTPS);
    amsPacket += SERVER_PORT_L + stringToHex('SERVER_PORT') + hex16(amsPackage.SERVER_PORT.length) + stringToHex(amsPackage.SERVER_PORT);
    amsPacket += SERVER_PORT_SECURE_L + stringToHex('SERVER_PORT_SECURE') + hex16(amsPackage.SERVER_PORT_SECURE.length) + stringToHex(amsPackage.SERVER_PORT_SECURE);
    amsPacket += NTUSER_L + stringToHex('NTUSER') + hex16(amsPackage.NTUSER.length) + stringToHex(amsPackage.NTUSER);
    amsPacket += TYPE_L + stringToHex('TYPE') + hex16(amsPackage.TYPE.length) + stringToHex(amsPackage.TYPE);
    amsPacket += Task_L + stringToHex('task') + hex16(amsPackage.task.length) + stringToHex(amsPackage.task);
    amsPacket += WAC_L + stringToHex('WAC') + hex16(amsPackage.WAC.length) + stringToHex(amsPackage.WAC);
    amsPacket += COOKIE_L + stringToHex('COOKIE') + hex16(amsPackage.COOKIE.length) + stringToHex(amsPackage.COOKIE);
    /*     bodyJson.forEach((element, index) => {
            let name_L = hex16(('jsonBody' + pad(index, 5)).length);
            let name = stringToHex('jsonBody' + pad(index, 5));
            let value_L = hex16(element.length);
            let value = stringToHex(element);
            amsPacket += name_L + name + value_L + value;
        }); */
    amsPacket += bodyName_L + stringToHex('jsonBody') + body_L + stringToHex(body);

    return amsPacket;
}

// setup a AMS GET packet
function getPackageAmsSend(task: string, type: string, ntuser: string, text?: string, start?: string, end?: string) {
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
        NTUSER: ntuser + '@MEDITECH.COM',
        TYPE: type,
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
    amsPacket += Task_L + stringToHex('task') + hex16(amsPackage.task.length) + stringToHex(amsPackage.task);

    if (text) {
        amsPacket += text_L + stringToHex('text') + hex16(amsPackage.text.length) + stringToHex(amsPackage.text);
        amsPacket += start_L + stringToHex('start') + hex16(amsPackage.start.length) + stringToHex(amsPackage.start);
        amsPacket += end_L + stringToHex('end') + hex16(amsPackage.end.length) + stringToHex(amsPackage.end);
    }

    return amsPacket;
}



export abstract class AMSApis extends Handler {

    protected abstract dataPath: string;
    protected abstract systemGeneratedId: boolean;
    protected abstract resourceUri: string;
    protected abstract resourceListUri: string;
    protected abstract formUri(id: string): string;

    protected preCommitHook(json: any, ctx: RequestContext): Promise<void> {
        return Promise.resolve();
    }

    protected postCommitHook(json: any, ctx: RequestContext): Promise<void> {
        return Promise.resolve();
    }

    protected preDeleteHook(id: string, ctx: RequestContext): Promise<void> {
        return Promise.resolve();
    }

    protected postDeleteHook(id: string, ctx: RequestContext): Promise<void> {
        return Promise.resolve();
    }

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
        let NTUSER: string;

        // default user is ROGERS
        NTUSER = ctx.query['NTUSER'] ? ctx.query['NTUSER'] : 'ROGERS';
        Promise.all([ctx.apiInfo])
            .then(([apiInfo]) => {
                task = apiInfo.routeParams['task'];
                switch (apiInfo.id) {
                    case 'ams-view._':
                        TYPE = 'TaskGet';
                        return getPackageAmsSend(task, TYPE, NTUSER);
                    case 'ams-view._.question':
                        TYPE = 'TaskGetQuestions';
                        return getPackageAmsSend(task, TYPE, NTUSER);
                    case 'ams-view._.customerText._':
                        TYPE = 'TaskGetText';
                        range = apiInfo.routeParams['range'];
                        if (range) {
                            start = range.split('-')[0];
                            end = range.split('-')[1];
                        }
                        if (start && end) {
                            text = 'C';
                        } else {
                            text = 'TC';
                        }
                        return getPackageAmsSend(task, TYPE, NTUSER, text, start, end);
                    case 'ams-view._.inhouseText._':
                        TYPE = 'TaskGetText';
                        range = apiInfo.routeParams['range'];
                        if (range) {
                            start = range.split('-')[0];
                            end = range.split('-')[1];
                        }
                        if (start && end) {
                            text = 'I';
                        } else {
                            text = 'TI';
                        }
                        return getPackageAmsSend(task, TYPE, NTUSER, text, start, end);
                    default:
                        throw new RestApiRequestError(500);
                }
            })
            .then(p => {
                return getAmsData(p);
            })
            .then(a => {
                let jdata = processAmsData(a);
                // customerText
                if (text === 'C') {
                    // error give 400
                    if (jdata['errors'] || jdata['error.code'] || jdata['error.message']) {
                        const errors = {
                            resource: 'v1/resource/customerText/_version/1/',
                            uri: 'v1/customerText/',
                            task: task,
                            errors: jdata['errors'],
                            'error.code': jdata['error.code'],
                            'error.message': jdata['error.message']
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
                            event: jdata['events']
                        };
                        return { json, statusCode: 200 };
                    }
                } else if (text === 'I') {
                    // error give 400
                    if (jdata['errors'] || jdata['error.code'] || jdata['error.message']) {
                        const errors = {
                            resource: 'v1/resource/inhouseText/_version/1/',
                            uri: 'v1/inhouseText/',
                            task: task,
                            errors: jdata['errors'],
                            'error.code': jdata['error.code'],
                            'error.message': jdata['error.message']
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
                            event: jdata['events']
                        };
                        return { json, statusCode: 200 };
                    }
                } else if (text === 'TC') {
                    // error give 400
                    if (jdata['errors'] || jdata['error.code'] || jdata['error.message']) {
                        const errors = {
                            resource: 'v1/resource/customerText/_version/1/',
                            uri: 'v1/customerText/',
                            task: task,
                            errors: jdata['errors'],
                            'error.code': jdata['error.code'],
                            'error.message': jdata['error.message']
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
                            count: jdata['count']
                        };
                        return { json, statusCode: 200 };
                    }
                } else if (text === 'TI') {
                    // error give 400
                    if (jdata['errors'] || jdata['error.code'] || jdata['error.message']) {
                        const errors = {
                            resource: 'v1/resource/inhouseText/_version/1/',
                            uri: 'v1/inhouseText/',
                            task: task,
                            errors: jdata['errors'],
                            'error.code': jdata['error.code'],
                            'error.message': jdata['error.message']
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
                } else if (jdata['questions']) {
                    // error give 400
                    if (jdata['errors'] || jdata['error.code'] || jdata['error.message']) {
                        const errors = {
                            resource: 'v1/resource/question/_version/1/',
                            uri: 'v1/question/_version/1/',
                            task: task,
                            errors: jdata['errors'],
                            'error.code': jdata['error.code'],
                            'error.message': jdata['error.message']
                        };
                        // return { errors, statusCode: 500 };
                        throw new RestApiRequestError(400, '', {}, errors);
                        // response
                    } else {
                        // require fields
                        const json = {
                            resource: 'v1/resource/question/_version/1/',
                            uri: 'v1/question/',
                            task: task,
                            ntuser: 'WLUO@MEDITECH.COM'
                        };
                        // optional fields
                        if (jdata['questions']) {
                            json['questions'] = jdata['questions'];
                        }
                        return { json, statusCode: 200 };
                    }
                } else {
                    // ams error give a 400
                    if (jdata['errors'] || jdata['error.code'] || jdata['error.message']) {
                        const errors = {
                            resource: 'v1/resource/ams-view/_version/1/',
                            uri: 'v1/ams-view/',
                            task: task,
                            errors: jdata['errors'],
                            'error.code': jdata['error.code'],
                            'error.message': jdata['error.message']
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
                            ntuser: jdata.ntuser,
                            module: jdata.module,
                            email: jdata.email,
                            staff: jdata.staff,
                            'ams.user': jdata['ams.user'],
                            'ams.task.received.date': jdata['ams.task.received.date'],
                            'task.product.group': jdata['task.product.group'],
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
                            'task.received.by': jdata['task.received.by'],
                            'task.last.edit': jdata['task.last.edit'],
                            'task.category': jdata['task.category'],
                            'ams.task.target.date': jdata['ams.task.target.date'],
                            'task.support.group': jdata['task.support.group']
                        };
                        // optional fields
                        if (jdata['ams.task.trap.file']) {
                            json['ams.task.trap.file'] = jdata['ams.task.trap.file'];
                        }
                        if (jdata['ams.task.shift.date']) {
                            json['ams.task.shift.date'] = jdata['ams.task.shift.date'];
                        }
                        if (jdata['task.shift']) {
                            json['task.shift'] = jdata['task.shift'];
                        }
                        if (jdata['task.assigned.to']) {
                            json['task.assigned.to'] = jdata['task.assigned.to'];
                        }
                        if (jdata['task.status.completed.date']) {
                            json['task.status.completed.date'] = jdata['task.status.completed.date'];
                        }
                        if (jdata['priority.lists']) {
                            json['priority.lists'] = jdata['priority.lists'];
                        }
                        if (jdata['module.notifications']) {
                            json['module.notifications'] = jdata['module.notifications'];
                        }
                        if (jdata['related.issues']) {
                            json['related.issues'] = jdata['related.issues'];
                        }
                        if (jdata['task.keywords']) {
                            json['task.keywords'] = jdata['task.keywords'];
                        }
                        if (jdata['programs']) {
                            json['programs'] = jdata['programs'];
                        }
                        if (jdata['development']) {
                            json['development'] = jdata['development'];
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
                        if (jdata['warning.text']) {
                            json['warning.text'] = jdata['warning.text'];
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

        Promise.all([ctx.apiInfo])
            .then(([apiInfo]) => {
                task = apiInfo.routeParams['task'];
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
                let jdata = processAmsData(a);
                if (jdata['errors']) {
                    const errors = {
                        resource: 'v1/resource/ams-edit/_version/1/',
                        uri: 'v1/ams-edit/',
                        task: task,
                        errors: jdata['errors']
                    };
                    throw new RestApiRequestError(400, '', {}, errors);
                } else {
                    const json = {
                        resource: 'v1/resource/ams-edit/_version/1/',
                        uri: 'v1/ams-edit/',
                        task: task,
                        site: jdata.site,
                        module: jdata.module,
                        ntuser: jdata.NTUSER,
                        'task.last.edit': jdata['task.last.edit']
                    };
                    return { json, statusCode: 200 };
                }
            })
            .then(resolvePromise, rejectPromise);
    }

    /**
     * @inheritDoc
     */
    protected _execute_patch(ctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {
        Promise.all([ctx.apiInfo])
            .then(([apiInfo]) => {

                return this.patch(apiInfo.routeParams['Task'], ctx.body, ctx.headers['if-match'], ctx);
            })
            .then(json => {
                return { statusCode: 200, json };
            })
            .then(resolvePromise)
            .catch(rejectPromise);

        // throw new RestApiRequestError(405);
    }

    /**
     * @inheritDoc
     */
    protected _execute_delete(ctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {
        Promise.all([ctx.apiInfo])
            .then(([apiInfo]) => {

                return this.delete(apiInfo.routeParams['id'], ctx);
            })
            .then(json => {
                return { statusCode: 204 };
            })
            .then(resolvePromise)
            .catch(rejectPromise);
        // throw new RestApiRequestError(405);
    }

    /**
     * @inheritDoc
     */
    protected _execute_post(ctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {
        this.create(ctx.body, ctx)
            .then(json => {
                return { statusCode: 200, json };
            })
            .then(resolvePromise)
            .catch(rejectPromise);
        // throw new RestApiRequestError(405);
    }

    /**
     * @inheritDoc
     */
    protected _execute_head(dctx: RequestContext, resolvePromise: (result: Result) => void, rejectPromise: (err: any) => void): void {

        throw new RestApiRequestError(405);
    }

    private patch(id: string, patch: JsonPatch.Operation[], ifMatch: string, ctx: RequestContext): Promise<any> {

        patch.forEach(instruction => {

            switch (instruction.path) {
                case '/task':
                case '/resource':
                    throw new RestApiRequestError(400);
            }
        });

        return this.find(id, ctx)
            .then(json => {
                if (json.etag !== ifMatch) {
                    throw new RestApiRequestError(409);
                }
                JsonPatch.applyPatch(json, patch);
                return this.save(json, ctx);
            });
    }

    protected filePath(id: string) {

        const file = path.normalize(path.join(this.dataPath, encodeURIComponent(id) + '.json'));

        if (!file.startsWith(this.dataPath)) {
            throw new RestApiRequestError(400);
        }

        return file;
    }
    private save<T extends { id: string, uri: string }>(json: T, ctx: RequestContext): Promise<T> {

        const file = this.filePath(json.id);
        const uri = json.uri = this.formUri(json.id);
        StringUtil.applyEtag(json);

        return FsUtil.directoryExists(this.dataPath)
            .then((exists) => {

                if (!exists) {
                    return FsUtil.mkdir(this.dataPath);
                }
            })
            .then(() => this.preCommitHook(json, ctx))
            .then(() => FsUtil.writeJson(file, json))
            .then(() => this.getResourceCacheSettings(ctx))
            .then(cacheSettings => updateCache(CacheClass.Application, uri, {
                update: true,
                data: json,
                tcfOverride: cacheSettings.getTimeConsideredFresh(),
                ttlOverride: cacheSettings.getTimeToLive()
            }, ctx))
            .then(() => this.postCommitHook(json, ctx))
            .then(() => json);
    }

    private create<T extends { id: string, uri: string, etag: string }>(json: T, ctx: RequestContext): Promise<T> {

        const id = json.id = this.systemGeneratedId ? StringUtil.uuid() : json.id;

        return this.find(id, ctx)
            .then(current => {
                throw new RestApiRequestError(409);
            })
            .catch(err => {
                if (err instanceof RestApiRequestError && err.responseCode === 404) {
                    return this.save(json, ctx);
                }
                throw err;
            });
    }

    private getResourceCacheSettings(ctx: RequestContext) {
        return resolveModel(this.resourceUri, ctx)
            .then((resource: Resource) => {
                if (!resource.isTypeOf(resourceTypeUri)) {
                    throw new Error('resourceUri provided is not a resource.');
                }

                return resource.cache;
            });
    }

    private find(id: string, ctx: RequestContext) {

        const file = this.filePath(id);

        return getCache(CacheClass.Application, this.formUri(id), ctx, (): Promise<LoadResult> => {

            return FsUtil.readJson(file)
                .catch(err => {
                    throw new RestApiRequestError(404);
                })
                .then(json => {
                    return this.getResourceCacheSettings(ctx)
                        .then(cacheSettings => {
                            return {
                                update: true,
                                data: json,
                                tcfOverride: cacheSettings.getTimeConsideredFresh(),
                                ttlOverride: cacheSettings.getTimeToLive()
                            };
                        });
                });
        });
    }

    private delete(id: string, ctx: RequestContext) {

        return this.preDeleteHook(id, ctx)
            .then(() => FsUtil.unlink(this.filePath(id)))
            .then(() => deleteCache(CacheClass.Application, this.formUri(id), ctx))
            .then(() => this.postDeleteHook(id, ctx));
    }

}

export default AMSApis;