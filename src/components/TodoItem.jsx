import { Checkbox, IconButton, ListItem, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import React from 'react'


const TodoItem = ({ todo, onDeleteTodo, onToggleTodo }) => {
  return (
      <ListItem
          sx={ {
            // backgroundColor: 'background.paper', // Используем цвет из темы MUI
            // Или конкретный легкий цвет, например:
            backgroundColor: '#f9f9f9',
            boxShadow: 1, // Material-UI имеет свои значения теней (0-24).
            borderRadius: 1,
            mb: 1,
            // Стили при наведении
            '&:hover': {
              backgroundColor: 'action.hover', // Или конкретный, например: '#f0f0f0'
              boxShadow: 3, // Увеличиваем тень при ховере для эффекта "поднятия"
              cursor: 'pointer', // Меняем курсор на указатель
            },
            px: { xs: 1, sm: 2 },
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto', // Чекбокс (авто), текст (1fr), кнопка (авто)
            alignItems: 'center',
            gap: 1, // Отступ между элементами в Grid// Отступы по оси X: 1 на мобильных, 2 на десктопах
          } }
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
            sx={ {
              textDecoration: todo.completed
                  ? 'line-through' : 'none',
              // Адаптивное управление длинным текстом
              flexGrow: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mr: 1,
            } }
        >
          { todo.text }
        </Typography>
      </ListItem>
  )
}

export default TodoItem
