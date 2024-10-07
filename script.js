const API_URL = "https://api.thedogapi.com/";
const ENDPOINT_IMAGE = "v1/images/";
// v1/images/search?breed_ids=beng&include_breeds=true
const ENDPOINT_BREEDS = "v1/breeds";
const TIMEOUT_SEC = 10;
const RES_PER_PAGE = 10;
const KEY =
  "api_key=live_HpBbdxFL6y03NezZL77QoH9nD6AiouDWrtOkhb8fs2jJryxXFNzLtJEpPP6GUPxA";

const headers = new Headers({
  "Content-Type": "application/json",
  "x-api-key":
    "api_key=live_HpBbdxFL6y03NezZL77QoH9nD6AiouDWrtOkhb8fs2jJryxXFNzLtJEpPP6GUPxA",
});

const requestOptions = {
  method: "GET",
  headers: headers,
  redirect: "follow",
};

const form = document.getElementById("form");

let parentElement;
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

function clearSearchResults() {
  document.querySelector(".results").innerHTML = "";
}

const renderSearchResults = async function (query) {
  try {
    matchedBreeds = allbreeds.filter((dog) =>
      dog.name.toLowerCase().includes(query)
    );

    console.log(matchedBreeds);

    matchedBreeds.map(async function (dog) {
      const picRef = dog.reference_image_id;
      const picture = await AJAX(`${API_URL}${ENDPOINT_IMAGE}${picRef}`);
      searchResult = {
        name: dog.name || "Some cute dog",
        breedGroup: dog.breed_group,
        bredFor: dog.bred_for,
        weight: dog.weight.metric,
        height: dog.height.metric,
        lifeSpan: dog.life_span,
        origin: dog.origin,
        temperament: dog.temperament,
        img: picture.url,
      };

      const generateMarUp = function (dog) {
        parentElement = document.querySelector(".results");

        const markup = `<li class="search-result">
                <div class="dog-name"> 
                    <h3>${dog.name}</h3>
                    <p>The breed belongs to ${
                      dog.breedGroup
                    } dogs. Is bred for ${
          dog.bredFor
        }. The breed is ${dog.temperament.toLowerCase()}. Has a life span of ${
          dog.lifeSpan
        }. Originates from ${dog.origin}. Weight: ${dog.weight}. Height: ${
          dog.height
        }. </p>
                    <img src=${dog.img} alt=${dog.name} width="150"></img>
                </div>
            </li>`;

        parentElement.insertAdjacentHTML("afterbegin", markup);
      };

      generateMarUp(searchResult);
    });

    // console.log(dog.name);
  } catch (err) {
    console.error(`${err} 💥`);
    throw err;
  }
};

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (searchResult.length != 0) clearSearchResults();
  const query = form.querySelector(".form-control").value;
  //   console.log(query);
  renderSearchResults(query);
});
