// ----- TO-DO:
// 1. FIX clear input - saves meta, enter etc.;
// 2. Add arrows for autocomplete nav
// 3. Find another way to filter out input keys
// 4. !!! Autocomplete doesn't show the first child

const API_URL = "https://api.thedogapi.com/";
const ENDPOINT_IMAGE = "v1/images/";
const ENDPOINT_BREEDS = "v1/breeds";
const TIMEOUT_SEC = 10;
const RES_PER_PAGE = 10;
const letters = /^[A-Za-z ]+$/;
let noResultsMessage = false;
let input = "";
// let matchedBreeds = [];

// API headers
const headers = new Headers({
  "Content-Type": "application/json",
});

// API request options
const requestOptions = {
  method: "GET",
  headers: headers,
  redirect: "follow",
};

// DOM elements
const form = document.getElementById("form");
const inputField = document.getElementById("input");
const resultsList = document.getElementById("results");
const autocompleteList = document.getElementById("list-group");

let data;
let allbreeds;
let allBreedNames = [];
let searchResult = [];

// Handle timeout
const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(
        new Error(`Request took too long! Timeout after ${TIMEOUT_SEC} second`)
      );
    }, s * 1000);
  });
};

// Fetch API data
const AJAX = async function (url) {
  try {
    const res = await Promise.race([
      fetch(url, requestOptions),
      timeout(TIMEOUT_SEC),
    ]);
    const data = await res.json();

    if (!res.ok) throw new Error(`Result status: (${res.status})`);
    return data;
  } catch (err) {
    throw err;
  }
};

// Load all data
const loadAllBreeds = async function () {
  try {
    allbreeds = await AJAX(`${API_URL}${ENDPOINT_BREEDS}`);

    allBreedNames = allbreeds.map((dog) => dog.name);
  } catch (err) {
    console.error(`${err} 💥`);
    throw err;
  }
};

loadAllBreeds();

// ------- Search ---------

// Clear search
function clearInput() {
  input = "";
  inputField.value = "";
}

function clearSearchResults() {
  clearInput();
  document.querySelector(".results").innerHTML = "";
}

// Render NO RESULTS
function renderNoResults() {
  noResultsMessage = true;

  const newDiv = document.createElement("div");
  resultsList.appendChild(newDiv);

  newDiv.textContent = "Sorry, no doggos found!";

  return noResultsMessage;
}

// Render search results
const renderSearchResults = async function (query) {
  try {
    matchedBreeds = allbreeds.filter((dog) =>
      dog.name.toLowerCase().includes(query.toLowerCase())
    );
    if (matchedBreeds.length === 0) {
      renderNoResults();
      return;
    }

    // Object from NODE
    matchedBreeds.map(async function (dog) {
      const picRef = dog.reference_image_id;
      const picture = await AJAX(`${API_URL}${ENDPOINT_IMAGE}${picRef}`);

      searchResult = {
        name: dog.name,
        breedGroup: dog.breed_group,
        bredFor: dog.bred_for,
        weight: dog.weight.metric,
        height: dog.height.metric,
        lifeSpan: dog.life_span,
        temperament: dog.temperament,
        img: picture.url,
      };

      // Render result item
      const generateMarUp = function (dog) {
        // Create new div for result item
        const newDiv = document.createElement("div");
        resultsList.appendChild(newDiv);

        // Clone the template
        const template = document.getElementById("search-result-item");

        const clone = template.content.cloneNode(true);

        resultsList.insertBefore(clone, resultsList.firstElementChild);

        // Fill the template
        let dogBreed = document.getElementById("breed");
        let dogDescription = document.getElementById("description");
        let dogImg = document.getElementById("img");

        dogBreed.textContent = dog.name;

        dogDescription.textContent = `The breed belongs to ${dog.breedGroup?.toLowerCase()} dogs. Purpose: ${
          dog.bredFor
        }. The breed is ${dog.temperament?.toLowerCase()}. Has a life span of ${
          dog.lifeSpan
        }. Weight: ${dog.weight}. Height: ${dog.height}.`;

        dogImg.src = picture.url;

        dogImg.alt = `${dog.name}`;
      };

      generateMarUp(searchResult);
    });
  } catch (err) {
    console.error(`${err} 💥`);
    throw err;
  }
};

// ------- Autocomplete -------

const clearAutocomplete = function () {
  // document.querySelector(".list-group").innerHTML = "";
  autocompleteList.replaceChildren();
};

// Clear list
inputField.addEventListener("keydown", function (e) {
  if (autocompleteList.hasChildNodes()) clearAutocomplete();

  // Prevent symbols and numerals input
  if (!e.key.match(letters)) {
    e.preventDefault();
  }

  // Read input
  if (e.key.match(letters) && e.key.length < 2) {
    input += e.key;
  }

  if (e.key === "Backspace" && input !== "") {
    input = input.slice(0, -1);
    // Clear list
    if (input === "") {
      clearAutocomplete();
      return;
    }
  }

  if (e.key === "Enter") {
    clearAutocomplete();
    return;
  }

  // Find matches
  const autocompleteResults = allBreedNames.filter((breed) => {
    return breed.toLowerCase().includes(input.toLowerCase());
  });

  // Render results
  const renderAutocomplete = function () {
    // const newDiv = document.createElement("div");
    // autocompleteList.appendChild(newDiv);

    autocompleteResults.map(async (res) => {
      const template = document.getElementById("autofill-items-list");
      const listItem = document.getElementById("list-item");

      const clone = template.content.cloneNode(true);

      await autocompleteList.insertBefore(
        clone,
        autocompleteList.firstElementChild
      );
      if (listItem) listItem.textContent = res;
    });
  };

  renderAutocomplete();
});

// Choose autocomplete result
autocompleteList.addEventListener("click", function (e) {
  const query = e.target.closest("button").textContent;
  if (query) {
    clearAutocomplete();
    clearSearchResults();
    renderSearchResults(query);
  }
});

// Submit form
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const query = form.querySelector(".form-control").value;

  // if (!query.match(letters)) alert("Please use only letters");
  if (inputField.value.length < 3) {
    alert("Please type at least 3 characters");
    return;
  }

  if (searchResult.length != 0 || noResultsMessage) clearSearchResults();

  renderSearchResults(query);
  clearAutocomplete();
  clearInput();
});
