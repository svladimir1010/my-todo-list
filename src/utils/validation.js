// src/utils/validation.js

/**
 * Валидирует текст задачи на соответствие правилам.
 * @param {string} text - Текст задачи для валидации.
 * @returns {string | null} Сообщение об ошибке, если валидация не пройдена, иначе null.
 */
export const validateTodoText = (text) => {
  const trimmed = text.trim() // Удаляем пробелы в начале и конце строки
  const cleanText = text.replace(/\s/g, ''); // Проверяем, что не только пробелы

  if (trimmed.length < 3) {
    return 'Текст должен содержать хотя бы 3 символа';
  }

  if (!cleanText.length) {
    return 'Поле не должно содержать только пробелы или табы';
  }

  if (trimmed.length > 100) {
    return 'Слишком длинная задача. Пожалуйста, сократите до 100 символов.';
  }

  return null; // Валидация пройдена
};
