import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#26374A", // GC dark blue
      light: "#335075", // GC medium blue
      dark: "#1C578A", // GC darker blue
    },
    secondary: {
      main: "#AF3C43", // GC red
      light: "#D3080C", // GC bright red
      dark: "#7C0A1D", // GC dark red
    },
    background: {
      default: "#F8F8F8", // GC light grey
      paper: "#FFFFFF",
    },
    text: {
      primary: "#333333", // GC dark grey
      secondary: "#666666", // GC medium grey
    },
  },
  typography: {
    fontFamily: "Noto Sans, Helvetica, Arial, sans-serif",
    h1: {
      fontSize: "2.25rem",
      fontWeight: 600,
      color: "#333333",
    },
    h2: {
      fontSize: "1.8rem",
      fontWeight: 600,
      color: "#333333",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      color: "#333333",
    },
    body1: {
      fontSize: "1rem",
      color: "#333333",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: "8px 16px",
        },
        contained: {
          backgroundColor: "#26374A",
          "&:hover": {
            backgroundColor: "#1C578A",
          },
        },
        outlined: {
          borderColor: "#26374A",
          color: "#26374A",
          "&:hover": {
            borderColor: "#1C578A",
            color: "#1C578A",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 0,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
});

export default theme;
