"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const ROOT_CONTEXT_TRUE=Symbol.for("__TRUE"),ROOT_CONTEXT_FALSE=Symbol.for("__FALSE"),RAW_VALUE$1=Symbol.for("__RAW_VALUE"),GET_WITH_NEW_ROOT$1=Symbol.for("__GET_WITH_NEW_ROOT"),builtinDirectives={async $directives(){throw new Error("directives can only be defined at the root of a context")},async $if(a){const b=await a.condition;return b?a.then:a.else},async $match(a,{root:b}){return a=await a,Array.isArray(a)?eq(a[0],a[1],!0,!1):eq(a,b,!0,!0)},async $eq([a,b]){return eq(a,b,!1)},async $and(a){for(const b of a)if(!(await b))return!1;return!0},async $or(a){for(const b of a)if(await b)return!0;return!1},$lt:(a,b)=>evaluateBinary(a,b,(a,b)=>a<b),$lte:(a,b)=>evaluateBinary(a,b,(a,b)=>a<=b),$gt:(a,b)=>evaluateBinary(a,b,(a,b)=>a>b),$gte:(a,b)=>evaluateBinary(a,b,(a,b)=>a>=b),$ne:(a,b)=>evaluateBinary(a,b,(a,b)=>a!==b),$regex:(a,b)=>evaluateBinary(a,b,async(a,b)=>"string"==typeof b?new RegExp(b).test(a):new RegExp(b.pattern,b.flags).test(a)),async $in(a,{root:b,prop:c}){const d=await b[c];for(const e of a)if((await e)===d)return ROOT_CONTEXT_TRUE;return ROOT_CONTEXT_FALSE},async $ref(a,{root:b}){const c=(await a).split(".");let d=await b;for(const e of c){if(d===void 0)return;d=await d[e]}return d},async $str(a,{root:b}){let c=await a;for(const d of c.matchAll(STR_INTERP_REGEX)){const a=d[0];// You can escape it with "\"
if("\\"===a[0])c=c.replace(a,a.slice(1));else{const e=await builtinDirectives.$ref(d[1],{root:b});null===e?c=c.replace(a,""):e!==void 0&&(c=c.replace(d[0],e))}}return c}},STR_INTERP_REGEX=/\\?\${([^}]+)}*/g;async function evaluateBinary(a,{root:b,prop:c},d){return a=await a,Array.isArray(a)?d(await a[0],await a[1]):(await d(await b[c],await a))?ROOT_CONTEXT_TRUE:ROOT_CONTEXT_FALSE}async function eq(a,b,c,d){const e=await a,f=await b;if(e===f||e===ROOT_CONTEXT_TRUE)return!0;// Are they at least the same type?
if(null===e||null===f)return!1;if("string"==typeof f&&e instanceof RegExp)return e[RAW_VALUE$1].test(f);if("object"!=typeof e||"object"!=typeof f)return!1;const g=Object.keys(e);if(!c&&g.length!==Object.keys(f))return!1;// Now just make sure that every property of i1 matches i2.
for(const h of g){// Since we might have directives here that care about the root, we want to replace the root, so let's use the
// "GET_WITH_NEW_ROOT" function
const a=d?e[GET_WITH_NEW_ROOT$1](f,h):e[h],b=f[h];if(!(await eq(a,b,c,d)))return!1}return!0}//const { builtinDirectives } = require("./builtinDirectives")
const RAW_VALUE=Symbol.for("__RAW_VALUE"),IS_RULIFIED=Symbol.for("__IS_RULIFIED"),GET_WITH_NEW_ROOT=Symbol.for("__GET_WITH_NEW_ROOT");/**
 * @param  {...Record<any, any>} contexts
 * @returns {any}
 */function rulify(...a){const b={};let c={},d=!1;// The caches use weak maps so that they won't cause memory leaks
// when the proxies or resolved values go out of scope.
const e={proxyCache:new WeakMap,resolvedValueCache:new WeakMap};for(let e of a)e[IS_RULIFIED]&&(e=e[RAW_VALUE],d=!0),Object.assign(b,e),Object.assign(c,normalizeDirectives(e.$directives));return delete b.$directives,d||(c=Object.assign({},builtinDirectives,c)),proxify(b,c,void 0,void 0,e)}function normalizeDirectives(a){if(a){const b=Object.entries(a).map(([a,b])=>["$"===a[0]?a:"$"+a,b]);return Object.fromEntries(b)}}function proxify(a,b,c,d,e){const f=a;if(e.proxyCache.has(a))return e.proxyCache.get(a);if("function"==typeof a&&(a=a()),null===a||"object"!=typeof a)return a;const g=Object.keys(a);let h,i;if(1===g.length&&(h=g[0])&&(i=b?.[h])){const f=proxify(a[h],b,c,d,e);return proxify(i(f,{root:c,prop:d}),b,c,d,e)}const j={},k=new Proxy(a,j);return e.proxyCache.set(a,k),a!==f&&e.proxyCache.set(f,k),void 0===c&&(c=k),j.get=function(a,d){return get(a,k,d,c,b,e)},k}function get(a,b,c,d,e,f){// Handle these special properties first. Switch is faster than an if-else chain.
switch(c){case RAW_VALUE:return a;case IS_RULIFIED:return!0;case GET_WITH_NEW_ROOT:return(c,d)=>get(a,b,d,c,e,f);case Symbol.iterator:return a[Symbol.iterator];}let g=f.resolvedValueCache.get(b);if(!g)g=new Map,f.resolvedValueCache.set(b,g);else if(g.has(c))return g.get(c);let h;// Is this a promise?
const i=a?.then;return h="function"==typeof i?"then"===c?i.bind(a):proxify(i.bind(a)(a=>{const b=a[c];return proxify(b,e,d,c,f)}),e,d,c,f):proxify(a[c],e,d,c,f),g.set(c,h),h}exports.rulify=rulify;
//# sourceMappingURL=index.cjs.js.map
