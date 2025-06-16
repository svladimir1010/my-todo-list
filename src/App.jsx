import { Container, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import AddTodo from './components/AddTodo.jsx'
import TodoList from './components/TodoList.jsx'
import axios from 'axios'


const API_URL = 'http://127.0.0.1:8000/todos' // адрес FastAPI
// const API_URL = import.meta.env.VITE_API_URL // адрес FastAPI
const App = () => {

  const [todos, setTodos] = useState([])

  // Загружаем список todos при запуске
  useEffect(() => {
    axios.get(API_URL)
         .then(res => setTodos(res.data))
         .catch(err => console.error('Ошибка при загрузке todos:', err))
  }, [])

  // Добавляем новый todo
  const addTodo = (text) => {
    console.log({ text } )
    axios.post(API_URL, { text }) // Отправляем новый todo на сервер
         .then(res => setTodos(prev => [...prev, res.data])) // Добавляем новый todo в состояние
         .catch(err => console.error('Ошибка при добавлении todo:', err))
  }

  // Удаляем todo по id
  const deleteTodo = (id) => {
    axios.delete(`${API_URL}/${id}`)
         .then(() => setTodos(prev => prev.filter(todo => todo.id !== id)))
         .catch(err => console.error('Ошибка при удалении todo:', err))
  }

  // Переключаем состояние completed для todo по id
  const toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    axios.patch(`${API_URL}/${id}`, { completed: !todo.completed })
         .then(res => {
           setTodos(prev => prev.map(t => t.id === id ? res.data : t))
         })
         .catch(err => console.error('Ошибка при обновлении todo:', err))
  }


  return (
      <Container maxWidth={ 'sm' } sx={ { mt: 4 } }>
        <Typography
            variant="h4" // Заголовок приложения
            component="h1" // Используем h1 для SEO
            gutterBottom // Отступ снизу
            align="center"
        >
          My To-Do List
        </Typography>
        <AddTodo onAddTodo={ addTodo } todos={todos}/>
        <TodoList
            todos={ todos }
            onDeleteTodo={ deleteTodo }
            onToggleTodo={ toggleTodo }
        />
      </Container>
  )
}

export default App
