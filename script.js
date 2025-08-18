// Configuración de la API
const API_KEY = 'bb03671c9cc327a1d4c1e80988099bed'; // Reemplaza con tu API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';
const ICON_URL = 'https://openweathermap.org/img/wn/';

// Elementos del DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const toggleUnitBtn = document.getElementById('toggle-unit');
const cityNameEl = document.getElementById('city-name');
const temperatureEl = document.getElementById('temperature');
const tempUnitEl = document.getElementById('temp-unit');
const weatherDescEl = document.getElementById('weather-description');
const weatherIconContainer = document.getElementById('weather-icon-container');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const forecastContainer = document.getElementById('forecast-container');
const customAlert = document.getElementById('custom-alert');

// Variables de estado
let currentUnit = 'celsius';
let currentWeatherData = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    searchBtn.addEventListener('click', searchWeather);
    locationBtn.addEventListener('click', getLocationWeather);
    toggleUnitBtn.addEventListener('click', toggleTemperatureUnit);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });
    fetchWeather('Madrid'); // Ciudad inicial
});

// Función para buscar clima
function searchWeather() {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    } else {
        showAlert('Por favor ingresa una ciudad');
    }
}

// Función para obtener ubicación
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                showAlert('Error al obtener ubicación: ' + error.message);
            }
        );
    } else {
        showAlert('Geolocalización no soportada en tu navegador');
    }
}

// Función para cambiar unidades
function toggleTemperatureUnit() {
    currentUnit = currentUnit === 'celsius' ? 'fahrenheit' : 'celsius';
    toggleUnitBtn.textContent = currentUnit === 'celsius' ? 'Cambiar a °F' : 'Cambiar a °C';
    if (currentWeatherData) updateWeatherDisplay(currentWeatherData);
}

// Función principal para obtener clima
async function fetchWeather(city) {
    try {
        showLoading(true);
        resetWeatherDisplay();
        
        const response = await fetch(`${BASE_URL}weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`);
        const data = await response.json();
        
        if (data.cod === 200) {
            const forecastResponse = await fetch(`${BASE_URL}forecast?q=${city}&appid=${API_KEY}&units=metric&lang=es`);
            const forecastData = await forecastResponse.json();
            
            currentWeatherData = { ...data, forecast: forecastData.list };
            updateWeatherDisplay(currentWeatherData);
            cityInput.value = '';
        } else {
            throw new Error(data.message || 'Ciudad no encontrada');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(`Error: ${error.message}`);
        resetWeatherDisplay();
    } finally {
        showLoading(false);
    }
}

// Función para obtener clima por coordenadas
async function fetchWeatherByCoords(lat, lon) {
    try {
        showLoading(true);
        resetWeatherDisplay();
        
        const response = await fetch(`${BASE_URL}weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`);
        const data = await response.json();
        
        if (data.cod === 200) {
            const forecastResponse = await fetch(`${BASE_URL}forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`);
            const forecastData = await forecastResponse.json();
            
            currentWeatherData = { ...data, forecast: forecastData.list };
            updateWeatherDisplay(currentWeatherData);
        } else {
            throw new Error(data.message || 'Error al obtener clima');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(`Error: ${error.message}`);
        resetWeatherDisplay();
    } finally {
        showLoading(false);
    }
}

// Actualizar la visualización del clima
function updateWeatherDisplay(data) {
    cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    
    const temp = currentUnit === 'celsius' ? data.main.temp : (data.main.temp * 9/5) + 32;
    temperatureEl.textContent = Math.round(temp);
    tempUnitEl.textContent = currentUnit === 'celsius' ? '°C' : '°F';
    
    weatherDescEl.textContent = data.weather[0].description;
    humidityEl.textContent = data.main.humidity;
    windSpeedEl.textContent = Math.round(data.wind.speed * 3.6);
    
    updateWeatherIcon(data.weather[0].icon, data.weather[0].description);
    updateBackground(data.weather[0].main, data.weather[0].icon);
    updateForecastDisplay(data.forecast);
}

// Función para actualizar ícono del clima
function updateWeatherIcon(iconCode, description) {
    weatherIconContainer.innerHTML = '';
    const img = document.createElement('img');
    img.src = `${ICON_URL}${iconCode}@4x.png`;
    img.alt = description;
    img.onerror = () => {
        weatherIconContainer.textContent = getWeatherEmoji(iconCode);
    };
    weatherIconContainer.appendChild(img);
}

// Función para obtener emoji de clima
function getWeatherEmoji(iconCode) {
    const iconMap = {
        '01d': '☀️', '01n': '🌕', '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
        '11d': '⚡', '11n': '⚡', '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌈';
}

// Función para actualizar fondo según clima
function updateBackground(weatherCondition, iconCode) {
    document.body.className = '';
    document.body.style.background = '';
    
    const isNight = iconCode.includes('n');
    switch (weatherCondition.toLowerCase()) {
        case 'clear': document.body.classList.add(isNight ? 'clear-night' : 'clear-day'); break;
        case 'clouds': document.body.classList.add('clouds'); break;
        case 'rain': document.body.classList.add('rain'); break;
        case 'snow': document.body.classList.add('snow'); break;
        case 'thunderstorm': document.body.classList.add('thunderstorm'); break;
        case 'drizzle': document.body.classList.add('drizzle'); break;
        case 'mist': case 'fog': case 'haze': document.body.classList.add('mist'); break;
        default: document.body.classList.add('default-bg');
    }
}

// Función para actualizar pronóstico
function updateForecastDisplay(forecastList) {
    forecastContainer.innerHTML = '';
    const dailyForecasts = groupByDay(forecastList).slice(0, 3);
    
    dailyForecasts.forEach(day => {
        const date = new Date(day[0].dt * 1000);
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
        
        const temps = day.map(item => item.main.temp);
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        
        const middayForecast = day.find(item => {
            const hour = new Date(item.dt * 1000).getHours();
            return hour >= 11 && hour <= 15;
        }) || day[0];
        
        const displayMax = currentUnit === 'celsius' ? Math.round(maxTemp) : Math.round((maxTemp * 9/5) + 32);
        const displayMin = currentUnit === 'celsius' ? Math.round(minTemp) : Math.round((minTemp * 9/5) + 32);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        dayElement.innerHTML = `
            <h4>${dayName}</h4>
            <div class="forecast-icon">
                <img src="${ICON_URL}${middayForecast.weather[0].icon}.png" 
                     onerror="this.replaceWith('${getWeatherEmoji(middayForecast.weather[0].icon)}')">
            </div>
            <div class="forecast-temp">
                <span>${displayMax}°</span> / <span>${displayMin}°</span>
            </div>
            <div>${middayForecast.weather[0].description}</div>
        `;
        forecastContainer.appendChild(dayElement);
    });
}

// Función para agrupar por día
function groupByDay(forecastList) {
    const grouped = {};
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('es-ES');
        grouped[date] = grouped[date] || [];
        grouped[date].push(item);
    });
    return Object.values(grouped);
}

// Función para resetear la visualización
function resetWeatherDisplay() {
    cityNameEl.textContent = 'Ciudad no encontrada';
    temperatureEl.textContent = '--';
    weatherDescEl.textContent = 'Intenta con otro nombre';
    weatherIconContainer.innerHTML = '🌍';
    humidityEl.textContent = '--';
    windSpeedEl.textContent = '--';
    forecastContainer.innerHTML = '';
    document.body.className = 'default-bg';
    document.body.style.background = '';
    document.querySelector('.container').style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
}

// Función para mostrar alertas
function showAlert(message) {
    customAlert.textContent = message;
    customAlert.style.display = 'block';
    setTimeout(() => customAlert.style.display = 'none', 3000);
}

// Función para mostrar carga
function showLoading(show) {
    document.querySelector('.weather-card').classList.toggle('loading', show);
}