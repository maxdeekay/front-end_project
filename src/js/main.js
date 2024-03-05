"use strict";

window.onload = async () => {
    const url = "/skolenhetsregistret/v1/kommun";
    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();

        const input = document.getElementById("input");

        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                search(input.value.toLowerCase(), data);
                input.blur();
            }
        });
    } else {
        console.log("ERRORS");
    }
}

function search(input, regions) {
    const result = regions.Kommuner.filter(region => {
        return region.Namn.toLowerCase().includes(input);
    });

    suggest(result.slice(0, 10));
}

function suggest(regions) {
    const container = document.getElementById("suggestion-container");
    container.innerHTML = "";
    container.style.display = "flex";
    
    regions.forEach((region) => {
        const div = document.createElement("div");
        const name = document.createElement("p");
        const nameText = document.createTextNode(region.Namn + "s kommun");

        name.appendChild(nameText);
        div.appendChild(name);
        div.classList.add("suggestion");
        div.onclick = () => showRegion(region.Kommunkod);
        container.appendChild(div);
    });
}

async function showRegion(code) {
    resetPage();
    const schools = await getSchools(code);
    const container = document.getElementById("schools-container");
    container.style.display = "grid";

    schools.forEach((school) => {
        const div = document.createElement("div");
        const schoolName = document.createElement("p");
        const schoolNameText = document.createTextNode(school.Skolenhetsnamn);
        
        schoolName.appendChild(schoolNameText);
        div.appendChild(schoolName);
        div.classList.add("school");
        div.onclick = () => showSchool(school.Skolenhetskod);
        container.appendChild(div);
    });
}

async function showSchool(code) {
    resetPage();
    const school = await getSchool(code);
    const container = document.getElementById("school-container");
    container.style.display = "flex";
    console.log(school);

    document.getElementById("school-name").innerHTML = school.SkolenhetInfo.Namn;
    document.getElementById("street").innerHTML = school.SkolenhetInfo.Besoksadress.Adress;
    document.getElementById("zip-code").innerHTML = school.SkolenhetInfo.Besoksadress.Postnr;
    document.getElementById("city").innerHTML = school.SkolenhetInfo.Besoksadress.Ort;
    document.getElementById("principal-name").innerHTML = school.SkolenhetInfo.Rektorsnamn;
}

async function getSchool(code) {
    const url = "/skolenhetsregistret/v1/skolenhet/" + code;
    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        console.log("ERRORS");
    }
}

async function getSchools(code) {
    const url = "/skolenhetsregistret/v1/kommun/" + code;
    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();    
        return data.Skolenheter.filter((school) => school.Status === "Aktiv");
    } else {
        console.log("ERRORS");
    }
}

function resetPage() {
    document.getElementById("suggestion-container").style.display = "none";
    document.getElementById("schools-container").style.display = "none";
    /* document.getElementById("school-container").style.display = "none"; */
}