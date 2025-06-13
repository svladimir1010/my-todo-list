import { Container, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import AddTodo from './components/AddTodo.jsx'
import TodoList from './components/TodoList.jsx'

const App = () => {
  const [ todos, setTodos ] = useState(() => {
    const savedTodos = localStorage.getItem('todos')
    return savedTodos ? JSON.parse(savedTodos) : [];
  } )

  useEffect(() => {         // Сохраняем todos в localStorage
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos] )

  const addTodo = (text) => {
    const newTodo = {
      id: Date.now(), // Уникальный идентификатор
      text: text,
      completed: false
    }
    setTodos([ ...todos, newTodo ]) // Добавляем новый todo в список
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id)) // Удаляем todo по id
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )) // Переключаем состояние completed для todo по id
  }

  return (
      <Container maxWidth={ 'sm' } sx={ { mt: 4 } }>
        <Typography
            variant="h4"
            component="h1"
            gutterBottom // Отступ снизу
            align="center"
        >
          My To-Do List
        </Typography>
        <AddTodo onAddTodo={ addTodo }/>
        <TodoList
            todos={ todos }
            onDeleteTodo={ deleteTodo }
            onToggleTodo={ toggleTodo }
        />
      </Container>
  )
}

export default App
