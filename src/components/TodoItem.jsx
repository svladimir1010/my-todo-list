import { Checkbox, IconButton, ListItem, TextField, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close' // Импорт иконки отмены
import React from 'react'


const TodoItem = ({ todo, onDeleteTodo, onToggleTodo, onEditTodo }) => {
  const [ isEditing, setIsEditing ] = React.useState(false) // Состояние для редактирования
  const [ editedText, setEditedText ] = React.useState(todo.text) //  Состояние для редактируемого текста

  // Обработчик редактирования вызываемый при сохранении изменений
  const handleSaveEdit = () => {
    // Валидируем текст перед сохранением
    const trimmedText = editedText.trim() // Удаляем пробелы в начале и конце строки
    if(trimmedText === todo.text) { // Если не изменился выход из режима редактирования
      setIsEditing(false)
      return
    }
    if(trimmedText.length < 3) {
      alert('Текст должен содержать хотя бы 3 символа') // Используем alert, как в оригинальном коде
      return
    }
    if(trimmedText.length > 100) {
      alert('Слишком длинная задача. Пожалуйста, сократите до 100 символов.') // Используем alert, как в оригинальном коде
      return
    }

    onEditTodo(todo.id, trimmedText) //
    setIsEditing(false)
  }

  // Обработчик отмены редактирования
  const handleCancelEdit = () => {
    setEditedText(todo.text); // Сбросить текст до исходного
    setIsEditing(false); // Выйти из режима редактирования
  };

  return (
      <ListItem
          sx={ {
            // Использовать цвет из палитры темы вместо жестко заданного
            backgroundColor: 'background.paper', // меняться между #ffffff (light) и #1e1e1e (dark)
            boxShadow: 1,
            borderRadius: 2, // Используем более скругленные углы
            mb: 2,
            '&:hover': {
              backgroundColor: 'action.hover', // Это адаптируется темой
              boxShadow: 3,
              cursor: 'pointer',
            },
            px: { xs: 1, sm: 2 },
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto auto auto',
            alignItems: 'center',
            gap: 1,
          } }
      >
        <Checkbox // Чекбокс для переключения состояния todo
            onChange={ () => onToggleTodo(todo.id) }
            checked={ todo.completed }
        />
        {isEditing ? (
            <TextField
                variant="outlined"
                value={ editedText }
                onChange={ (e) => setEditedText(e.target.value) }
                onKeyPress={ (e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit()
                  }
                } }
                fullWidth
                size="small"
                sx={{ mr: 1 }}
            />
        ) : (
            <Typography
                variant="body1" // Используем стандартный стиль текста Material-UI
                sx={ {
                  textDecoration: todo.completed
                      ? 'line-through' : 'none',
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
        )}

        {isEditing ? (
            <>
              <IconButton
                  edge="end"
                  aria-label="save"
                  onClick={handleSaveEdit}
              >
                <SaveIcon />
              </IconButton>
              <IconButton
                  edge="end"
                  aria-label="cancel"
                  onClick={handleCancelEdit}
              >
                <CloseIcon />
              </IconButton>
            </>
        ) : (
            <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => setIsEditing(true)}
            >
              <EditIcon />
            </IconButton>
        )}

        <IconButton
            edge="end" // Кнопка удаления выравнивается по правому краю
            aria-label="delete"
            onClick={ () => onDeleteTodo(todo.id) }
        >
          <DeleteIcon/>
        </IconButton>
      </ListItem>
  )
}

export default TodoItem
