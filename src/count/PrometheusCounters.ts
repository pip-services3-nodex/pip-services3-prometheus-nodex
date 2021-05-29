/** @module count */
/** @hidden */
let os = require('os');

import { ConfigParams } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { Descriptor } from 'pip-services3-commons-nodex';
import { IOpenable } from 'pip-services3-commons-nodex';
import { CachedCounters } from 'pip-services3-components-nodex';
import { Counter } from 'pip-services3-components-nodex';
import { CompositeLogger } from 'pip-services3-components-nodex';
import { ContextInfo } from 'pip-services3-components-nodex';
import { HttpConnectionResolver } from 'pip-services3-rpc-nodex';

import { PrometheusCounterConverter } from './PrometheusCounterConverter';

/**
 * Performance counters that send their metrics to Prometheus service.
 * 
 * The component is normally used in passive mode conjunction with [[PrometheusMetricsService]].
 * Alternatively when connection parameters are set it can push metrics to Prometheus PushGateway.
 * 
 * ### Configuration parameters ###
 * 
 * - connection(s):           
 *   - discovery_key:         (optional) a key to retrieve the connection from [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]]
 *   - protocol:              connection protocol: http or https
 *   - host:                  host name or IP address
 *   - port:                  port number
 *   - uri:                   resource URI or connection string with all parameters in it
 * - options:
 *   - retries:               number of retries (default: 3)
 *   - connect_timeout:       connection timeout in milliseconds (default: 10 sec)
 *   - timeout:               invocation timeout in milliseconds (default: 10 sec)
 * 
 * ### References ###
 * 
 * - <code>\*:logger:\*:\*:1.0</code>           (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/log.ilogger.html ILogger]] components to pass log messages
 * - <code>\*:counters:\*:\*:1.0</code>         (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/count.icounters.html ICounters]] components to pass collected measurements
 * - <code>\*:discovery:\*:\*:1.0</code>        (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]] services to resolve connection
 * 
 * @see [[https://pip-services3-nodex.github.io/pip-services3-rpc-nodex/classes/services.restservice.html RestService]]
 * @see [[https://pip-services3-nodex.github.io/pip-services3-rpc-nodex/classes/services.commandablehttpservice.html CommandableHttpService]]
 * 
 * ### Example ###
 * 
 *     let counters = new PrometheusCounters();
 *     counters.configure(ConfigParams.fromTuples(
 *         "connection.protocol", "http",
 *         "connection.host", "localhost",
 *         "connection.port", 8080
 *     ));
 * 
 *     await counters.open("123");
 * 
 *     counters.increment("mycomponent.mymethod.calls");
 *     let timing = counters.beginTiming("mycomponent.mymethod.exec_time");
 *     try {
 *         ...
 *     } finally {
 *         timing.endTiming();
 *     }
 * 
 *     counters.dump();
 */
export class PrometheusCounters extends CachedCounters implements IReferenceable, IOpenable {
    private _logger = new CompositeLogger();
    private _connectionResolver = new HttpConnectionResolver();
    private _opened: boolean = false;
    private _source: string;
    private _instance: string;
    private _pushEnabled: boolean;
    private _client: any;
    private _requestRoute: string;

    /**
     * Creates a new instance of the performance counters.
     */
    public constructor() {
        super();
    }

    /**
     * Configures component by passing configuration parameters.
     * 
     * @param config    configuration parameters to be set.
     */
    public configure(config: ConfigParams): void {
        super.configure(config);

        this._connectionResolver.configure(config);
        this._source = config.getAsStringWithDefault("source", this._source);
        this._instance = config.getAsStringWithDefault("instance", this._instance);
        this._pushEnabled = config.getAsBooleanWithDefault("push_enabled", true);
    }

    /**
	 * Sets references to dependent components.
	 * 
	 * @param references 	references to locate the component dependencies. 
     */
    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);

        let contextInfo = references.getOneOptional<ContextInfo>(
            new Descriptor("pip-services", "context-info", "default", "*", "1.0"));
        if (contextInfo != null && this._source == null) {
            this._source = contextInfo.name;
        }
        if (contextInfo != null && this._instance == null) {
            this._instance = contextInfo.contextId;
        }
    }

    /**
	 * Checks if the component is opened.
	 * 
	 * @returns true if the component has been opened and false otherwise.
     */
    public isOpen(): boolean {
        return this._opened;
    }

    /**
	 * Opens the component.
	 * 
	 * @param correlationId 	(optional) transaction id to trace execution through call chain.
     */
    public async open(correlationId: string): Promise<void> {
        if (this._opened) {
            return;
        }

        if (!this._pushEnabled) {
            return;
        }

        this._opened = true;

        try {
            let connection = await this._connectionResolver.resolve(correlationId);
            let job = this._source || "unknown";
            let instance = this._instance || os.hostname();
            this._requestRoute = "/metrics/job/" + job + "/instance/" + instance;

            let restify = require('restify-clients');
            this._client = restify.createStringClient({ url: connection.getAsString("uri") });
        } catch (ex) {
            this._client = null;
            this._logger.warn(correlationId, "Connection to Prometheus server is not configured: " + ex);
        }
    }

    /**
	 * Closes component and frees used resources.
	 * 
	 * @param correlationId 	(optional) transaction id to trace execution through call chain.
     */
    public async close(correlationId: string): Promise<void> {
        this._opened = false;
        this._client = null;
        this._requestRoute = null;
    }

    /**
     * Saves the current counters measurements.
     * 
     * @param counters      current counters measurements to be saves.
     */
    protected save(counters: Counter[]): void {
        if (this._client == null || !this._pushEnabled) return;

        let body = PrometheusCounterConverter.toString(counters, null, null);

        this._client.put(this._requestRoute, body, (err, req, res, data) => {
            if (err || res.statusCode >= 400)
                this._logger.error("prometheus-counters", err, "Failed to push metrics to prometheus");
        });
    }
}