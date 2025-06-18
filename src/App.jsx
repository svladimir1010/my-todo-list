import { Box, Container, IconButton, Typography } from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import AddTodo from './components/AddTodo.jsx'
import TodoList from './components/TodoList.jsx'
import axios from 'axios'
import { ThemeProvider, CssBaseline } from '@mui/material' // Импортируем ThemeProvider и CssBaseline
import { lightTheme, darkTheme } from './theme' // Импортируем созданные темы
import Brightness4Icon from '@mui/icons-material/Brightness4' // Иконка для темной темы (луна)
import Brightness7Icon from '@mui/icons-material/Brightness7' // Иконка для светлой темы (солнце)


const API_URL = import.meta.env.VITE_API_URL // адрес FastAPI


const App = () => {
  const [ todos, setTodos ] = useState([])

  // Состояние для текущей темы: 'light' или 'dark'
  const [ mode, setMode ] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  // Создаем объект темы на основе текущего режима. useMemo предотвращает пересоздание объекта темы при каждом рендере.
  const theme = useMemo(() => ( mode === 'light' ? lightTheme : darkTheme ), [ mode ])

  // useEffect для сохранения режима темы в localStorage при каждом изменении `mode`
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]); // Зависимость от mode: эффект будет выполняться при изменении mode

  // Загружаем список todos при запуске
  useEffect(() => {
    axios.get(API_URL)
         .then(res => setTodos(res.data))
         .catch(err => console.error('Ошибка при загрузке todos:', err))
  }, [])

  // Добавляем новый todo
  const addTodo = (text) => {
    console.log({ text })
    axios.post(API_URL, { text }) // Отправляем новый todo на сервер
         .then(res => setTodos(prev => [ ...prev, res.data ])) // Добавляем новый todo в состояние
         .catch(err => console.error('Ошибка при добавлении todo:', err))
  }

  // Удаляем todo по id
  const deleteTodo = (id) => {
    axios.delete(`${ API_URL }/${ id }`)
         .then(() => setTodos(prev => prev.filter(todo => todo.id !== id)))
         .catch(err => console.error('Ошибка при удалении todo:', err))
  }

  // Переключаем состояние completed для todo по id
  const toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id)
    if(!todo) return

    axios.patch(`${ API_URL }/${ id }`, { completed: !todo.completed })
         .then(res => {
           setTodos(prev => prev.map(t => t.id === id ? res.data : t))
         })
         .catch(err => console.error('Ошибка при обновлении todo:', err))
  }

  const editTodo = (id, newText) => {
    // PUT запрос обновления текста todo
    axios.put(`${ API_URL }/${ id }`, { text: newText })
         .then(res => {
           setTodos(prev => prev.map(t => t.id === id ? res.data : t))
         })
         .catch(err => console.error('Ошибка при редактировании todo:', err))
  }

  // Функция переключения темы
  const toggleThemeMode = () => {
    setMode((prevMode) => ( prevMode === 'light' ? 'dark' : 'light' ))
  }


  return (
      // Оборачиваем все приложение в ThemeProvider
      <ThemeProvider theme={ theme }>
        {/* CssBaseline сбрасывает базовые стили и применяет стили темы к body */ }
        <CssBaseline/>

        <Container maxWidth={ 'sm' } sx={ { mt: 4 } }>
          <Box sx={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 } }>
            <Typography
                variant="h4" // Заголовок приложения
                component="h1" // Используем h1 для SEO
                gutterBottom // Отступ снизу
                align="center"
            >
              My To-Do List
            </Typography>


            {/* Кнопка переключения темы */ }
            <IconButton sx={ { ml: 'auto' } } onClick={ toggleThemeMode } color="inherit">
              { mode === 'dark' ? <Brightness7Icon/> : <Brightness4Icon/> }
            </IconButton>
          </Box>

          <AddTodo onAddTodo={ addTodo } todos={ todos }/>
          <TodoList
              todos={ todos }
              onDeleteTodo={ deleteTodo }
              onToggleTodo={ toggleTodo }
              onEditTodo={ editTodo }
          />
        </Container>

      </ThemeProvider>
  )
}

export default App
