import { Box, Container, IconButton, Typography, Tabs, Tab, Button } from '@mui/material'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import AddTodo from './components/AddTodo.jsx'
import TodoList from './components/TodoList.jsx'
import axios from 'axios'
import { ThemeProvider, CssBaseline } from '@mui/material' // Импортируем ThemeProvider и CssBaseline
import { lightTheme, darkTheme } from './theme' // Импортируем созданные темы
import Brightness4Icon from '@mui/icons-material/Brightness4' // Иконка для темной темы (луна)
import Brightness7Icon from '@mui/icons-material/Brightness7' // Иконка для светлой темы (солнце)
import DiamondIcon from '@mui/icons-material/Diamond' // Иконка для Premium

import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css' // стили Toastify


const API_URL = import.meta.env.VITE_API_URL // адрес FastAPI

// URL для запросов к бэкенду Stripe
const STRIPE_API_URL = `${API_URL.replace('/todos', '')}/create-checkout-session`; // Получаем базовый URL и добавляем эндпоинт Stripe


const App = () => {
  const [ todos, setTodos ] = useState([])

  // Состояние для текущей темы: 'light' или 'dark'
  const [ mode, setMode ] = useState(() => {
    const savedMode = localStorage.getItem('themeMode')
    return savedMode || 'light'
  })
  // Состояние для текущего фильтра: 'all', 'active', 'completed'
  const [ filter, setFilter ] = useState('all')

  // Создаем объект темы на основе текущего режима. useMemo предотвращает пересоздание объекта темы при каждом рендере.
  const theme = useMemo(() => ( mode === 'light' ? lightTheme : darkTheme ), [ mode ])

  // useEffect для сохранения режима темы в localStorage при каждом изменении `mode`
  useEffect(() => {
    localStorage.setItem('themeMode', mode)
  }, [ mode ]) // Зависимость от mode: эффект будет выполняться при изменении mode


  // Функция для загрузки задач с учетом фильтра
  const fetchTodos = useCallback((currentFilter) => {
    let apiUrl = API_URL
    if(currentFilter === 'active') {
      apiUrl = `${ API_URL }?completed=false`
    } else if(currentFilter === 'completed') {
      apiUrl = `${ API_URL }?completed=true`
    }
    axios.get(apiUrl)
         .then(res => setTodos(res.data))
         .catch(err => {
           console.error('Ошибка при загрузке todos:', err)
           toast.error('Не удалось загрузить задачи. Попробуйте позже.')
         })
  }, [ API_URL ]) // Зависимость от API_URL

  // Загружаем список todos при запуске и при изменении фильтра
  useEffect(() => {
    fetchTodos(filter)
  }, [ filter, fetchTodos ]) // Зависимость от filter и fetchTodos

  // Обработчик изменения вкладки фильтра
  const handleFilterChange = (event, newValue) => {
    setFilter(newValue)
  }

  // Добавляем новый todo
  const addTodo = (text) => {
    axios.post(API_URL, { text }) // Отправляем новый todo на сервер
        // Добавляем новый todo в состояние
         .then(res => {
           fetchTodos(filter) // Перезагружаем задачи с учетом текущего фильтра
           toast.success('Задача успешно добавлена!') // Уведомление об успехе
         })
         .catch(err => {
           console.error('Ошибка при добавлении todo:', err)
           // Проверяем, есть ли сообщение об ошибке от бэкенда (например, 400 Bad Request)
           const errorMessage = err.response && err.response.data && err.response.data.detail
               ? err.response.data.detail
               : 'Не удалось добавить задачу. Попробуйте снова.'
           toast.error(errorMessage) // Уведомление об ошибке
         })
  }

  // Удаляем todo по id
  const deleteTodo = (id) => {
    axios.delete(`${ API_URL }/${ id }`)
         .then(() => {
           // После удаления, обновляем список с учетом текущего фильтра
           fetchTodos(filter)
           toast.success('Задача успешно удалена!') // Уведомление об успехе
         })
         .catch(err => {
           console.error('Ошибка при удалении todo:', err)
           const errorMessage = err.response && err.response.data && err.response.data.detail
               ? err.response.data.detail
               : 'Не удалось удалить задачу.'
           toast.error(errorMessage) // Уведомление об ошибке
         })
  }

  // Переключаем состояние completed для todo по id
  const toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id)
    if(!todo) return

    axios.patch(`${ API_URL }/${ id }`, { completed: !todo.completed })
         .then(res => {
           // После изменения статуса, обновляем список с учетом текущего фильтра
           fetchTodos(filter)
           toast.info('Статус задачи обновлен!') // Информационное уведомление
         })
         .catch(err => {
           console.error('Ошибка при обновлении todo:', err)
           const errorMessage = err.response && err.response.data && err.response.data.detail
               ? err.response.data.detail
               : 'Не удалось обновить статус задачи.'
           toast.error(errorMessage) // Уведомление об ошибке
         })
  }

  const editTodo = (id, newText) => {
    // PUT запрос обновления текста todo
    axios.put(`${ API_URL }/${ id }`, { text: newText })
         .then(res => {
           // После редактирования, обновляем список с учетом текущего фильтра
           fetchTodos(filter)
           toast.success('Задача успешно отредактирована!') // Уведомление об успехе
         })
         .catch(err => {
           console.error('Ошибка при редактировании todo:', err)
           const errorMessage = err.response && err.response.data && err.response.data.detail
               ? err.response.data.detail
               : 'Не удалось отредактировать задачу.'
           toast.error(errorMessage) // Уведомление об ошибке
         })
  }

  // Функция переключения темы
  const toggleThemeMode = () => {
    setMode((prevMode) => ( prevMode === 'light' ? 'dark' : 'light' ))
  }


  // ФУНКЦИЯ: Обработчик для кнопки Premium
  const handlePremiumClick = async () => {
    try {
      // Отправляем запрос на наш бэкенд для создания платежной сессии
      const response = await axios.post(STRIPE_API_URL);
      const { url } = response.data; // Получаем URL ответа от бэкенда

      // Перенаправляем пользователя на страницу Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Ошибка при инициировании платежа Stripe:', err);
      const errorMessage = err.response && err.response.data && err.response.data.detail
          ? err.response.data.detail
          : 'Не удалось перейти к оплате. Пожалуйста, попробуйте позже.';
      toast.error(errorMessage);
    }
  };

  // Получаем текущий путь для отображения Premium кнопки
  const pathname = window.location.pathname;

  if (pathname === '/success') {
    return (
        <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="primary" gutterBottom>
            ✅ Оплата успешно завершена!
          </Typography>
          <Typography variant="body1">
            Спасибо за вашу поддержку! Теперь вы можете наслаждаться премиум-функциями.
          </Typography>
          <Button variant="contained" sx={{ mt: 3 }} onClick={() => window.location.href = '/'}>
            Вернуться к задачам
          </Button>
        </Container>
    );
  }

  if (pathname === '/cancel') {
    return (
        <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            ❌ Оплата отменена.
          </Typography>
          <Typography variant="body1">
            Ваша платежная сессия была отменена. Вы всегда можете попробовать снова.
          </Typography>
          <Button variant="contained" sx={{ mt: 3 }} onClick={() => window.location.href = '/'}>
            Вернуться к задачам
          </Button>
        </Container>
    );
  }

  return (
      // Оборачиваем все приложение в ThemeProvider
      <ThemeProvider theme={ theme }>
        {/* CssBaseline сбрасывает базовые стили и применяет стили темы к body */ }
        <CssBaseline/>

        <Container maxWidth={ 'sm' } sx={ { mt: 4 } }>
          <Box sx={ {
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' }, // На маленьких экранах - колонка
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            gap: { xs: 1, sm: 2 } // Отступ между элементами
          } }>
            {/* Кнопка Premium */}
            <Button
                variant="contained"
                color="secondary"
                startIcon={<DiamondIcon />}
                onClick={handlePremiumClick}
                sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }} // На моб. - полная ширина
            >
              Premium
            </Button>
            <Typography
                variant="h4" // Заголовок приложения
                component="h1" // Используем h1 для SEO
                gutterBottom // Отступ снизу
                align="center"
                sx={{ flexGrow: 1, mr: { xs: 0, sm: 2 } }} // Убираем mr на xs, оставляем на sm
            >
              My To-Do List
            </Typography>

            {/* Кнопка переключения темы */ }
            <IconButton sx={ { ml: 'auto' } } onClick={ toggleThemeMode } color="inherit">
              { mode === 'dark' ? <Brightness7Icon/> : <Brightness4Icon/> }
            </IconButton>
          </Box>

          {/* Вкладки фильтрации */ }
          <Box sx={ { borderBottom: 1, borderColor: 'divider', mb: 2 } }>
            <Tabs
                value={ filter }
                onChange={ handleFilterChange }
                aria-label="todo filters"
                variant="fullWidth" // Вкладки занимают всю доступную ширину
                indicatorColor="primary" // Цвет индикатора
                textColor="inherit" // Цвет текста вкладок
            >
              <Tab label="Все" value="all"/>
              <Tab label="Активные" value="active"/>
              <Tab label="Выполненные" value="completed"/>
            </Tabs>
          </Box>

          <AddTodo onAddTodo={ addTodo } todos={ todos }/>
          <TodoList
              todos={ todos }
              onDeleteTodo={ deleteTodo }
              onToggleTodo={ toggleTodo }
              onEditTodo={ editTodo }
          />
        </Container>
        <ToastContainer
            position="bottom-right" // Позиция уведомлений
            autoClose={ 3000 }        // Автоматическое закрытие через 3 секунды
            hideProgressBar={ false } // Показывать полосу прогресса
            newestOnTop={ false }     // Новые уведомления не сверху
            closeOnClick            // Закрытие по клику
            rtl={ false }             // Справа налево (для языков)
            pauseOnFocusLoss        // Пауза при потере фокуса окна
            draggable               // Перетаскиваемые уведомления
            pauseOnHover            // Пауза при наведении
            theme={ mode === 'dark' ? 'dark' : 'light' } // Тема Toastify соответствует теме MUI
        />

      </ThemeProvider>
  )
}

export default App
