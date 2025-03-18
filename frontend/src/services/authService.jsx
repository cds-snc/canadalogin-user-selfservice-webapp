import axios from 'axios';
import config from '../config';
import {SUBMIT_END_POINTS} from "../utils/constants.jsx";

export const authService = {
    signup: async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.signup}`, userData);
        return response.data;
    },
    emailVerification: async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.emailVerification}`, userData);
        return response.data;
    },
    requestNewCode: async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.requestNewCode}`, userData);
        return response.data;
    }
}
