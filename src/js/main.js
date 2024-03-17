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

        input.addEventListener("input", debounce(() => {
            searchContainer.classList.add("at-top");

            search(input.value.toLowerCase(), regionsData, schoolsData);
        }));

        document.addEventListener("keydown", (e) => {
            if (document.querySelectorAll(".suggestion").length != 0) {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();
                    moveSelection(e.key);
                }

                if (e.key === "Enter") select();
                if (e.key === "Backspace" && input.value === "") removeTag();
            };
        });

    } else {
        console.log("ERROR");
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const suggestions = document.getElementById("suggestion-container");
            suggestions.style.display = "none";
            suggestions.innerHTML = "";
        }
    });

    document.getElementById("logo").onclick = () => reload();
    document.getElementById("remove-tag").onclick = () => removeTag();
    initializeMap();
}

const debounce = (fn, delay = 20) => { 
    let timerId = null; 
    return (...args) => { 
        clearTimeout(timerId); 
        timerId = setTimeout(() => fn(...args), delay); 
    }; 
};

function moveSelection(key) {
    const suggestions = document.querySelectorAll("[index]");
    const option = document.querySelector(".selected");
    const operator = (key === "ArrowUp") ? -1 : 1;

    if (option) {
        option.classList.remove("selected");
        const max = suggestions[suggestions.length-1].getAttribute("index");
        let query = "";

        if (option.getAttribute("index") === "0" && key === "ArrowUp") {
            query = `[index="${max}"]`;
        } else if (option.getAttribute("index") === max && key === "ArrowDown") {
            query = `[index="0"]`;
        } else {
            query = `[index="${parseInt(option.getAttribute("index"))+operator}"]`;
        }

        const newSuggestion = document.querySelector(query);
        newSuggestion.classList.add("selected");

        document.querySelector(".selected").scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    
    if (!option && key === "ArrowDown") document.querySelectorAll(".suggestion")[0].classList.add("selected");
}

function select() {
    const selection = document.querySelector(".selected");

    if (selection) {
        if (!selection.getAttribute("name")) {
            showSchool(selection.getAttribute("code"));
        } else {
            addSearchTag(selection.getAttribute("name"), selection.getAttribute("code"));
        }
    }
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
    
        suggest(schoolsResult.slice(0, 50), regionsResult.slice(0, 50));
    }
}

function suggest(schools, regions = null) {
    const container = document.getElementById("suggestion-container");
    container.innerHTML = "";
    container.style.display = "flex";
    
    if ((schools.length === 0) && (regions === null || regions.length === 0) ) {
        const div = document.createElement("div");
        const name = document.createElement("p");
        name.innerHTML = "Inget resultat";
        div.classList.add("no-result");
        name.classList.add("type-text");
        div.appendChild(name);
        container.appendChild(div);
    }
    
    let index = 0;

    if (regions) {
        regions.forEach((region) => {
            const div = document.createElement("div");
            const name = document.createElement("p");
            const nameText = document.createTextNode(region.Namn);
            const type = document.createElement("p");
            type.innerHTML = "Kommun";
    
            div.setAttribute("index", index);
            div.setAttribute("name", region.Namn);
            div.setAttribute("code", region.Kommunkod);
            div.classList.add("suggestion");
            type.classList.add("type-text");
    
            name.appendChild(nameText);
            div.appendChild(name);
            div.appendChild(type);
            div.addEventListener("mouseover", () => mouseEvent(div, "add"));
            div.addEventListener("mouseout", () => mouseEvent(div, "remove"));
            div.onclick = () => addSearchTag(region.Namn, region.Kommunkod);
            container.appendChild(div);
            index++;
        });
    }

    schools.forEach((school) => {
        const div = document.createElement("div");
        const name = document.createElement("p");
        const nameText = document.createTextNode(school.Skolenhetsnamn);
        const type = document.createElement("p");
        type.innerHTML = "Skola";

        div.setAttribute("index", index);
        div.setAttribute("code", school.Skolenhetskod);
        div.classList.add("suggestion");
        type.classList.add("type-text");

        name.appendChild(nameText);
        div.appendChild(name);
        div.appendChild(type);
        div.addEventListener("mouseover", () => mouseEvent(div, "add"));
        div.addEventListener("mouseout", () => mouseEvent(div, "remove"));
        div.onclick = () => showSchool(school.Skolenhetskod);
        container.appendChild(div);
        index++;
    });
}

function mouseEvent(element, option) {
    const prevSelect = document.querySelector(".selected");
    if (prevSelect) prevSelect.classList.remove("selected");

    option === "add" ? element.classList.add("selected") : element.classList.remove("selected");
}

async function showSchool(code) {
    resetPage();
    const school = await getSchool(code);
    const container = document.getElementById("school-container");
    container.style.display = "flex";
    
    document.getElementById("input").value = school.SkolenhetInfo.Namn;

    document.getElementById("school-name").innerHTML = school.SkolenhetInfo.Namn;
    document.getElementById("principal-name").innerHTML = `Rektor: ${school.SkolenhetInfo.Rektorsnamn}`;
    document.getElementById("street").innerHTML = school.SkolenhetInfo.Besoksadress.Adress;
    document.getElementById("zip-city").innerHTML = `${school.SkolenhetInfo.Besoksadress.Postnr} ${school.SkolenhetInfo.Besoksadress.Ort}`;

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
    if (lat && lng) updateMap(lat, lng, school.SkolenhetInfo.Namn);
    else mapError();
}

async function getSchool(code) {
    const url = "/skolenhetsregistret/v1/skolenhet/" + code;
    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        console.log("ERROR");
    }
}

function addSearchTag(name, code) {
    const tag = document.getElementById("search-tag");
    const tagName = document.getElementById("tag-name");
    tag.style.display = "flex";
    tagName.innerHTML = name;
    globalState.tag = code;

    const input = document.getElementById("input");
    const container = document.getElementById("suggestion-container");
    input.value = "";
    input.placeholder = "Skriv namnet på en skola... ";
    input.focus();
    container.style.display = "none";
}

function resetPage() {
    document.getElementById("school-container").style.display = "none";
    document.getElementById("map").style.display = "none";
    document.getElementById("alert").style.display = "none";
    const suggestions = document.getElementById("suggestion-container");
    suggestions.style.display = "none";
    suggestions.innerHTML = "";
}

function removeTag() {
    const tag = document.getElementById("search-tag");
    tag.style.display = "none";
    globalState.tag = null;
    
    const input  = document.getElementById("input");
    input.placeholder = "Skriv namnet på en skola eller kommun..."
    input.focus();
}

function initializeMap() {
    globalState.map = L.map("map");

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(globalState.map);

    globalState.marker = L.marker([10, 10]).addTo(globalState.map);
}

function updateMap(lat, lng, name) {
    const map = document.getElementById("map");
    map.style.display = "block";

    globalState.map.setView([lat, lng], 13)
    globalState.marker.setLatLng([lat, lng]);
    globalState.marker.bindPopup(`<b>${name}</b>`).openPopup();
}

function mapError() {
    const element = document.getElementById("alert");
    element.style.display = "flex";
}

function reload() {
    const searchContainer = document.getElementById("search-container");
    if (searchContainer.classList.contains("at-top")) searchContainer.classList.remove("at-top");
    const input = document.getElementById("input");
    input.value = "";
    input.focus();
    removeTag();
    resetPage();
}