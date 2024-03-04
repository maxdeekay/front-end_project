"use strict";

window.onload = async () => {
    const url = "https://api.skolverket.se/skolenhetsregistret/v1/skolenhet/33139103";
    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();
        console.log(data);
    } else {
        console.log("ERROR")
    }
}