import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Общие настройки для обеих тем (можно добавить шрифты, типографику и т.д.)
const baseThemeOptions = {
  typography: {
    fontFamily: 'Inter, sans-serif', // Используем Inter, как рекомендовано
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Пример скругленных углов для кнопок
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Пример скругленных углов для текстовых полей
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Пример скругленных углов для элементов списка
        },
      },
    },
  },
};

// Светлая тема
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Основной синий
    },
    secondary: {
      main: '#dc004e', // Вторичный красный
    },
    background: {
      default: '#f4f6f8', // Светлый фон страницы
      paper: '#ffffff',   // Фон для карточек, списков и т.д.
    },
    text: {
      primary: '#212121', // Темный текст
      secondary: '#757575',
    },
  },
  ...baseThemeOptions, // Применяем общие опции
});

// Темная тема
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // Светло-голубой для темной темы
    },
    secondary: {
      main: '#f48fb1', // Светло-розовый для темной темы
    },
    background: {
      default: '#121212', // Темный фон страницы
      paper: '#1e1e1e',   // Фон для карточек, списков и т.д.
    },
    text: {
      primary: '#ffffff', // Светлый текст
      secondary: '#bdbdbd',
    },
  },
  ...baseThemeOptions, // Применяем общие опции
});
