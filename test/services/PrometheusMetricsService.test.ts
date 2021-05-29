let assert = require('chai').assert;
let restify = require('restify-clients');

import { Descriptor } from 'pip-services3-commons-nodex';
import { ConfigParams } from 'pip-services3-commons-nodex';
import { References } from 'pip-services3-commons-nodex';
import { ContextInfo } from 'pip-services3-components-nodex';
import { CounterType } from 'pip-services3-components-nodex';

import { PrometheusMetricsService } from '../../src/services/PrometheusMetricsService';
import { PrometheusCounters } from '../../src/count/PrometheusCounters';

let restConfig = ConfigParams.fromTuples(
    "connection.protocol", "http",
    "connection.host", "localhost",
    "connection.port", 3000
);

suite('PrometheusMetricsService', () => {
    let service: PrometheusMetricsService;
    let counters: PrometheusCounters;
    let rest: any;

    suiteSetup(async () => {
        service = new PrometheusMetricsService();
        service.configure(restConfig);

        counters = new PrometheusCounters();

        let contextInfo = new ContextInfo();
        contextInfo.name = "Test";
        contextInfo.description = "This is a test container";

        let references = References.fromTuples(
            new Descriptor("pip-services", "context-info", "default", "default", "1.0"), contextInfo,
            new Descriptor("pip-services", "counters", "prometheus", "default", "1.0"), counters,
            new Descriptor("pip-services", "metrics-service", "prometheus", "default", "1.0"), service
        );
        counters.setReferences(references);
        service.setReferences(references);

        await counters.open(null);
        await service.open(null);
    });

    suiteTeardown(async () => {
        await service.close(null);
        await counters.close(null);
    });

    setup(() => {
        let url = 'http://localhost:3000';
        rest = restify.createStringClient({ url: url });
    });

    test('Metrics', (done) => {
        counters.incrementOne('test.counter1');
        counters.stats('test.counter2', 2);
        counters.last('test.counter3', 3);
        counters.timestampNow('test.counter4');

        rest.get('/metrics',
            (err, req, res, result) => {
                assert.isNull(err);

                assert.isNotNull(result);
                assert.isTrue(res.statusCode < 400);
                assert.isTrue(result.length > 0);

                done();
            }
        );
    });

    test('MetricsAndReset', (done) => {
        counters.incrementOne('test.counter1');
        counters.stats('test.counter2', 2);
        counters.last('test.counter3', 3);
        counters.timestampNow('test.counter4');

        rest.get('/metricsandreset',
            (err, req, res, result) => {
                assert.isNull(err);

                assert.isNotNull(result);
                assert.isTrue(res.statusCode < 400);
                assert.isTrue(result.length > 0);

                let counter1 = counters.get("test.counter1", CounterType.Increment);
                let counter2 = counters.get("test.counter2", CounterType.Statistics);
                let counter3 = counters.get("test.counter3", CounterType.LastValue);
                let counter4 = counters.get("test.counter4", CounterType.Timestamp);

                assert.isUndefined(counter1.count);
                assert.isUndefined(counter2.count);
                assert.isUndefined(counter3.last);
                assert.isUndefined(counter4.time);

                done();
            }
        );
    });
});
