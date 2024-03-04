"use strict";

window.onload = async () => {
    const url = "/skolenhetsregistret/v1/skolenhet/33139103";
    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();
        console.log(data);
    } else {
        console.log("ERROR")
    }
}


// weather api key: 2c871b7f911399ff66f6268c00f1f52a