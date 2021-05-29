/** @module build */
import { Factory } from 'pip-services3-components-nodex';
/**
 * Creates Prometheus components by their descriptors.
 *
 * @see [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/classes/build.factory.html Factory]]
 * @see [[PrometheusCounters]]
 * @see [[PrometheusMetricsService]]
 */
export declare class DefaultPrometheusFactory extends Factory {
    private static readonly PrometheusCountersDescriptor;
    private static readonly PrometheusMetricsServiceDescriptor;
    /**
     * Create a new instance of the factory.
     */
    constructor();
}
