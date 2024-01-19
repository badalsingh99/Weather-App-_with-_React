import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Weather.css';
import search from './images/search.png';
import clouds from './images/clouds.png';
// import nature from './images/nature.png';
import rain from './images/rain.png';
// import weather from './images/weather.png';
import clear from './images/clear.png';
import drizzle from './images/drizzle.png';
import snow from './images/snow.png';
import mist from './images/mist.png';
import humidity from './images/humidity.png';
import wind from './images/wind.png';


import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, set, push } from 'firebase/database';
import firebase from './Firebase';

const Weather = () => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState([]);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState(null);
  const [userName, setUserName] = useState('');
  const [userCities, setUserCities] = useState([]);
  const [indiaWeather, setIndiaWeather] = useState(null);

  const apiKey = 'f40b154d0d757972e43739ac7fb2b0b3';
  const apiUrl = 'https://api.openweathermap.org/data/2.5/weather?units=metric&q=';

  const auth = getAuth();
  const db = getDatabase();


  useEffect(() => {
    const fetchIndiaWeather = async () => {
      try {
        const indiaResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=India&units=metric&appid=${apiKey}`
        );
        setIndiaWeather(indiaResponse.data);
      } catch (error) {
        console.error('Error fetching India weather:', error);
      }
    };

    fetchIndiaWeather();
  }, []);

  

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        setCurrentUserUid(user.uid);
        setUserName(user.displayName);
        // Load saved weather data from local storage for the user
        const savedCities = JSON.parse(localStorage.getItem(user.uid)) || [];
        setWeatherData(savedCities);
        // Load user cities from Firebase
        loadUserCitiesFromFirebase(user.uid);
      } else {
        setCurrentUserUid(null);
        setUserName('');
        setWeatherData([]);
        setUserCities([]);
      }
    });
  }, [auth]);

  const loadUserCitiesFromFirebase = (uid) => {
    const userCityRef = ref(db, `users/${uid}/cities`);
    const cities = [];
    // Retrieve user's city data from Firebase
    onValue(userCityRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.keys(data).forEach((cityName) => {
          cities.push(cityName);
        });
      }
    });
    setUserCities(cities);
  };

  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;

        // Save user data to Firebase (name and email)
        saveUserToFirebase(user.uid, {
          name: user.displayName,
          email: user.email,
          cities: {} // Empty object to store user's cities
        });

        setCurrentUserUid(user.uid);
        setUserName(user.displayName);
      }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
      });
  };

  const saveUserToFirebase = (uid, userData) => {
    const userRef = ref(db, `users/${uid}`);
    set(userRef, userData);
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(apiUrl + city + `&appid=${apiKey}`);
      const data = response.data;
      if (data.cod === '404') {
        throw new Error('City not found. Please enter a valid city name.');
      }

      // Save weather data in browser local storage
      const savedCities = JSON.parse(localStorage.getItem(currentUserUid)) || [];
      savedCities.push({ ...data, uid: currentUserUid });
      localStorage.setItem(currentUserUid, JSON.stringify(savedCities));

      // Save weather data to Firebase under the current user's cities
      saveCityToFirebase(data.name, currentUserUid);

      setWeatherData((prevData) => [...prevData, { ...data, uid: currentUserUid }]);
      setError('');
      setCity('');
    } catch (error) {
      setWeatherData([]);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCityToFirebase = (cityName, uid) => {
    const userCityRef = ref(db, `users/${uid}/cities`);
    push(userCityRef, cityName);
  };

  const handleDelete = (i) => {
    const updatedWeatherData = [...weatherData];
    updatedWeatherData.splice(i, 1);
    setWeatherData(updatedWeatherData);

    // Update local storage data after deleting a city
    localStorage.setItem(currentUserUid, JSON.stringify(updatedWeatherData));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getWeatherIcon = (weatherCode) => {
    switch (weatherCode) {
      case '01':
        return clear;
      case '02':
        return clouds;
      case '03':
        return rain;
      case '04':
        return drizzle;
      case '05':
        return snow;
      case '06':
        return mist;
      default:
        return clear;
    }
  };

  // Filter weather data based on the current user's UID
  const filteredWeatherData = weatherData.filter(data => data.uid === currentUserUid);

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <div className="user-info">
            <br />
            <p>Hello, {userName}!</p>
            <button className='logout' onClick={() => auth.signOut()}>Logout</button>
          </div>
          <div className="search">
            <input
              type="text"
              placeholder="Enter City Name"
              spellCheck="false"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={handleSearch} disabled={isLoading}>
              <img src={search} alt="search" />
            </button>
          </div>

          {error && <div className="error"><p>{error}</p></div>}

          {filteredWeatherData.map((data, i) => (
            <div className="card" key={i}>
              <div className="weather">
                <img src={getWeatherIcon(data.weather[0].icon.slice(0, 2))} className="weather-icon" alt="Weather Icon" />
                <h1 className="temp">{Math.round(data.main.temp)}°C</h1>
                <h2 className="city">{data.name}</h2>
                <div className="details">
                  <div className="col">
                    <img src={humidity} alt="Humidity Icon" />
                    <div>
                      <p className="humidity">{data.main.humidity}%</p>
                      <p>Humidity</p>
                    </div>
                  </div>
                  <div className="col">
                    <img src={wind} alt="Wind Icon" />
                    <div>
                      <p className="wind">{data.wind.speed}km/hr</p>
                      <p>Wind Speed</p>
                    </div>
                  </div>
                </div>
              </div>
              <button className="button-30" onClick={() => handleDelete(i)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="main-background">
          <div className="centered-container">
          
          <div className="centered-content">
          <div className='red-sun'>
            <div className="icon sunny">
                <div className="sun">
                  <div className="rays"></div>
                </div>
              </div>
          </div>
          <h1>Welcome to My WeatherApp</h1>
          <div className="india-weather">
          <div className="icon cloudy">
            <div className="cloud"></div>
            <div className="cloud"></div>
          </div>

              {indiaWeather && (
                    <h3 className='india'>Current Temperature in India: {Math.round(indiaWeather.main.temp)}°C</h3>
                )}
          </div>
          <div className='para'>
            <p>"If you wish to check the weather within India through a search,
               please log in first." </p>
          </div>
           <div className="login-button" >
            <button type="button" className="login-with-google-btn"  onClick={() => handleLogin()} >
              Sign in with Google
            </button>
           </div>
           
          </div>
        </div>
      </div>
    
     
       
      )}
    </div>
  );
};

export default Weather;
