"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPrometheusFactory = void 0;
/** @module build */
const pip_services3_components_nodex_1 = require("pip-services3-components-nodex");
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const PrometheusCounters_1 = require("../count/PrometheusCounters");
const PrometheusMetricsService_1 = require("../services/PrometheusMetricsService");
/**
 * Creates Prometheus components by their descriptors.
 *
 * @see [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/classes/build.factory.html Factory]]
 * @see [[PrometheusCounters]]
 * @see [[PrometheusMetricsService]]
 */
class DefaultPrometheusFactory extends pip_services3_components_nodex_1.Factory {
    /**
     * Create a new instance of the factory.
     */
    constructor() {
        super();
        this.registerAsType(DefaultPrometheusFactory.PrometheusCountersDescriptor, PrometheusCounters_1.PrometheusCounters);
        this.registerAsType(DefaultPrometheusFactory.PrometheusMetricsServiceDescriptor, PrometheusMetricsService_1.PrometheusMetricsService);
    }
}
exports.DefaultPrometheusFactory = DefaultPrometheusFactory;
DefaultPrometheusFactory.PrometheusCountersDescriptor = new pip_services3_commons_nodex_1.Descriptor("pip-services", "counters", "prometheus", "*", "1.0");
DefaultPrometheusFactory.PrometheusMetricsServiceDescriptor = new pip_services3_commons_nodex_1.Descriptor("pip-services", "metrics-service", "prometheus", "*", "1.0");
//# sourceMappingURL=DefaultPrometheusFactory.js.map