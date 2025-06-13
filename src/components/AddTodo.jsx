import { Box, TextField, Button } from '@mui/material'
import React, { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'


const AddTodo = ({ onAddTodo }) => {
  const [ todoText, setTodoText ] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault() // Предотвращаем перезагрузку страницы

    if(todoText.trim()) { // Проверяем, что текст не пустой
      onAddTodo(todoText) // Вызываем функцию родителя
      setTodoText('') // Очищаем поле ввода
    }
  }

  return ( <Box // Контейнер для формы
          component={ 'form' }
          onSubmit={ handleSubmit } // Обработчик отправки формы
          sx={ {
            display: 'flex', // Flexbox для выравнивания элементов
            gap: 2, // Отступы между элементами
            mb: 2, // Отступ снизу
          } }
      >
        <TextField
            label="New Todo"
            variant="outlined"
            fullWidth // Занимает всю доступную ширину
            value={ todoText }
            onChange={ (e) => setTodoText(e.target.value) }/>
        <Button
            variant="contained"
            endIcon={ <AddIcon/> } // Иконка в конце кнопки
            type="submit" // Тип кнопки - отправка формы
        >
          Add
        </Button>
      </Box> )
}

export default AddTodo
