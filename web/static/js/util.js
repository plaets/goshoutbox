"use strict";

function formatZero(string, length) {
    return "0".repeat(length - string.length) + string;
}

function htmlEncode(string) {
    return [[/</g, "&lt"], [/>/g, "&gt"], [/"/g, "&#34"], [/'/g, "&#39"]].reduce((p, v) => p.replace(v[0],v[1]), string); //fully safe!!!!! (was that a joke?)
}

const now = _ => Math.round(Date.now()/1000);

//Regular Expression for URL validation from https://gist.github.com/dperini/729294 
const re_url = /(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?/ig

function formatLinks(str) {
    for(let m of str.matchAll(re_url)) {
        let link = m[0].replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
        str = str.replace(new RegExp(`${link}`), `<a href="${m[0]}">${m[0]}</a>`);
    }
    return str;
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
