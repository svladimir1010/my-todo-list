import { List } from '@mui/material'
import React from 'react'
import TodoItem from './TodoItem'
import { motion, AnimatePresence } from 'framer-motion'

const TodoList = ({ todos, onDeleteTodo, onToggleTodo, onEditTodo  }) => {
  return (
      <List>
        <AnimatePresence>
          { todos.map(todo => (
              <motion.div
                  key={ todo.id } // ОЧЕНЬ ВАЖНО: key должен быть на motion-компоненте
                  initial={ { opacity: 0, x: -100 } } // Начальное состояние (при добавлении)
                  animate={ { opacity: 1, x: 0 } }    // Конечное состояние (после добавления)
                  exit={ { opacity: 0, x: 100 } }     // Состояние при удалении
                  transition={ { duration: 0.3 } }    // Длительность анимации
              >
                <TodoItem
                    todo={ todo }
                    onEditTodo={ onEditTodo } // Функция для редактирования todo
                    onDeleteTodo={ onDeleteTodo }
                    onToggleTodo={ onToggleTodo } // Функция для переключения состояния todo
                />
              </motion.div>
          )) }
        </AnimatePresence>
      </List>
  )
}

export default TodoList
