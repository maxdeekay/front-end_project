"use strict";

window.onload = async () => {
    /* const url = "https://api.edamam.com/search?q=chicken&app_id=5bcb567c&app_key=8ef1eb8193f7901d7157808ff94bda29";
    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();
        console.log(data);
    } else {
        console.log("ERROR")
    } */

    const url = "/skolenhetsregistret/v1/skolenhet/33139103";
    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();
        console.log(data);
    }
}

/* function fetchBjorkvik() {
    const res = fetch("/skolenhetsregistret/v1/skolenhet/33139103")
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("output").innerHTML =
          data["SkolenhetInfo"]["Namn"];
      });
  } */