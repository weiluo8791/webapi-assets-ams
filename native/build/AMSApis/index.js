"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const errors_1 = require("../../../errors");
const Handler_1 = require("../Handler");
const net_1 = require("net");
function getAmsData(type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let HOST = '172.25.0.2';
        let PORT = 1022;
        let totalData = [];
        totalData = [];
        return new Promise((resolve, reject) => {
            let client = net_1.createConnection({ host: HOST, port: PORT }, () => {
                let message = Buffer.from('000a000b52454d4f54455f41444452000b3137322e33302e35312e32000b52454d4f54455f484f5354000b3137322e33302e35312e32000f485454505f555345525f4147454e540014506f73746d616e52756e74696d652f372e312e31000b485454505f434f4f4b49450014706373743d73554d504f4a51724c3533373237320005485454505300036f6666000b5345525645525f504f52540002383000125345525645525f504f52545f53454355524500013000064e54555345520013524f47455253406d656469746563682e636f6d00045459504500075461736b47657400047461736b000734323935363038', 'hex');
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
class AMSApis extends Handler_1.Handler {
    _execute_get(ctx, resolvePromise, rejectPromise) {
        let task;
        let TYPE;
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
    _execute_put(ctx, resolvePromise, rejectPromise) {
        throw new errors_1.RestApiRequestError(405);
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