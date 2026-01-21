// Vendor file for minified Supabase client dependencies
export const _ = function(e, t, r, s, n, i) {
    return new (r || (r = Promise))(function(a, o) {
        function l(e) {
            try {
                h(r.next(e))
            } catch (e) {
                o(e)
            }
        }
        function c(e) {
            try {
                h(r.throw(e))
            } catch (e) {
                o(e)
            }
        }
        function h(e) {
            var t;
            e.done ? a(e.value) : (t = e.value, t instanceof r ? t : new r(function(e) {
                e(t)
            })).then(l, c)
        }
        h((r = r.apply(e, s || [])).next())
    })
};

export const I = class extends Error {
    constructor(e) {
        super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e)
    }
};

export const a = (e => e ? (...t) => e(...t) : (...e) => fetch(...e));
