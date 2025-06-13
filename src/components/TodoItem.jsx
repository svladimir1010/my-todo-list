import { Checkbox, IconButton, ListItem, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import React from 'react'


const TodoItem = ({ todo, onDeleteTodo, onToggleTodo }) => {
  return (
      <ListItem
          secondaryAction={ // Элемент списка с возможностью удаления
            <IconButton
                edge="end" // Кнопка удаления выравнивается по правому краю
                aria-label="delete"
                onClick={ () => onDeleteTodo(todo.id) }
            >
              <DeleteIcon/>
            </IconButton>
          }
      >
        <Checkbox // Чекбокс для переключения состояния todo
            onChange={ () => onToggleTodo(todo.id) }
            checked={ todo.completed }
        />
        <Typography
            variant="body1" // Используем стандартный стиль текста Material-UI
            sx={ { textDecoration: todo.completed ? 'line-through' : 'none' } }
        >
          { todo.text }
        </Typography>
      </ListItem>
  )
}

export default TodoItem
