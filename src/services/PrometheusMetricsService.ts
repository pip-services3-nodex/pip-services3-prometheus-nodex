/** @module services */
import { Descriptor } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { RestService } from 'pip-services3-rpc-nodex';

import { ContextInfo } from 'pip-services3-components-nodex';
import { CachedCounters } from 'pip-services3-components-nodex';

import { PrometheusCounters } from '../count/PrometheusCounters';
import { PrometheusCounterConverter } from '../count/PrometheusCounterConverter';

/**
 * Service that exposes the <code>"/metrics"</code> and <code>"/metricsandreset"</code> routes for Prometheus to scap performance metrics.
 * 
 * ### Configuration parameters ###
 * 
 * - dependencies:
 *   - endpoint:              override for HTTP Endpoint dependency
 *   - prometheus-counters:   override for PrometheusCounters dependency
 * - connection(s):
 *   - discovery_key:         (optional) a key to retrieve the connection from IDiscovery
 *   - protocol:              connection protocol: http or https
 *   - host:                  host name or IP address
 *   - port:                  port number
 *   - uri:                   resource URI or connection string with all parameters in it
 * 
 * ### References ###
 * 
 * - <code>\*:logger:\*:\*:1.0</code>         (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/log.ilogger.html ILogger]] components to pass log messages
 * - <code>\*:counters:\*:\*:1.0</code>         (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/count.icounters.html ICounters]] components to pass collected measurements
 * - <code>\*:discovery:\*:\*:1.0</code>        (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]] services to resolve connection
 * - <code>\*:endpoint:http:\*:1.0</code>          (optional) [[https://pip-services3-nodex.github.io/pip-services3-rpc-nodex/classes/services.httpendpoint.html HttpEndpoint]] reference to expose REST operation
 * - <code>\*:counters:prometheus:\*:1.0</code>    [[PrometheusCounters]] reference to retrieve collected metrics
 * 
 * @see [[https://pip-services3-nodex.github.io/pip-services3-rpc-nodex/classes/services.restservice.html RestService]]
 * @see [[https://pip-services3-nodex.github.io/pip-services3-rpc-nodex/classes/clients.restclient.html RestClient]]
 * 
 * ### Example ###
 * 
 *     let service = new PrometheusMetricsService();
 *     service.configure(ConfigParams.fromTuples(
 *         "connection.protocol", "http",
 *         "connection.host", "localhost",
 *         "connection.port", 8080
 *     ));
 * 
 *     await service.open("123");
 *     console.log("The Prometheus metrics service is accessible at http://+:8080/metrics");
 */
export class PrometheusMetricsService extends RestService {
    private _cachedCounters: CachedCounters;
    private _source: string;
    private _instance: string;

    /**
     * Creates a new instance of this service.
     */
    public constructor() {
        super();
        this._dependencyResolver.put("cached-counters", new Descriptor("pip-services", "counters", "cached", "*", "1.0"));
        this._dependencyResolver.put("prometheus-counters", new Descriptor("pip-services", "counters", "prometheus", "*", "1.0"));
    }

    /**
	 * Sets references to dependent components.
	 * 
	 * @param references 	references to locate the component dependencies. 
     */
    public setReferences(references: IReferences): void {
        super.setReferences(references);

        this._cachedCounters = this._dependencyResolver.getOneOptional<PrometheusCounters>("prometheus-counters");
        if (this._cachedCounters == null)
            this._cachedCounters = this._dependencyResolver.getOneOptional<CachedCounters>("cached-counters");

        let contextInfo = references.getOneOptional<ContextInfo>(
            new Descriptor("pip-services", "context-info", "default", "*", "1.0"));

        if (contextInfo != null && (this._source == "" || this._source == undefined)) {
            this._source = contextInfo.name;
        }
        if (contextInfo != null && (this._instance == "" || this._instance == undefined)) {
            this._instance = contextInfo.contextId;
        }
    }

    /**
     * Registers all service routes in HTTP endpoint.
     */
    public register(): void {
        this.registerRoute("get", "metrics", null, (req, res) => { this.metrics(req, res); });
        this.registerRoute("get", "metricsandreset", null, (req, res) => { this.metricsAndReset(req, res); });
    }

    /**
     * Handles metrics requests
     * 
     * @param req   an HTTP request
     * @param res   an HTTP response
     */
    private metrics(req, res): void {
        let counters = this._cachedCounters != null ? this._cachedCounters.getAll() : null;
        let body = PrometheusCounterConverter.toString(counters, this._source, this._instance);

        res.setHeader('content-type', 'text/plain');
        res.statusCode = 200;
        res.end(body);
    }

    /**
     * Handles metricsandreset requests.
     * The counters will be returned and then zeroed out.
     *
     * @param req   an HTTP request
     * @param res   an HTTP response
     */
    private metricsAndReset(req, res): void {
        let counters = this._cachedCounters != null ? this._cachedCounters.getAll() : null;
        let body = PrometheusCounterConverter.toString(counters, this._source, this._instance);

        if (this._cachedCounters != null) {
            this._cachedCounters.clearAll();
        }

        res.setHeader('content-type', 'text/plain');
        res.statusCode = 200;
        res.end(body);
    }
}