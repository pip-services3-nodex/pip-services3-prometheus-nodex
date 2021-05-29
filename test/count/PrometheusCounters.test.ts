import { ConfigParams } from 'pip-services3-commons-nodex';

import { PrometheusCounters } from '../../src/count/PrometheusCounters';
import { CountersFixture } from '../fixtures/CountersFixture';

suite('PrometheusCounters', ()=> {
    let _counters: PrometheusCounters;
    let _fixture: CountersFixture;

    setup(async () => {
        let host = process.env['PUSHGATEWAY_SERVICE_HOST'] || 'localhost';
        let port = process.env['PUSHGATEWAY_SERVICE_PORT'] || 9091;

        _counters = new PrometheusCounters();
        _fixture = new CountersFixture(_counters);

        let config = ConfigParams.fromTuples(
            'source', 'test',
            'connection.host', host,
            'connection.port', port
        );
        _counters.configure(config);

        await _counters.open(null);
    });

    teardown(async () => {
        await _counters.close(null);
    });

    test('Simple Counters', async () => {
        await _fixture.testSimpleCounters();
    });

    test('Measure Elapsed Time', async () => {
        await _fixture.testMeasureElapsedTime();
    });

});