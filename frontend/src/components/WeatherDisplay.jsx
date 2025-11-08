import { WiDaySunny, WiCloud, WiRain, WiSnow, WiFog, WiThunderstorm, WiDayCloudy } from 'react-icons/wi';

const WeatherDisplay = ({ weather, position }) => {
  if (!weather) return null;

  const getWeatherIcon = (condition) => {
    const conditionLower = (condition || '').toLowerCase();
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return <WiDaySunny />;
    if (conditionLower.includes('cloud')) return <WiCloud />;
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return <WiRain />;
    if (conditionLower.includes('snow')) return <WiSnow />;
    if (conditionLower.includes('fog')) return <WiFog />;
    if (conditionLower.includes('thunder')) return <WiThunderstorm />;
    return <WiDayCloudy />;
  };

  return (
    <div className="fixed top-5 right-5 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg z-[99999] transition-transform hover:scale-105">
      <div className="text-3xl leading-none">
        {getWeatherIcon(weather.condition_text || 'clear')}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="text-lg font-bold text-gray-900 leading-none">
          {Math.round(weather.temperature || 0)}°C
        </div>
        <div className="text-xs text-gray-600 capitalize leading-none">
          {weather.condition_text || 'Loading...'}
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;
