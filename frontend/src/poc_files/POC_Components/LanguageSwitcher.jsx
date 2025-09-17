import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Box } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "fr" : "en";
    console.log("Switching language from", i18n.language, "to", newLang);
    i18n
      .changeLanguage(newLang)
      .then(() => {
        console.log("Language changed successfully to", i18n.language);
        console.log("Current translations:", i18n.store.data[newLang]);
        document.documentElement.lang = newLang;
      })
      .catch((error) => {
        console.error("Error changing language:", error);
      });
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Button
        onClick={toggleLanguage}
        startIcon={<LanguageIcon />}
        sx={{
          color: "#333333",
          textTransform: "none",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        {i18n.language === "en" ? "Français" : "English"}
      </Button>
    </Box>
  );
};

export default LanguageSwitcher;
