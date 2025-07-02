import { Box, TextField, Button } from '@mui/material'
import React, { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import { toast } from 'react-toastify'; // Импортируем toast
import { validateTodoText } from '../utils/validation'


const AddTodo = ({ onAddTodo, todos }) => {
  const [ todoText, setTodoText ] = useState('')


  const handleSubmit = (e) => {
    e.preventDefault()

    const trimmed = todoText.trim()  // Удаляем пробелы в начале и конце строки
    const validationError = validateTodoText(todoText)

    if (validationError) {
      toast.warn(validationError); // Показываем сообщение об ошибке
      setTodoText('') // Очищаем поле ввода при ошибке валидации
      return;
    }

    if(todos.some(todo => todo.text === trimmed)) { // Проверяем, есть ли уже такая задача
      toast.warn('Такая задача уже есть')
      setTodoText(''); // Очищаем поле при дублировании задачи
      return
    }
    console.log('trimmed: ', trimmed)
    onAddTodo(trimmed)  // Используем очищенный вариант
    setTodoText('')
  }

  return ( <Box // Контейнер для формы
      component={ 'form' }
      onSubmit={ handleSubmit } // Обработчик отправки формы
      sx={ {
        display: 'flex', // Flexbox для выравнивания элементов
        flexDirection: { xs: 'column', sm: 'row' }, // На xs (мобильных) - колонкой, на sm и выше - строкой
        gap: { xs: 1, sm: 2 },    // Отступы между элементами
        mb: 2,     // Отступ снизу
        alignItems: 'center', // Центрируем элементы по поперечной оси (для sm: 'row')
      } }
  >
    <TextField
        label="New Todo"
        variant="outlined"
        fullWidth      // Занимает всю доступную ширину
        value={ todoText }
        onChange={ (e) => setTodoText(e.target.value) }/>
    <Button
        variant="contained"
        endIcon={ <AddIcon/> } // Иконка в конце кнопки
        type="submit"     // Тип кнопки - отправка формы
    >
      Add
    </Button>
  </Box> )
}

export default AddTodo
