const API_URL = "https://api.thedogapi.com/";
const ENDPOINT_IMAGE = "v1/images/";
const ENDPOINT_BREEDS = "v1/breeds";
const TIMEOUT_SEC = 10;
const RES_PER_PAGE = 10;
const letters = /^[A-Za-z ]+$/;
let noResultsMessage = false;

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

const form = document.getElementById("form");
const inputField = document.getElementById("input");
const parentElement = document.querySelector(".results");

let data;
let allbreeds;
let searchResult = [];

const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(
        new Error(`Request took too long! Timeout after ${TIMEOUT_SEC} second`)
      );
    }, s * 1000);
  });
};

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

    // allbreeds = data.map(({ id, name }) => ({ id, name }));
    // console.log(allbreeds);
  } catch (err) {
    console.error(`${err} 💥`);
    throw err;
  }
};

loadAllBreeds();

// !!! CHANGE - Clear search
function clearSearchResults() {
  document.querySelector(".results").innerHTML = "";
}

// !!! CHANGE - Render NO RESULTS
function renderNoResults() {
  noResultsMessage = true;

  const newDiv = document.createElement("div");
  parentElement.appendChild(newDiv);

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
        parentElement.appendChild(newDiv);

        // Clone the template
        const template = document.getElementById("search-result-item");

        const clone = template.content.cloneNode(true);

        parentElement.insertBefore(clone, parentElement.firstElementChild);

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

inputField.addEventListener("keydown", function (e) {
  if (!e.key.match(letters)) e.preventDefault();
});

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const input = form.querySelector(".form-control");
  const query = input.value;

  if (searchResult.length != 0 || noResultsMessage) clearSearchResults();

  if (!input.value.match(letters)) alert("Please use only letters");
  if (input.value.length < 3) alert("Please type at least 3 characters");
  renderSearchResults(query);
});
