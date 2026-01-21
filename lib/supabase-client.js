import {_ as e, I as t, a as r} from "./vendor-D55KC-iq.js";
class s extends Error {
    constructor(e, t="FunctionsError", r) {
        super(e),
        this.name = t,
        this.context = r
    }
}
class n extends s {
    constructor(e) {
        super("Failed to send a request to the Edge Function", "FunctionsFetchError", e)
    }
}
