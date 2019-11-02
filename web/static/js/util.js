"use strict";

function formatZero(string, length) {
    return "0".repeat(length - string.length) + string;
}

function htmlEncode(string) {
    return [[/</g, "&lt"], [/>/g, "&gt"], [/"/g, "&#34"], [/'/g, "&#39"]].reduce((p, v) => p.replace(v[0],v[1]), string); //fully safe!!!!! 
}

class Deferred {
    constructor(handler) {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;

            if(handler != undefined) {
                handler(resolve, reject);
            }
        });

        this.promise.resolve = this.resolve;
        this.promise.reject = this.reject;

        return this.promise;
    }
}
