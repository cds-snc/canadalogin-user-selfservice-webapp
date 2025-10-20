import axios from "axios";
import config from "../../../config.jsx";
import { MIGRATION_END_POINTS } from "../../../utils/constants.jsx";
import { handleApiError } from "../../../utils/apiErrorHandler.js";

axios.defaults.withCredentials = true;

export const updateLinkStateAPI = {
  // not sure we need user_id, just the legacy PAI. Or send the token back to API to ensure no tampering (validate token then pull sub from it)
  getLegacyIDPAuthUrl: async (clientId) => {
    try {
      var legacyIDPAuthUrl = "";

      console.log("====== start getLegacyIDPAuthUrl ======");
      console.log("====== " + clientId + " ======");
      console.log("====== " + config.apiUrl + " ======");
      console.log(
        "====== " + MIGRATION_END_POINTS.requestLegacyIDPAuthUrl + " ======",
      );
      console.log("====== legacyIDPAuthUrl: " + legacyIDPAuthUrl + " ======");
      console.log("====== end getLegacyIDPAuthUrl ======");

      //const response = await axios.get(
      //  `${config.apiUrl}${SUBMIT_END_POINTS.users}/${user_id}/otp_factors`,
      //);

      return legacyIDPAuthUrl;
      //return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  getRPAuthUrl: async (clientId) => {
    try {
      var rpAuthUrl = "";

      console.log("====== start getRPAuthUrl ======");
      console.log("====== " + clientId + " ======");
      console.log("====== " + config.apiUrl + " ======");
      console.log(
        "====== " + MIGRATION_END_POINTS.requestRPAuthUrl + " ======",
      );
      console.log("====== legacyIDPAuthUrl: " + rpAuthUrl + " ======");
      console.log("====== end getRPAuthUrl ======");

      //const response = await axios.get(
      //  `${config.apiUrl}${SUBMIT_END_POINTS.users}/${user_id}/otp_factors`,
      //);

      return rpAuthUrl;
      //return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
