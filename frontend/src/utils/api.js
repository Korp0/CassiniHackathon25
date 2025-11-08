import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const fetchQuests = async (lat, lon) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/generate_quest`, {
      params: { lat, lon }
    });
    return response.data;
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
