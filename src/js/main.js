"use strict";

const globalState = {
    map: null,
    marker: null,
    tag: null
};

window.onload = async () => {
    const regionsUrl = "/skolenhetsregistret/v1/kommun";
    const schoolsUrl = "/skolenhetsregistret/v1/skolenhet";
    const regionsResponse = await fetch(regionsUrl);
    const schoolsResponse = await fetch(schoolsUrl);

    if (regionsResponse.ok && schoolsResponse.ok) {
        const regionsData = await regionsResponse.json();
        const schoolsData = await schoolsResponse.json();

        const input = document.getElementById("input");
        const searchContainer = document.getElementById("search-container");

        input.addEventListener("keypress", (e) => {
            searchContainer.classList.add("at-top");
            document.getElementById("intro-text").classList.add("fade-out");

            if (e.key === "Enter") {
                search(input.value.toLowerCase(), regionsData, schoolsData);
                /* input.blur(); */
            }
        });

    } else {
        console.log("ERRORS");
    }

    initializeTag();
    initializeMap();
}

function search(input, regions, schools) {
    if (globalState.tag) {
        const result = schools.Skolenheter.filter(school => school.Kommunkod === globalState.tag).filter(school => school.Skolenhetsnamn.toLowerCase().includes(input));
        
        suggest(result);
    } else {
        const regionsResult = regions.Kommuner.filter(region => {
            return region.Namn.toLowerCase().includes(input);
        });
    
        const schoolsResult = schools.Skolenheter.filter(school => {
            return school.Skolenhetsnamn.toLowerCase().includes(input);
        });
    
        suggest(schoolsResult.slice(0, 5), regionsResult.slice(0, 5), );
    }
}

function suggest(schools, regions = null) {
    resetPage();
    const container = document.getElementById("suggestion-container");
    container.innerHTML = "";
    container.style.display = "flex";
    console.log(schools);
    schools.forEach((school) => {
        const div = document.createElement("div");
        const name = document.createElement("p");
        const nameText = document.createTextNode(school.Skolenhetsnamn);
        const type = document.createElement("p");
        type.innerHTML = "Skola";

        div.classList.add("suggestion");
        type.classList.add("type-text");

        name.appendChild(nameText);
        div.appendChild(name);
        div.appendChild(type);
        div.onclick = () => showSchool(school.Skolenhetskod);
        container.appendChild(div);
    });

    if (regions) {
        regions.forEach((region) => {
            const div = document.createElement("div");
            const name = document.createElement("p");
            const nameText = document.createTextNode(region.Namn);
            const type = document.createElement("p");
            type.innerHTML = "Kommun";
    
            div.classList.add("suggestion");
            type.classList.add("type-text");
    
            name.appendChild(nameText);
            div.appendChild(name);
            div.appendChild(type);
            div.onclick = () => addSearchTag(region.Namn, region.Kommunkod);
            container.appendChild(div);
        });
    }
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

    const ul = document.getElementById("school-forms");
    ul.innerHTML = "";

    school.SkolenhetInfo.Skolformer.forEach((form) => {
        const li = document.createElement("li");
        li.innerHTML = form.Benamning;
        ul.appendChild(li);
    });

    const webpage = document.getElementById("visit-webpage");
    webpage.href = school.SkolenhetInfo.Webbadress;

    const lat = school.SkolenhetInfo.Besoksadress.GeoData.Koordinat_WGS84_Lat;
    const lng = school.SkolenhetInfo.Besoksadress.GeoData.Koordinat_WGS84_Lng;
    updateMap(lat, lng);
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

function addSearchTag(name, code) {
    const tag = document.getElementById("search-tag");
    const tagName = document.getElementById("tag-name");
    tag.style.display = "flex";
    tagName.innerHTML = name;
    globalState.tag = code;
}

function resetPage() {
    document.getElementById("suggestion-container").style.display = "none";
    document.getElementById("school-container").style.display = "none";
    document.getElementById("map").style.display = "none";
}

function initializeTag() {
    const tag = document.getElementById("search-tag");
    document.getElementById("remove-tag").onclick = () => {
        tag.style.display = "none";
        globalState.tag = null;
    }
}

function initializeMap() {
    globalState.map = L.map("map");

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(globalState.map);

    globalState.marker = L.marker([10, 10]).addTo(globalState.map);
}

function updateMap(lat, lng) {
    const map = document.getElementById("map");
    map.style.display = "block";

    globalState.map.setView([lat, lng], 13)
    globalState.marker.setLatLng([lat, lng]);
    globalState.marker.bindPopup("<b>Söderskolan</b>");
}