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
exports.PrometheusCounters = void 0;
/** @module count */
/** @hidden */
let os = require('os');
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_components_nodex_1 = require("pip-services3-components-nodex");
const pip_services3_components_nodex_2 = require("pip-services3-components-nodex");
const pip_services3_rpc_nodex_1 = require("pip-services3-rpc-nodex");
const PrometheusCounterConverter_1 = require("./PrometheusCounterConverter");
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
class PrometheusCounters extends pip_services3_components_nodex_1.CachedCounters {
    /**
     * Creates a new instance of the performance counters.
     */
    constructor() {
        super();
        this._logger = new pip_services3_components_nodex_2.CompositeLogger();
        this._connectionResolver = new pip_services3_rpc_nodex_1.HttpConnectionResolver();
        this._opened = false;
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
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
    setReferences(references) {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
        let contextInfo = references.getOneOptional(new pip_services3_commons_nodex_1.Descriptor("pip-services", "context-info", "default", "*", "1.0"));
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
    isOpen() {
        return this._opened;
    }
    /**
     * Opens the component.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     */
    open(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._opened) {
                return;
            }
            if (!this._pushEnabled) {
                return;
            }
            this._opened = true;
            try {
                let connection = yield this._connectionResolver.resolve(correlationId);
                let job = this._source || "unknown";
                let instance = this._instance || os.hostname();
                this._requestRoute = "/metrics/job/" + job + "/instance/" + instance;
                let restify = require('restify-clients');
                this._client = restify.createStringClient({ url: connection.getAsString("uri") });
            }
            catch (ex) {
                this._client = null;
                this._logger.warn(correlationId, "Connection to Prometheus server is not configured: " + ex);
            }
        });
    }
    /**
     * Closes component and frees used resources.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     */
    close(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            this._opened = false;
            this._client = null;
            this._requestRoute = null;
        });
    }
    /**
     * Saves the current counters measurements.
     *
     * @param counters      current counters measurements to be saves.
     */
    save(counters) {
        if (this._client == null || !this._pushEnabled)
            return;
        let body = PrometheusCounterConverter_1.PrometheusCounterConverter.toString(counters, null, null);
        this._client.put(this._requestRoute, body, (err, req, res, data) => {
            if (err || res.statusCode >= 400)
                this._logger.error("prometheus-counters", err, "Failed to push metrics to prometheus");
        });
    }
}
exports.PrometheusCounters = PrometheusCounters;
//# sourceMappingURL=PrometheusCounters.js.map