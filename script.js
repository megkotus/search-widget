const API_URL = "https://api.thedogapi.com/";
const ENDPOINT_IMAGE = "v1/images/";
const ENDPOINT_BREEDS = "v1/breeds";
const TIMEOUT_SEC = 10;
const RES_PER_PAGE = 10;
const letters = /^[A-Za-z ]+$/;
let noResultsMessage = false;
let input = "";
let index = -1;
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

// Clear input value
function clearInput() {
  input = "";
  inputField.value = "";
  index = -1;
}

// Clear search results
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
        let dogDescriptionBreedGroup = document.getElementById(
          "description-breed-group"
        );
        let dogDescriptionPurpose = document.getElementById(
          "description-purpose"
        );
        let dogDescriptionTemperament = document.getElementById(
          "description-temperament"
        );
        let dogDescriptionWeight =
          document.getElementById("description-weight");
        let dogDescriptionHeight =
          document.getElementById("description-height");
        let dogImg = document.getElementById("img");

        dogBreed.textContent = dog.name;

        if (dog.breedGroup) {
          dogDescriptionBreedGroup.textContent = `The breed belongs to ${dog.breedGroup.toLowerCase()} dogs.`;
        }
        if (dog.bredFor) {
          dogDescriptionPurpose.textContent = `Purpose: ${dog.bredFor}.`;
        }

        if (dog.temperament) {
          dogDescriptionTemperament.textContent = `The breed is ${dog.temperament.toLowerCase()}. Has a life span of ${
            dog.lifeSpan
          }.`;
        }
        if (dog.weight) {
          dogDescriptionWeight.textContent = `Weight: ${dog.weight.replace(
            "NaN -",
            "up to"
          )} kg.`;
        }
        if (dog.height) {
          dogDescriptionHeight.textContent = `Height: ${dog.height.replace(
            "NaN -",
            "up to"
          )} cm.`;
        }

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

// Clear list
const clearAutocomplete = function () {
  autocompleteList.replaceChildren();
};

// Render autocomplete results
const renderAutocomplete = function (autocompleteResults) {
  autocompleteResults.forEach((res) => {
    const template = document.getElementById("autofill-items-list");
    const clone = template.content.cloneNode(true);

    const listItem = clone.querySelector("#list-item");

    if (listItem) listItem.textContent = res;

    autocompleteList.appendChild(clone);
  });
};

// Read input
inputField.addEventListener("input", function (e) {
  // Clear previous
  if (autocompleteList.hasChildNodes()) clearAutocomplete();

  input = e.target.value.trim();

  if (!input || !input.match(letters)) return;

  input = e.target.value;

  const autocompleteResults = allBreedNames.filter((breed) => {
    return breed.toLowerCase().includes(input.toLowerCase());
  });

  if (autocompleteResults.length) renderAutocomplete(autocompleteResults);
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

// For mobile
autocompleteList.addEventListener("touchstart", function (e) {
  const query = e.target.closest("button").textContent;
  if (query) {
    clearAutocomplete();
    clearSearchResults();
    renderSearchResults(query);
  }
});

// For desktop
inputField.addEventListener("keydown", function (e) {
  const listItems = document.querySelectorAll(".list-group-item");

  if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
    // Select item on Enter
    if (e.key === "Enter" && index !== -1) {
      e.preventDefault();
      const query = listItems[index].textContent;
      clearAutocomplete();
      clearSearchResults();
      renderSearchResults(query);
      return;
    }

    if (e.key === "ArrowDown") {
      index = index === listItems.length - 1 ? 0 : index + 1;
    }

    if (e.key === "ArrowUp") {
      index = index <= 0 ? listItems.length - 1 : index - 1;
    }

    // Highlight current item
    listItems.forEach((item, i) =>
      item.classList.toggle("active", i === index)
    );
  }
});

// Submit form
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const query = form.querySelector(".form-control").value;

  if (inputField.value.length < 3) {
    alert("Please type at least 3 characters");
    return;
  }

  if (searchResult.length != 0 || noResultsMessage) clearSearchResults();

  renderSearchResults(query);
  clearAutocomplete();
  clearInput();
});
