"use strict";

class EmojiList extends Alert {
    constructor(emojis) {
        super("");
        this.emojis = emojis;
        this.table = document.createElement("table");

        for(let k of Object.keys(emojis)) {
            let row = document.createElement("tr");

            let name = document.createElement("td");
            name.innerHTML = `:${k}:`;

            let image = document.createElement("td");
            image.innerHTML = this.emojis[k].outerHTML;
            image.children[0].classList.add("emoji");

            row.append(name, image);
            this.table.append(row);
        }

        this.labelWrapper.replaceChild(this.table, this.label);
        this.label = this.table;
    }
}
