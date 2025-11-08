import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const fetchQuests = async (lat, lon) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/generate_quest`, {
      params: { lat, lon }
    });

    // Normalize backend response to shape the frontend expects.
    // Backend currently returns { message, available_quests } while
    // the frontend expects { all_quests, active_quest, ai_message }
    const data = response.data || {};
    const all_quests = data.all_quests || data.available_quests || [];
    const active_quest = data.active_quest || null;
    const ai_message = data.ai_message || data.message || '';

    return { ...data, all_quests, active_quest, ai_message };
  } catch (error) {
    console.error('Error fetching quests:', error);
    throw error;
  }
};

export const getAIGuide = async (quest) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ai_guide`, quest);
    return response.data;
  } catch (error) {
    console.error('Error getting AI guide:', error);
    throw error;
  }
};

export const getPlayer = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/player`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player:', error);
    throw error;
  }
};

export const fetchZoneByCode = async (code) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scan_qr`, {
      params: { code }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching zone by code:', error);
    throw error;
  }
};

// Mockable startQuest API - prepares for backend activation endpoint
// Expected response shape: { ok: boolean, message?: string, data?: { weather_ok: boolean } }
export const startQuest = async (quest) => {
  // Currently mocked locally. Replace with real API call when backend provides /start_quest
  // Example real call:
  // return axios.post(`${API_BASE_URL}/start_quest`, { questId: quest.id }).then(r => r.data);

  // Simple mock logic: if quest.weather exists and temperature < 0 or condition_text contains 'rain' => not ok
  return new Promise((resolve) => {
    setTimeout(() => {
      const weather = quest.weather || null;
      let ok = true;
      let message = 'Počasie OK. Začínam quest.';
      if (weather) {
        const temp = Number(weather.temperature || 0);
        const cond = String((weather.condition_text || '')).toLowerCase();
        if (temp <= 0) {
          ok = false;
          message = 'Na tejto lokalite je momentálne príliš chladno.';
        }
        if (cond.includes('rain') || cond.includes('sneh') || cond.includes('snow') || cond.includes('storm')) {
          ok = false;
          message = 'Na tejto lokalite je nepriaznivé počasie (dážď/ sneh). Zváž svoje rozhodnutie.';
        }
      }

      resolve({ ok, message, data: { weather_ok: ok } });
    }, 800); // simulate network delay
  });
};

export const setActiveQuest = async (questId) => {
  try {
    // FastAPI expects quest_id as query param (Query(...)) on POST
    const response = await axios.post(`${API_BASE_URL}/set_active_quest`, null, {
      params: { quest_id: questId }
    });
    return response.data;
  } catch (error) {
    console.error('Error setting active quest:', error);
    throw error;
  }
};

export const completeActiveQuest = async (currentLat, currentLon) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/complete_active_quest`, null, {
      params: { current_lat: currentLat, current_lon: currentLon }
    });
    return response.data;
  } catch (error) {
    console.error('Error completing active quest:', error);
    throw error;
  }
};

export const completeQuestByQr = async (qrKey, userLat, userLon) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/complete_quest_by_qr`, {
      params: { qr_key: qrKey, user_lat: userLat, user_lon: userLon }
    });
    return response.data;
  } catch (error) {
    console.error('Error completing quest by QR:', error);
    throw error;
  }
};

export const checkWeatherForQuest = async (questId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/check_weather_for_quest`, {
      params: { quest_id: questId }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking weather for quest:', error);
    throw error;
  }
};

export const getShop = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/shop`);
    return response.data;
  } catch (error) {
    console.error('Error fetching shop:', error);
    throw error;
  }
};

export const buyShopItem = async (itemName) => {
  try {
    // Backend expects item_name as query param on POST /buy_item
    const response = await axios.post(`${API_BASE_URL}/buy_item`, null, {
      params: { item_name: itemName }
    });
    return response.data;
  } catch (error) {
    console.error('Error buying shop item:', error);
    // If server returned non-2xx, axios throws — try to return server message if present
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
};

export const buyGeobucks = async (amount) => {
  try {
    // Dummy backend endpoint to purchase GeoBucks. Expects amount as query param.
    const response = await axios.post(`${API_BASE_URL}/buy_geobucks`, null, {
      params: { amount }
    });
    return response.data;
  } catch (error) {
    console.error('Error buying geobucks:', error);
    if (error.response && error.response.data) return error.response.data;
    throw error;
  }
};

export const getAchievements = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/achievements`);
    return response.data;
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
};
