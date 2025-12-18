const weatherCodes = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm"
};

function fetchWeatherAndCity(lat, lon, tempUnit = 'celsius') {
    const now = new Date();
    const cachedWeather = localStorage.getItem('weatherData');
    
    if (cachedWeather) {
        const weatherData = JSON.parse(cachedWeather);
        if ((now - new Date(weatherData.timestamp)) < 30 * 60 * 1000) {
            document.getElementById('weather').textContent = weatherData.text;
            return;
        }
    }

    const tempUnitParam = tempUnit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true${tempUnitParam}`)
        .then(res => res.json())
        .then(data => {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            const desc = weatherCodes[code] || `Code ${code}`;
            let weatherText = `${desc}, ${temp}°${tempUnit === 'celsius' ? 'C' : 'F'}`;

            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(res => res.json())
                .then(location => {
                    const city = location.address.city || location.address.town || location.address.village || location.address.county || "your area";
                    const weatherString = `${city}: ${weatherText}`;
                    document.getElementById('weather').textContent = weatherString;
                    
                    // Cache the weather data
                    localStorage.setItem('weatherData', JSON.stringify({
                        text: weatherString,
                        timestamp: now.toISOString()
                    }));
                })
                .catch(() => {
                    document.getElementById('weather').textContent = weatherText;
                });
        })
        .catch(() => {
            document.getElementById('weather').textContent = "Unable to fetch weather.";
        });
}

function fetchWeatherByCity(city, tempUnit = 'celsius') {
    const now = new Date();
    const cachedWeather = localStorage.getItem('weatherData');
    
    if (cachedWeather) {
        const weatherData = JSON.parse(cachedWeather);
        if ((now - new Date(weatherData.timestamp)) < 30 * 60 * 1000) {
            document.getElementById('weather').textContent = weatherData.text;
            return;
        }
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`)
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0];
                fetchWeatherAndCity(lat, lon, tempUnit);
            } else {
                document.getElementById('weather').textContent = "City not found";
            }
        })
        .catch(() => {
            document.getElementById('weather').textContent = "Unable to fetch weather";
        });
}

function renderWeather(settings) {
    loadStylesheet('components/css/weather.css');
    document.getElementById('weather').textContent = "Fetching weather...";
    const useCustomCity = settings.useCustomCity;
    const tempUnit = settings.tempUnit || 'celsius';
    if (useCustomCity && settings.customCity) {
        const customCity = settings.customCity;
        fetchWeatherByCity(customCity, tempUnit);
    } else {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => fetchWeatherAndCity(pos.coords.latitude, pos.coords.longitude, tempUnit),
                () => { document.getElementById('weather').textContent = "Location access denied."; }
            );
        } else {
            document.getElementById('weather').textContent = "Geolocation not supported.";
        }
    }
}


export { renderWeather };