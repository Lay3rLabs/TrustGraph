let wasm;

let heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export_0(addHeapObject(e));
    }
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

let WASM_VECTOR_LEN = 0;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    const mem = getDataViewMemory0();
    for (let i = 0; i < array.length; i++) {
        mem.setUint32(ptr + 4 * i, addHeapObject(array[i]), true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(takeObject(mem.getUint32(i, true)));
    }
    return result;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}
function __wbg_adapter_37(arg0, arg1, arg2, arg3) {
    wasm.__wbindgen_export_4(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

const PageRankConfigFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pagerankconfig_free(ptr >>> 0, 1));
/**
 * Configuration for the Trust Aware PageRank algorithm
 */
export class PageRankConfig {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PageRankConfigFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pagerankconfig_free(ptr, 0);
    }
    /**
     * Damping factor (usually 0.85)
     * @returns {number}
     */
    get dampingFactor() {
        const ret = wasm.__wbg_get_pagerankconfig_dampingFactor(this.__wbg_ptr);
        return ret;
    }
    /**
     * Damping factor (usually 0.85)
     * @param {number} arg0
     */
    set dampingFactor(arg0) {
        wasm.__wbg_set_pagerankconfig_dampingFactor(this.__wbg_ptr, arg0);
    }
    /**
     * Maximum number of iterations
     * @returns {number}
     */
    get maxIterations() {
        const ret = wasm.__wbg_get_pagerankconfig_maxIterations(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Maximum number of iterations
     * @param {number} arg0
     */
    set maxIterations(arg0) {
        wasm.__wbg_set_pagerankconfig_maxIterations(this.__wbg_ptr, arg0);
    }
    /**
     * Convergence threshold
     * @returns {number}
     */
    get tolerance() {
        const ret = wasm.__wbg_get_pagerankconfig_tolerance(this.__wbg_ptr);
        return ret;
    }
    /**
     * Convergence threshold
     * @param {number} arg0
     */
    set tolerance(arg0) {
        wasm.__wbg_set_pagerankconfig_tolerance(this.__wbg_ptr, arg0);
    }
    /**
     * Minimum weight value
     * @returns {number}
     */
    get minWeight() {
        const ret = wasm.__wbg_get_pagerankconfig_minWeight(this.__wbg_ptr);
        return ret;
    }
    /**
     * Minimum weight value
     * @param {number} arg0
     */
    set minWeight(arg0) {
        wasm.__wbg_set_pagerankconfig_minWeight(this.__wbg_ptr, arg0);
    }
    /**
     * Maximum weight value
     * @returns {number}
     */
    get maxWeight() {
        const ret = wasm.__wbg_get_pagerankconfig_maxWeight(this.__wbg_ptr);
        return ret;
    }
    /**
     * Maximum weight value
     * @param {number} arg0
     */
    set maxWeight(arg0) {
        wasm.__wbg_set_pagerankconfig_maxWeight(this.__wbg_ptr, arg0);
    }
    /**
     * Create a new PageRankConfig for WASM
     * @param {number} damping_factor
     * @param {number} max_iterations
     * @param {number} tolerance
     * @param {number} min_weight
     * @param {number} max_weight
     * @param {TrustConfig} trust_config
     */
    constructor(damping_factor, max_iterations, tolerance, min_weight, max_weight, trust_config) {
        _assertClass(trust_config, TrustConfig);
        var ptr0 = trust_config.__destroy_into_raw();
        const ret = wasm.pagerankconfig_new_wasm(damping_factor, max_iterations, tolerance, min_weight, max_weight, ptr0);
        this.__wbg_ptr = ret >>> 0;
        PageRankConfigFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set trust configuration (WASM-compatible)
     * @param {TrustConfig} trust_config
     */
    setTrustConfig(trust_config) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(trust_config, TrustConfig);
            var ptr0 = trust_config.__destroy_into_raw();
            wasm.pagerankconfig_setTrustConfig(retptr, this.__wbg_ptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get trust configuration (WASM-compatible)
     * @returns {TrustConfig}
     */
    getTrustConfig() {
        const ret = wasm.pagerankconfig_getTrustConfig(this.__wbg_ptr);
        return TrustConfig.__wrap(ret);
    }
}
if (Symbol.dispose) PageRankConfig.prototype[Symbol.dispose] = PageRankConfig.prototype.free;

const PageRankGraphComputerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pagerankgraphcomputer_free(ptr >>> 0, 1));
/**
 * A directed graph for Trust Aware PageRank computation
 */
export class PageRankGraphComputer {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PageRankGraphComputerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pagerankgraphcomputer_free(ptr, 0);
    }
    /**
     * Create a new PageRankGraphComputer for WASM
     * @param {boolean} allow_duplicates
     */
    constructor(allow_duplicates) {
        const ret = wasm.pagerankgraphcomputer_new_wasm(allow_duplicates);
        this.__wbg_ptr = ret >>> 0;
        PageRankGraphComputerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Add an edge from attester to recipient with base weight
     * @param {string} from
     * @param {string} to
     * @param {number} base_weight
     */
    addEdge(from, to, base_weight) {
        const ptr0 = passStringToWasm0(from, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(to, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        wasm.pagerankgraphcomputer_addEdge(this.__wbg_ptr, ptr0, len0, ptr1, len1, base_weight);
    }
    /**
     * Get all nodes in the graph
     * @returns {string[]}
     */
    nodes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.pagerankgraphcomputer_nodes(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_3(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Calculate Trust Aware PageRank scores for all nodes
     * @param {PageRankConfig} config
     * @returns {Map<any, any>}
     */
    calculatePagerank(config) {
        _assertClass(config, PageRankConfig);
        var ptr0 = config.__destroy_into_raw();
        const ret = wasm.pagerankgraphcomputer_calculatePagerank(this.__wbg_ptr, ptr0);
        return takeObject(ret);
    }
    /**
     * Distribute points to nodes based on PageRank scores
     * @param {Map<any, any>} scores
     * @param {bigint} total_pool
     * @returns {Map<any, any>}
     */
    distributePoints(scores, total_pool) {
        const ret = wasm.pagerankgraphcomputer_distributePoints(this.__wbg_ptr, addHeapObject(scores), addHeapObject(total_pool));
        return takeObject(ret);
    }
}
if (Symbol.dispose) PageRankGraphComputer.prototype[Symbol.dispose] = PageRankGraphComputer.prototype.free;

const TrustConfigFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_trustconfig_free(ptr >>> 0, 1));
/**
 * Trust configuration for Trust Aware PageRank
 */
export class TrustConfig {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TrustConfig.prototype);
        obj.__wbg_ptr = ptr;
        TrustConfigFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TrustConfigFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_trustconfig_free(ptr, 0);
    }
    /**
     * Weight multiplier for attestations from trusted seeds (e.g., 2.0 = 2x weight)
     * @returns {number}
     */
    get trustMultiplier() {
        const ret = wasm.__wbg_get_trustconfig_trustMultiplier(this.__wbg_ptr);
        return ret;
    }
    /**
     * Weight multiplier for attestations from trusted seeds (e.g., 2.0 = 2x weight)
     * @param {number} arg0
     */
    set trustMultiplier(arg0) {
        wasm.__wbg_set_trustconfig_trustMultiplier(this.__wbg_ptr, arg0);
    }
    /**
     * Boost factor for initial scores of trusted seeds (0.0-1.0)
     * @returns {number}
     */
    get trustShare() {
        const ret = wasm.__wbg_get_trustconfig_trustShare(this.__wbg_ptr);
        return ret;
    }
    /**
     * Boost factor for initial scores of trusted seeds (0.0-1.0)
     * @param {number} arg0
     */
    set trustShare(arg0) {
        wasm.__wbg_set_trustconfig_trustShare(this.__wbg_ptr, arg0);
    }
    /**
     * The decay factor for the trust distance degrees
     * @returns {number}
     */
    get trustDecay() {
        const ret = wasm.__wbg_get_trustconfig_trustDecay(this.__wbg_ptr);
        return ret;
    }
    /**
     * The decay factor for the trust distance degrees
     * @param {number} arg0
     */
    set trustDecay(arg0) {
        wasm.__wbg_set_trustconfig_trustDecay(this.__wbg_ptr, arg0);
    }
    /**
     * Create a new TrustConfig for WASM
     * @param {string[]} trusted_seeds
     * @param {number} trust_multiplier
     * @param {number} trust_share
     * @param {number} trust_decay
     */
    constructor(trusted_seeds, trust_multiplier, trust_share, trust_decay) {
        const ptr0 = passArrayJsValueToWasm0(trusted_seeds, wasm.__wbindgen_export_1);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.trustconfig_new_wasm(ptr0, len0, trust_multiplier, trust_share, trust_decay);
        this.__wbg_ptr = ret >>> 0;
        TrustConfigFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set trusted seeds from a Vec of addresses (WASM-compatible)
     * @param {string[]} seeds
     */
    setTrustedSeeds(seeds) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayJsValueToWasm0(seeds, wasm.__wbindgen_export_1);
            const len0 = WASM_VECTOR_LEN;
            wasm.trustconfig_setTrustedSeeds(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get trusted seeds as a Vec of strings (WASM-compatible)
     * @returns {string[]}
     */
    getTrustedSeeds() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.trustconfig_getTrustedSeeds(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_3(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) TrustConfig.prototype[Symbol.dispose] = TrustConfig.prototype.free;

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_BigInt_40a77d45cca49470 = function() { return handleError(function (arg0) {
        const ret = BigInt(getObject(arg0));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_forEach_859dfd887a0f866c = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_37(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            getObject(arg0).forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_new_2ff1f68f3676ea53 = function() {
        const ret = new Map();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_b7f1cf4fae26fe2a = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_toString_7268338f40012a03 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).toString(arg1);
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_wbindgendebugstring_99ef257a3ddda34d = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_wbindgennumberget_f74b4c7525ac05cb = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_wbindgenstringget_0f16a6ddddef376f = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_wbindgenthrow_451ec1a8469d7eb6 = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(String) -> Externref`.
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
        // Cast intrinsic for `F64 -> Externref`.
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;



    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('pagerank_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
