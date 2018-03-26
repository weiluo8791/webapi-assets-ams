"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const errors_1 = require("../../../errors");
const Handler_1 = require("../Handler");
const net_1 = require("net");
const os = require("os");
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
function getAmsData(amsPackage) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const HOST = '172.25.0.2';
        const PORT = 1022;
        let totalData = [];
        totalData = [];
        return new Promise((resolve, reject) => {
            let client = net_1.createConnection({ host: HOST, port: PORT }, () => {
                let message = Buffer.from(amsPackage, 'hex');
                client.write(message);
            });
            client.on('data', (data) => {
                totalData.push(data);
            });
            client.on('close', () => {
                let data = Buffer.concat(totalData);
                client.destroy();
                resolve(data);
            });
        });
    });
}
function putAmsData(amsPacket) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const HOST = '172.25.0.2';
        const PORT = 1022;
        let totalData = [];
        totalData = [];
        return new Promise((resolve, reject) => {
            let client = net_1.createConnection({ host: HOST, port: PORT }, () => {
                client.write(amsPacket);
            });
            client.on('data', (data) => {
                totalData.push(data);
            });
            client.on('close', () => {
                let data = Buffer.concat(totalData);
                client.destroy();
                resolve(data);
            });
        });
    });
}
function processAmsData(buf) {
    let i = 0;
    let j = 0;
    let k = 0;
    let header = '';
    let resData = '';
    while (i < buf.length) {
        if (buf.readIntBE(i, 1) === 2) {
            j = i + 1;
            k = buf.readIntBE(j, 1);
            if (k === 1 && buf.readInt8(j + 1) === 10) {
                i = j + 2;
                break;
            }
            let value = buf.slice(j + 1, j + k + 1);
            header += value.toString();
        }
        i = j + k + 1;
    }
    while (i < buf.length) {
        if (buf.readIntBE(i, 1) === 2) {
            j = i + 1;
            k = buf.readIntBE(j, 1);
            let value = buf.slice(j + 1, j + k + 1);
            resData += value.toString();
        }
        if (buf.readIntBE(i, 1) === 1) {
            break;
        }
        i = j + k + 1;
    }
    return JSON.parse(resData);
}
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
function hex16(val) {
    val &= 0xFFFF;
    let hex = val.toString(16).toUpperCase();
    return ('0000' + hex).slice(-4);
}
function stringToHex(str) {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
}
function processPutBody(body) {
    let amsPutBody;
    amsPutBody = body;
    return amsPutBody;
}
function putPackageAmsSend(task, Type, ctx) {
    let localIp = getLocalIp()[0];
    let totalParameters;
    let body;
    totalParameters = '000A';
    body = processPutBody(ctx.body);
    let amsPackage = {
        REMOTE_ADDR: localIp,
        REMOTE_HOST: localIp,
        HTTP_USER_AGENT: 'PostmanRuntime/7.1.1',
        HTTPS: 'off',
        SERVER_PORT: '80',
        SERVER_PORT_SECURE: '0',
        NTUSER: 'WLUO@meditech.com',
        TYPE: Type,
        task: task,
        body: body,
        AMS_PARAM_TOTAL: totalParameters
    };
    console.log(amsPackage);
    let amsPacket = '';
    return amsPacket;
}
function getPackageAmsSend(task, Type, text, start, end) {
    let localIp = getLocalIp()[0];
    let totalParameters;
    if (text) {
        totalParameters = '000C';
    }
    else {
        totalParameters = '0009';
    }
    let amsPackage = {
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
class AMSApis extends Handler_1.Handler {
    _execute_get(ctx, resolvePromise, rejectPromise) {
        let task;
        let range;
        let start;
        let end;
        let TYPE;
        let text;
        Promise.all([ctx.apiInfo])
            .then(([apiInfo]) => {
            task = apiInfo.routeParams['task'];
            switch (apiInfo.id) {
                case 'ams-view._':
                    TYPE = 'TaskGet';
                    return getPackageAmsSend(task, TYPE);
                case 'ams-view._.customerText._':
                    TYPE = 'TaskText';
                    range = apiInfo.routeParams['range'];
                    if (range) {
                        text = 'C';
                    }
                    else {
                        text = 'TC';
                    }
                    start = range.split('-')[0];
                    end = range.split('-')[1];
                    return getPackageAmsSend(task, TYPE, text, start, end);
                case 'ams-view._.inhouseText._':
                    TYPE = 'TaskText';
                    range = apiInfo.routeParams['range'];
                    if (range) {
                        text = 'I';
                    }
                    else {
                        text = 'TI';
                    }
                    start = range.split('-')[0];
                    end = range.split('-')[1];
                    return getPackageAmsSend(task, TYPE, text, start, end);
                default:
                    throw new errors_1.RestApiRequestError(500);
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
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
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
            }
            else if (text === 'I') {
                if (jdata['errors']) {
                    const errors = {
                        resource: 'v1/resource/inhouseText/_version/1/',
                        uri: 'v1/inhouseText/',
                        task: task,
                        errors: jdata['errors']
                    };
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
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
            }
            else if (text === 'TC') {
                if (jdata['errors']) {
                    const errors = {
                        resource: 'v1/resource/inhouseText/_version/1/',
                        uri: 'v1/inhouseText/',
                        task: task,
                        errors: jdata['errors']
                    };
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
                    const json = {
                        resource: 'v1/resource/inhouseText/_version/1/',
                        uri: 'v1/inhouseText/',
                        task: task,
                        text: text,
                        count: jdata['count']
                    };
                    return { json, statusCode: 200 };
                }
            }
            else if (text === 'TI') {
                if (jdata['errors']) {
                    const errors = {
                        resource: 'v1/resource/inhouseText/_version/1/',
                        uri: 'v1/inhouseText/',
                        task: task,
                        errors: jdata['errors']
                    };
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
                    const json = {
                        resource: 'v1/resource/inhouseText/_version/1/',
                        uri: 'v1/inhouseText/',
                        task: task,
                        text: text,
                        count: jdata['count']
                    };
                    return { json, statusCode: 200 };
                }
            }
            else {
                if (jdata['errors']) {
                    const errors = {
                        resource: 'v1/resource/ams-view/_version/1/',
                        uri: 'v1/ams-view/',
                        task: task,
                        errors: jdata['errors']
                    };
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
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
    _execute_put(ctx, resolvePromise, rejectPromise) {
        let task;
        let TYPE;
        Promise.all([ctx.apiInfo])
            .then(([apiInfo]) => {
            task = apiInfo.routeParams['Task'];
            switch (apiInfo.id) {
                case 'ams-edit._':
                    TYPE = 'TaskPut';
                    return putPackageAmsSend(task, TYPE, ctx);
                default:
                    throw new errors_1.RestApiRequestError(500);
            }
        })
            .then(p => {
            return putAmsData(p);
        })
            .then(a => {
            const json = {
                resource: 'v1/resource/ams-edit/_version/1/',
                uri: 'v1/ams-edit/',
                task: task
            };
            return { json, statusCode: 200 };
        })
            .then(resolvePromise, rejectPromise);
    }
    _execute_patch(ctx, resolvePromise, rejectPromise) {
        throw new errors_1.RestApiRequestError(405);
    }
    _execute_delete(ctx, resolvePromise, rejectPromise) {
        throw new errors_1.RestApiRequestError(405);
    }
    _execute_post(ctx, resolvePromise, rejectPromise) {
        throw new errors_1.RestApiRequestError(405);
    }
    _execute_head(dctx, resolvePromise, rejectPromise) {
        throw new errors_1.RestApiRequestError(405);
    }
}
exports.AMSApis = AMSApis;
exports.default = AMSApis;
//# sourceMappingURL=index.js.map