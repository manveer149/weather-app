const apiKey = "fc88e2fb7bb78f009f361da2f6ef729e"; // <-- apni OpenWeatherMap API key yaha paste karo
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherDisplay = document.getElementById("weatherDisplay");
const recentCities = document.getElementById("recentCities");

let currentTempCelsius = null;
let showingCelsius = true;

// -------------------- City Search --------------------
searchBtn.addEventListener("click", () => {
  let city = cityInput.value.trim();
  if (!city) {
    showError("⚠️ Please enter a city name.");
    return;
  }
  fetchWeather(city);
  saveRecentCity(city);
});

// -------------------- Fetch Weather --------------------
async function fetchWeather(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      showError("❌ City not found. Please try again.");
      return;
    }

    const data = await response.json();
    displayWeather(data);

    // 👇 forecast bhi call karo
    fetchForecast(city);

  } catch (error) {
    showError("⚠️ Something went wrong. Please check your internet.");
    console.error(error);
  }
}

// -------------------- Display Current Weather --------------------
function displayWeather(data) {
  currentTempCelsius = data.main.temp;
  showingCelsius = true;

  if (currentTempCelsius > 40) {
    alert("🔥 Extreme Heat Alert! Stay Hydrated.");
  }

  changeBackground(data.weather[0].main);

  weatherDisplay.innerHTML = `
    <div class="bg-white/90 rounded-2xl shadow-lg p-6 text-center">
      <h2 class="text-2xl font-bold mb-2">${data.name}, ${data.sys.country}</h2>
      <p class="text-lg capitalize">${data.weather[0].description}</p>
      <p id="temperature" class="text-3xl font-semibold mt-2">${currentTempCelsius} °C</p>
      
      <button id="toggleBtn" class="mt-3 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Show in °F
      </button>

      <div class="flex justify-center gap-6 mt-4">
        <p>💧 ${data.main.humidity}%</p>
        <p>💨 ${data.wind.speed} m/s</p>
      </div>
    </div>
  `;

  document.getElementById("toggleBtn").addEventListener("click", toggleTemp);
  document.getElementById("errorBox").classList.add("hidden");
}

// -------------------- Temp Toggle --------------------
function toggleTemp() {
  const tempElement = document.getElementById("temperature");
  if (showingCelsius) {
    let fahrenheit = (currentTempCelsius * 9/5) + 32;
    tempElement.innerText = `${fahrenheit.toFixed(2)} °F`;
    document.getElementById("toggleBtn").innerText = "Show in °C";
    showingCelsius = false;
  } else {
    tempElement.innerText = `${currentTempCelsius} °C`;
    document.getElementById("toggleBtn").innerText = "Show in °F";
    showingCelsius = true;
  }
}

// -------------------- Dynamic Background --------------------
function changeBackground(condition) {
  const body = document.body;

  if (condition.toLowerCase().includes("rain")) {
    body.className = "min-h-screen flex flex-col items-center justify-start p-4 bg-gradient-to-r from-gray-400 to-blue-700";
  } else if (condition.toLowerCase().includes("cloud")) {
    body.className = "min-h-screen flex flex-col items-center justify-start p-4 bg-gradient-to-r from-gray-200 to-gray-500";
  } else if (condition.toLowerCase().includes("clear")) {
    body.className = "min-h-screen flex flex-col items-center justify-start p-4 bg-gradient-to-r from-blue-300 to-yellow-200";
  } else {
    body.className = "min-h-screen flex flex-col items-center justify-start p-4 bg-gradient-to-r from-blue-200 to-blue-400";
  }
}

// -------------------- Error Handling --------------------
function showError(msg) {
  const errorBox = document.getElementById("errorBox");
  errorBox.innerText = msg;
  errorBox.classList.remove("hidden");
}

// -------------------- Current Location --------------------
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      () => {
        console.log("⚠️ Location access denied.");
      }
    );
  }
});

async function fetchWeatherByCoords(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    displayWeather(data);
    fetchForecast(data.name);
  } catch (error) {
    console.error(error);
  }
}

// -------------------- Recently Searched --------------------
function saveRecentCity(city) {
  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  if (!cities.includes(city)) cities.push(city);
  if (cities.length > 5) cities.shift();
  localStorage.setItem("recentCities", JSON.stringify(cities));
  updateDropdown();
}

function updateDropdown() {
  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  recentCities.innerHTML = `<option value="">-- Select city --</option>`;
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    recentCities.appendChild(option);
  });
}

recentCities.addEventListener("change", () => {
  const selectedCity = recentCities.value;
  if (selectedCity) fetchWeather(selectedCity);
});

updateDropdown();

// -------------------- Fetch 5-Day Forecast --------------------
async function fetchForecast(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) return;

    const data = await response.json();
    displayForecast(data);
  } catch (error) {
    console.error("Forecast Error:", error);
  }
}

// -------------------- Display Forecast --------------------
function displayForecast(data) {
  const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));

  let forecastHTML = `<h3 class="text-xl font-bold text-white mt-8 mb-4">5-Day Forecast</h3>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">`;

  dailyData.forEach(day => {
    const date = new Date(day.dt_txt);
    forecastHTML += `
      <div class="bg-white/90 rounded-xl shadow p-4 text-center">
        <p class="font-semibold">${date.toDateString().slice(0, 10)}</p>
        <p class="capitalize">${day.weather[0].description}</p>
        <p class="text-2xl font-bold">${day.main.temp.toFixed(1)} °C</p>
        <div class="flex justify-center gap-4 mt-2 text-sm">
          <span>💧 ${day.main.humidity}%</span>
          <span>💨 ${day.wind.speed} m/s</span>
        </div>
      </div>
    `;
  });

  forecastHTML += `</div>`;
  weatherDisplay.innerHTML += forecastHTML;
}
