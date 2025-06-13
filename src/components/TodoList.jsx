import { List } from '@mui/material'
import React from 'react'
import TodoItem from './TodoItem'

const TodoList = ({ todos, onDeleteTodo, onToggleTodo }) => {
  return (
      <List>
        { todos.map(todo => (
            <TodoItem
                key={ todo.id }
                todo={ todo }
                onDeleteTodo={ onDeleteTodo }
                onToggleTodo={ onToggleTodo }
            />
        )) }
      </List>
  )
}

export default TodoList
