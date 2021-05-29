"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const PrometheusCounters_1 = require("../../src/count/PrometheusCounters");
const CountersFixture_1 = require("../fixtures/CountersFixture");
suite('PrometheusCounters', () => {
    let _counters;
    let _fixture;
    setup(() => __awaiter(void 0, void 0, void 0, function* () {
        let host = process.env['PUSHGATEWAY_SERVICE_HOST'] || 'localhost';
        let port = process.env['PUSHGATEWAY_SERVICE_PORT'] || 9091;
        _counters = new PrometheusCounters_1.PrometheusCounters();
        _fixture = new CountersFixture_1.CountersFixture(_counters);
        let config = pip_services3_commons_nodex_1.ConfigParams.fromTuples('source', 'test', 'connection.host', host, 'connection.port', port);
        _counters.configure(config);
        yield _counters.open(null);
    }));
    teardown(() => __awaiter(void 0, void 0, void 0, function* () {
        yield _counters.close(null);
    }));
    test('Simple Counters', () => __awaiter(void 0, void 0, void 0, function* () {
        yield _fixture.testSimpleCounters();
    }));
    test('Measure Elapsed Time', () => __awaiter(void 0, void 0, void 0, function* () {
        yield _fixture.testMeasureElapsedTime();
    }));
});
//# sourceMappingURL=PrometheusCounters.test.js.map