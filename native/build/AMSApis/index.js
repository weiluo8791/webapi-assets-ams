"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const errors_1 = require("../../../errors");
const Handler_1 = require("../Handler");
const net_1 = require("net");
const os = require("os");
const path = require("path");
const fast_json_patch_1 = require("fast-json-patch");
const StringUtil = require("../../../util/String");
const FsUtil = require("../../../util/Filesystem");
const Cache_1 = require("../../../Cache");
const Model_1 = require("../../../models/Model");
const resource_1 = require("../../../models/v1/resource");
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
const COOKIE_L = '0009';
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
                let message = Buffer.from(amsPacket, 'hex');
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
function putPackageAmsSend(task, type, ctx) {
    let localIp = getLocalIp()[0];
    let totalParameters;
    let body;
    let ntuser;
    let bodyJson;
    ntuser = ctx.body.ntuser;
    body = JSON.stringify(ctx.body);
    bodyJson = body.match(/.{1,100}/g);
    totalParameters = hex16(12);
    let amsPackage = {
        REMOTE_ADDR: localIp,
        REMOTE_HOST: localIp,
        HTTP_USER_AGENT: 'PostmanRuntime/7.1.1',
        HTTPS: 'off',
        SERVER_PORT: '80',
        SERVER_PORT_SECURE: '0',
        NTUSER: ntuser,
        TYPE: type,
        WAC: 'ZZZ',
        NO_COOKIE: '1',
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
    amsPacket += COOKIE_L + stringToHex('NO_COOKIE') + hex16(amsPackage.NO_COOKIE.length) + stringToHex(amsPackage.NO_COOKIE);
    amsPacket += bodyName_L + stringToHex('jsonBody') + body_L + stringToHex(body);
    return amsPacket;
}
function getPackageAmsSend(task, type, ntuser, text, start, end) {
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
class AMSApis extends Handler_1.Handler {
    preCommitHook(json, ctx) {
        return Promise.resolve();
    }
    postCommitHook(json, ctx) {
        return Promise.resolve();
    }
    preDeleteHook(id, ctx) {
        return Promise.resolve();
    }
    postDeleteHook(id, ctx) {
        return Promise.resolve();
    }
    _execute_get(ctx, resolvePromise, rejectPromise) {
        let task;
        let range;
        let start;
        let end;
        let TYPE;
        let text;
        let NTUSER;
        NTUSER = ctx.query['NTUSER'] ? ctx.query['NTUSER'] : 'ROGERS';
        ctx.apiInfo
            .then((apiInfo) => {
            task = apiInfo.routeParams['task'];
            switch (apiInfo.id) {
                case 'ams-view._':
                    TYPE = 'TaskGet';
                    return getPackageAmsSend(task, TYPE, NTUSER);
                case 'ams-task._':
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
                    }
                    else {
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
                    }
                    else {
                        text = 'TI';
                    }
                    return getPackageAmsSend(task, TYPE, NTUSER, text, start, end);
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
                if (jdata['errors'] || jdata['errorCode'] || jdata['errorMessage']) {
                    const errors = {
                        resource: 'v1/resource/customerText/_version/1/',
                        uri: 'v1/resource/customerText/_version/1/',
                        task: task,
                        errors: jdata['errors'],
                        'errorCode': jdata['errorCode'],
                        'errorMessage': jdata['errorMessage']
                    };
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
                    const json = {
                        resource: 'v1/resource/customerText/_version/1/',
                        uri: 'v1/resource/customerText/_version/1/',
                        task: task,
                        ntuser: jdata.ntuser,
                        'amsUser': jdata['amsUser'],
                        text: text,
                        start: start,
                        end: end,
                        event: jdata['events']
                    };
                    return { json, statusCode: 200 };
                }
            }
            else if (text === 'I') {
                if (jdata['errors'] || jdata['errorCode'] || jdata['errorMessage']) {
                    const errors = {
                        resource: 'v1/resource/inhouseText/_version/1/',
                        uri: 'v1/resource/inhouseText/_version/1/',
                        task: task,
                        errors: jdata['errors'],
                        'errorCode': jdata['errorCode'],
                        'errorMessage': jdata['errorMessage']
                    };
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
                    const json = {
                        resource: 'v1/resource/inhouseText/_version/1/',
                        uri: 'v1/resource/inhouseText/_version/1/',
                        task: task,
                        ntuser: jdata.ntuser,
                        'amsUser': jdata['amsUser'],
                        text: text,
                        start: start,
                        end: end,
                        event: jdata['events']
                    };
                    return { json, statusCode: 200 };
                }
            }
            else if (text === 'TC') {
                if (jdata['errors'] || jdata['errorCode'] || jdata['errorMessage']) {
                    const errors = {
                        resource: 'v1/resource/customerText/_version/1/',
                        uri: 'v1/resource/customerText/_version/1/',
                        task: task,
                        errors: jdata['errors'],
                        'errorCode': jdata['errorCode'],
                        'errorMessage': jdata['errorMessage']
                    };
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
                    const json = {
                        resource: 'v1/resource/customerText/_version/1/',
                        uri: 'v1/resource/customerText/_version/1/',
                        task: task,
                        ntuser: jdata.ntuser,
                        'amsUser': jdata['amsUser'],
                        text: text,
                        count: jdata['count']
                    };
                    return { json, statusCode: 200 };
                }
            }
            else if (text === 'TI') {
                if (jdata['errors'] || jdata['errorCode'] || jdata['errorMessage']) {
                    const errors = {
                        resource: 'v1/resource/inhouseText/_version/1/',
                        uri: 'v1/resource/inhouseText/_version/1/',
                        task: task,
                        errors: jdata['errors'],
                        'errorCode': jdata['errorCode'],
                        'errorMessage': jdata['errorMessage']
                    };
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
                    const json = {
                        resource: 'v1/resource/inhouseText/_version/1/',
                        uri: 'v1/resource/inhouseText/_version/1/',
                        task: task,
                        ntuser: jdata.ntuser,
                        'amsUser': jdata['amsUser'],
                        text: text,
                        count: jdata['count']
                    };
                    return { json, statusCode: 200 };
                }
            }
            else if (jdata['questions']) {
                if (jdata['errors'] || jdata['errorCode'] || jdata['errorMessage']) {
                    const errors = {
                        resource: 'v1/resource/question/_version/1/',
                        uri: 'v1/resource/question/_version/1/',
                        task: task,
                        errors: jdata['errors'],
                        'errorCode': jdata['errorCode'],
                        'errorMessage': jdata['errorMessage']
                    };
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
                    const json = {
                        resource: 'v1/resource/question/_version/1/',
                        uri: 'v1/resource/question/_version/1/',
                        task: task,
                        ntuser: jdata.ntuser,
                        'amsUser': jdata['amsUser']
                    };
                    if (jdata['questions']) {
                        json['questions'] = jdata['questions'];
                    }
                    return { json, statusCode: 200 };
                }
            }
            else {
                if (jdata['errors'] || jdata['errorCode'] || jdata['errorMessage']) {
                    const errors = {
                        resource: 'v1/resource/ams-task/_version/1/',
                        uri: 'v1/resource/ams-task/_version/1/',
                        task: task,
                        errors: jdata['errors'],
                        'errorCode': jdata['errorCode'],
                        'errorMessage': jdata['errorMessage']
                    };
                    throw new errors_1.RestApiRequestError(400, '', {}, errors);
                }
                else {
                    const json = {
                        resource: 'v1/resource/ams-task/_version/1/',
                        uri: 'v1/resource/ams-task/_version/1/',
                        task: task,
                        site: jdata.site,
                        ntuser: jdata.ntuser,
                        module: jdata.module,
                        email: jdata.email,
                        staff: jdata.staff,
                        'amsUser': jdata['amsUser'],
                        'receivedDate': jdata['receivedDate'],
                        'productGroup': jdata['productGroup'],
                        'entryTime': jdata['entryTime'],
                        'status': jdata['status'],
                        'priority': jdata['priority'],
                        'patientSafety': jdata['patientSafety'],
                        'referenceNumber': jdata['referenceNumber'],
                        'description': jdata['description'],
                        'requestType': jdata['requestType'],
                        'liveSystem': jdata['liveSystem'],
                        'testSystem': jdata['testSystem'],
                        'updateSystem': jdata['updateSystem'],
                        'contact': jdata['contact'],
                        'contactPhone': jdata['contactPhone'],
                        'receivedBy': jdata['receivedBy'],
                        'lastEdit': jdata['lastEdit'],
                        'category': jdata['category'],
                        'targetDate': jdata['targetDate'],
                        'supportGroup': jdata['supportGroup']
                    };
                    if (jdata['trapFile']) {
                        json['trapFile'] = jdata['trapFile'];
                    }
                    if (jdata['shiftDate']) {
                        json['shiftDate'] = jdata['shiftDate'];
                    }
                    if (jdata['shift']) {
                        json['shift'] = jdata['shift'];
                    }
                    if (jdata['assignedTo']) {
                        json['assignedTo'] = jdata['assignedTo'];
                    }
                    if (jdata['statusCompletedDate']) {
                        json['statusCompletedDate'] = jdata['statusCompletedDate'];
                    }
                    if (jdata['priorityLists']) {
                        json['priorityLists'] = jdata['priorityLists'];
                    }
                    if (jdata['moduleNotifications']) {
                        json['moduleNotifications'] = jdata['moduleNotifications'];
                    }
                    if (jdata['relatedIssues']) {
                        json['relatedIssues'] = jdata['relatedIssues'];
                    }
                    if (jdata['keywords']) {
                        json['keywords'] = jdata['keywords'];
                    }
                    if (jdata['programs']) {
                        json['programs'] = jdata['programs'];
                    }
                    if (jdata['development']) {
                        json['development'] = jdata['development'];
                    }
                    if (jdata['webUploadedFiles']) {
                        json['webUploadedFiles'] = jdata['webUploadedFiles'];
                    }
                    if (jdata['amsAddedFiles']) {
                        json['amsAddedFiles'] = jdata['amsAddedFiles'];
                    }
                    if (jdata['kbArticles']) {
                        json['kbArticles'] = jdata['kbArticles'];
                    }
                    if (jdata['warnings']) {
                        json['warnings'] = jdata['warnings'];
                    }
                    if (jdata['warningText']) {
                        json['warningText'] = jdata['warningText'];
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
        ctx.apiInfo
            .then((apiInfo) => {
            task = apiInfo.routeParams['task'];
            switch (apiInfo.id) {
                case 'ams-edit._':
                    TYPE = 'TaskPut';
                    return putPackageAmsSend(task, TYPE, ctx);
                case 'ams-task._':
                    TYPE = 'TaskPut';
                    return putPackageAmsSend(task, TYPE, ctx);
                case 'ams-edit._.addText':
                    TYPE = 'TaskPutText';
                    return putPackageAmsSend(task, TYPE, ctx);
                case 'ams-edit._.sendEmail':
                    TYPE = 'TaskEmail';
                    return putPackageAmsSend(task, TYPE, ctx);
                default:
                    throw new errors_1.RestApiRequestError(500);
            }
        })
            .then(p => {
            return putAmsData(p);
        })
            .then(a => {
            let jdata = processAmsData(a);
            switch (TYPE) {
                case 'TaskPut':
                    if (jdata['errors']) {
                        const errors = {
                            resource: 'v1/resource/ams-edit/_version/1/',
                            uri: 'v1/resource/ams-edit/_version/1/',
                            task: task,
                            errors: jdata['errors']
                        };
                        throw new errors_1.RestApiRequestError(400, '', {}, errors);
                    }
                    else {
                        const json = {
                            resource: 'v1/resource/ams-edit/_version/1/',
                            uri: 'v1/resource/ams-edit/_version/1/',
                            task: task,
                            site: jdata.site,
                            module: jdata.module,
                            ntuser: jdata.ntuser,
                            'task.last.edit': jdata['task.last.edit']
                        };
                        return { json, statusCode: 200 };
                    }
                case 'TaskPutText':
                    if (jdata['errors']) {
                        const errors = {
                            resource: 'v1/resource/addText/_version/1/',
                            uri: 'v1/resource/addText/_version/1/',
                            task: task,
                            errors: jdata['errors']
                        };
                        throw new errors_1.RestApiRequestError(400, '', {}, errors);
                    }
                    else {
                        const json = {
                            resource: 'v1/resource/addText/_version/1/',
                            uri: 'v1/resource/addText/_version/1/',
                            task: task,
                            site: jdata.site,
                            ntuser: jdata.ntuser,
                            'task.last.edit': jdata['task.last.edit']
                        };
                        return { json, statusCode: 200 };
                    }
                case 'TaskEmail':
                    if (jdata['errors']) {
                        const errors = {
                            resource: 'v1/resource/sendEmail/_version/1/',
                            uri: 'v1/resource/sendEmail/_version/1/',
                            task: task,
                            errors: jdata['errors']
                        };
                        throw new errors_1.RestApiRequestError(400, '', {}, errors);
                    }
                    else {
                        const json = {
                            resource: 'v1/resource/sendEmail/_version/1/',
                            uri: 'v1/resource/sendEmail/_version/1/',
                            task: task,
                            ntuser: jdata.ntuser,
                            'amsUser': jdata['amsUser'],
                            'file.message': jdata['file.message'],
                            module: jdata.module,
                            site: jdata.site
                        };
                        return { json, statusCode: 200 };
                    }
                default:
                    throw new errors_1.RestApiRequestError(500);
            }
        })
            .then(resolvePromise, rejectPromise);
    }
    _execute_patch(ctx, resolvePromise, rejectPromise) {
        ctx.apiInfo
            .then((apiInfo) => {
            return this.patch(apiInfo.routeParams['Task'], ctx.body, ctx.headers['if-match'], ctx);
        })
            .then(json => {
            return { statusCode: 200, json };
        })
            .then(resolvePromise)
            .catch(rejectPromise);
    }
    _execute_delete(ctx, resolvePromise, rejectPromise) {
        ctx.apiInfo
            .then((apiInfo) => {
            return this.delete(apiInfo.routeParams['id'], ctx);
        })
            .then(json => {
            return { statusCode: 204 };
        })
            .then(resolvePromise)
            .catch(rejectPromise);
    }
    _execute_post(ctx, resolvePromise, rejectPromise) {
        this.create(ctx.body, ctx)
            .then(json => {
            return { statusCode: 200, json };
        })
            .then(resolvePromise)
            .catch(rejectPromise);
    }
    _execute_head(dctx, resolvePromise, rejectPromise) {
        throw new errors_1.RestApiRequestError(405);
    }
    patch(id, patch, ifMatch, ctx) {
        patch.forEach(instruction => {
            switch (instruction.path) {
                case '/task':
                case '/resource':
                    throw new errors_1.RestApiRequestError(400);
            }
        });
        return this.find(id, ctx)
            .then(json => {
            if (json.etag !== ifMatch) {
                throw new errors_1.RestApiRequestError(409);
            }
            fast_json_patch_1.default.applyPatch(json, patch);
            return this.save(json, ctx);
        });
    }
    filePath(id) {
        const file = path.normalize(path.join(this.dataPath, encodeURIComponent(id) + '.json'));
        if (!file.startsWith(this.dataPath)) {
            throw new errors_1.RestApiRequestError(400);
        }
        return file;
    }
    save(json, ctx) {
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
            .then(cacheSettings => Cache_1.update(Cache_1.CacheClass.Application, uri, {
            update: true,
            data: json,
            tcfOverride: cacheSettings.getTimeConsideredFresh(),
            ttlOverride: cacheSettings.getTimeToLive()
        }, ctx))
            .then(() => this.postCommitHook(json, ctx))
            .then(() => json);
    }
    create(json, ctx) {
        const id = json.id = this.systemGeneratedId ? StringUtil.uuid() : json.id;
        return this.find(id, ctx)
            .then(current => {
            throw new errors_1.RestApiRequestError(409);
        })
            .catch(err => {
            if (err instanceof errors_1.RestApiRequestError && err.responseCode === 404) {
                return this.save(json, ctx);
            }
            throw err;
        });
    }
    getResourceCacheSettings(ctx) {
        return Model_1.resolve(this.resourceUri, ctx)
            .then((resource) => {
            if (!resource.isTypeOf(resource_1.TYPEURI)) {
                throw new Error('resourceUri provided is not a resource.');
            }
            return resource.cache;
        });
    }
    find(id, ctx) {
        const file = this.filePath(id);
        return Cache_1.get(Cache_1.CacheClass.Application, this.formUri(id), ctx, () => {
            return FsUtil.readJson(file)
                .catch(err => {
                throw new errors_1.RestApiRequestError(404);
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
    delete(id, ctx) {
        return this.preDeleteHook(id, ctx)
            .then(() => FsUtil.unlink(this.filePath(id)))
            .then(() => Cache_1.del(Cache_1.CacheClass.Application, this.formUri(id), ctx))
            .then(() => this.postDeleteHook(id, ctx));
    }
}
exports.AMSApis = AMSApis;
exports.default = AMSApis;
//# sourceMappingURL=index.js.map