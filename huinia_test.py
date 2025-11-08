import openmeteo_requests

import pandas as pd
import requests_cache
from retry_requests import retry

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

# Make sure all required weather variables are listed here
# The order of variables in hourly or daily is important to assign them correctly below
url = "https://api.open-meteo.com/v1/forecast"
params = {
	"latitude": 48.7139,
	"longitude": 21.2581,
	"minutely_15": ["temperature_2m", "relative_humidity_2m", "rain", "snowfall", "wind_speed_10m", "visibility"],
	"timezone": "Europe/Berlin",
	"forecast_days": 1,
	"timeformat": "unixtime",
}
responses = openmeteo.weather_api(url, params=params)

# Process first location. Add a for-loop for multiple locations or weather models
response = responses[0]
print(f"Coordinates: {response.Latitude()}°N {response.Longitude()}°E")
print(f"Elevation: {response.Elevation()} m asl")
print(f"Timezone: {response.Timezone()}{response.TimezoneAbbreviation()}")
print(f"Timezone difference to GMT+0: {response.UtcOffsetSeconds()}s")

# Process minutely_15 data. The order of variables needs to be the same as requested.
minutely_15 = response.Minutely15()
minutely_15_temperature_2m = minutely_15.Variables(0).ValuesAsNumpy()
minutely_15_relative_humidity_2m = minutely_15.Variables(1).ValuesAsNumpy()
minutely_15_rain = minutely_15.Variables(2).ValuesAsNumpy()
minutely_15_snowfall = minutely_15.Variables(3).ValuesAsNumpy()
minutely_15_wind_speed_10m = minutely_15.Variables(4).ValuesAsNumpy()
minutely_15_visibility = minutely_15.Variables(5).ValuesAsNumpy()

minutely_15_data = {"date": pd.date_range(
	start = pd.to_datetime(minutely_15.Time(), unit = "s", utc = True),
	end =  pd.to_datetime(minutely_15.TimeEnd(), unit = "s", utc = True),
	freq = pd.Timedelta(seconds = minutely_15.Interval()),
	inclusive = "left"
)}

minutely_15_data["temperature_2m"] = minutely_15_temperature_2m
minutely_15_data["relative_humidity_2m"] = minutely_15_relative_humidity_2m
minutely_15_data["rain"] = minutely_15_rain
minutely_15_data["snowfall"] = minutely_15_snowfall
minutely_15_data["wind_speed_10m"] = minutely_15_wind_speed_10m
minutely_15_data["visibility"] = minutely_15_visibility

minutely_15_dataframe = pd.DataFrame(data = minutely_15_data)
print("\nMinutely15 data\n", minutely_15_dataframe.iloc[40])
print(type(minutely_15_dataframe))