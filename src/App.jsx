import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Box,
  Container,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Button,
  ThemeProvider,
  CssBaseline,
  LinearProgress
} from '@mui/material'
import AddTodo from './components/AddTodo.jsx'
import TodoList from './components/TodoList.jsx'
import axios from 'axios'

// Иконки для UI
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import DiamondIcon from '@mui/icons-material/Diamond'
import WalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'

// Уведомления Toastify
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Импорт тем
import { lightTheme, darkTheme } from './theme/index'
// Импорт функции валидации для AddTodo
import { validateTodoText } from './utils/validation'


const API_BASE_URL = import.meta.env.VITE_API_URL // VITE_API_URL=http://127.0.0.1:8000
const API_URL = `${ API_BASE_URL }/todos`
const STRIPE_API_URL = `${ API_BASE_URL }/create-checkout-session`
const CLAIM_NFT_API_URL = `${ API_BASE_URL }/claim-nft`
const NFT_STATUS_API_URL = `${ API_BASE_URL }/nft-status`

const App = () => {
  const [ todos, setTodos ] = useState([])
  const [ mode, setMode ] = useState(() => localStorage.getItem('themeMode') || 'light')
  const [ filter, setFilter ] = useState('all')
  const [ walletAddress, setWalletAddress ] = useState(null)

  const [ nftStatus, setNftStatus ] = useState({
    completed_tasks_on_chain: 0,
    claimed_tasks_milestone_on_chain: 0,
    tasks_per_nft: 10,
    claimable_nfts: 0,
    is_claim_available: false,
  })

  const [ isClaimingNft, setIsClaimingNft ] = useState(false)
  const [ pollingIntervalId, setPollingIntervalId ] = useState(null) // Для хранения ID интервала опроса

  const theme = useMemo(() => ( mode === 'light' ? lightTheme : darkTheme ), [ mode ])

  useEffect(() => {
    localStorage.setItem('themeMode', mode)
  }, [ mode ])

  // =========================================================
  // Функция: Получение статуса NFT из бэкенда
  // =========================================================
  const fetchNftStatus = useCallback(async(address) => {
    if(!address) {
      setNftStatus({
        completed_tasks_on_chain: 0,
        claimed_tasks_milestone_on_chain: 0,
        tasks_per_nft: 10,
        claimable_nfts: 0,
        is_claim_available: false,
      })
      return
    }
    try {
      const response = await axios.get(`${ NFT_STATUS_API_URL }/${ address }`)
      setNftStatus(response.data)
      console.log('NFT Status:', response.data)
    } catch( error ) {
      console.error('Ошибка при получении статуса NFT:', error)
      toast.error('Не удалось получить статус NFT. Проверьте подключение.')
      setNftStatus({ // Сброс в случае ошибки
        completed_tasks_on_chain: 0,
        claimed_tasks_milestone_on_chain: 0,
        tasks_per_nft: 10,
        claimable_nfts: 0,
        is_claim_available: false,
      })
    }
  }, [])

  const fetchTodos = useCallback((currentFilter) => {
    let apiUrl = API_URL
    if(currentFilter === 'active') apiUrl += '?completed=false'
    else if(currentFilter === 'completed') apiUrl += '?completed=true'

    axios.get(apiUrl)
         .then(res => {
           setTodos(res.data)
         })
         .catch(err => {
           console.error('Ошибка загрузки задач:', err)
           toast.error('Не удалось загрузить задачи')
         })
  }, [])

  useEffect(() => {
    fetchTodos(filter)
  }, [ filter, fetchTodos ])

  // =========================================================
  // Эффект для polling'а статуса NFT и начальной загрузки
  // =========================================================
  useEffect(() => {
    // Очищаем предыдущий интервал, если он есть
    if(pollingIntervalId) {
      clearInterval(pollingIntervalId)
    }

    if(walletAddress) {
      // Сразу получаем статус при подключении кошелька
      fetchNftStatus(walletAddress)

      // Запускаем периодический опрос каждые 10 секунд
      const interval = setInterval(() => {
        fetchNftStatus(walletAddress)
      }, 10000) // Опрос каждые 10 секунд

      setPollingIntervalId(interval)

      // Очистка интервала при размонтировании компонента или изменении walletAddress
      return () => clearInterval(interval)
    } else {
      // Если кошелек отключен, очищаем статус NFT
      setNftStatus({
        completed_tasks_on_chain: 0,
        claimed_tasks_milestone_on_chain: 0,
        tasks_per_nft: 10,
        claimable_nfts: 0,
        is_claim_available: false,
      })
    }
  }, [ walletAddress, fetchNftStatus ]) // Зависимости: walletAddress и fetchNftStatus


  const handleFilterChange = (e, newValue) => setFilter(newValue)

  // =========================================================
  // ИЗМЕНЕНИЕ: addTodo теперь отправляет walletAddress и проверяет на дубликаты
  // =========================================================
  const addTodo = (text) => {
    if(!walletAddress) {
      toast.warn('Пожалуйста, подключите кошелек, чтобы добавлять задачи!')
      return
    }
    const trimmed = text.trim()
    const validationError = validateTodoText(text)
    if(validationError) {
      toast.warn(validationError)
      return
    }

    if(todos.some(todo => todo.text === trimmed && todo.user_address === walletAddress)) {
      toast.warn('Такая задача уже есть для вашего адреса')
      return
    }

    axios.post(API_URL, { text: trimmed, user_address: walletAddress })
         .then(() => {
           fetchTodos(filter)
           fetchNftStatus(walletAddress) // Обновляем NFT статус
           toast.success('Задача успешно добавлена!')
         })
         .catch(err => {
           const message = err.response?.data?.detail || 'Ошибка добавления задачи'
           console.error('Error details:', err.response?.data)
           toast.error(message)
         })
  }

  // =========================================================
  // ИЗМЕНЕНИЕ: deleteTodo проверяет user_address
  // =========================================================
  const deleteTodo = (id) => {
    const todoToDelete = todos.find(t => t.id === id)
    if(!todoToDelete) return // Задача не найдена

    if(todoToDelete.user_address !== walletAddress) {
      toast.error('Вы можете удалять только свои задачи.')
      return
    }

    axios.delete(`${ API_URL }/${ id }`)
         .then(() => {
           fetchTodos(filter)
           // Удаление задачи не должно влиять на completedTasks на блокчейне (если это не последняя выполненная)
           // но обновим статус NFT на всякий случай
           fetchNftStatus(walletAddress)
           toast.success('Задача успешно удалена!')
         })
         .catch(err => toast.error(err.response?.data?.detail || 'Ошибка удаления'))
  }

  // =========================================================
  // ИЗМЕНЕНИЕ: toggleTodo с оптимистичным обновлением
  // =========================================================
  const toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id)
    if(!todo) return
    if(todo.user_address !== walletAddress) {
      toast.error('Вы можете изменять статус только своих задач.')
      return
    }

    // 1. ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ UI
    setTodos(prevTodos =>
        prevTodos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        )
    )
    toast.info('Статус задачи обновляется...') // Сообщаем пользователю, что идет процесс

    // 2. ОТПРАВКА ЗАПРОСА НА БЭКЕНД
    axios.patch(`${ API_URL }/${ id }`, { completed: !todo.completed })
         .then(() => {
           // fetchTodos(filter) // Это может быть излишним, если локальное обновление уже произошло
           // NFT статус обновится через периодический опрос (polling)
           // toast.success('Статус задачи обновлен!');
         })
         .catch(err => {
           // В случае ошибки, откатываем UI
           setTodos(prevTodos =>
               prevTodos.map(t =>
                   t.id === id ? { ...t, completed: todo.completed } : t // Откатываем обратно
               )
           )
           const message = err.response?.data?.detail || 'Неизвестная ошибка'
           console.error('Ошибка при переключении статуса задачи:', err)
           toast.error(`Ошибка редактирования: ${ message }. Откат изменений.`)
         })
  }

  // =========================================================
  // ИЗМЕНЕНИЕ: editTodo проверяет user_address
  // =========================================================
  const editTodo = (id, newText) => {
    const todoToEdit = todos.find(t => t.id === id)
    if(!todoToEdit) return // Задача не найдена

    if(todoToEdit.user_address !== walletAddress) {
      toast.error('Вы можете редактировать только свои задачи.')
      return
    }
    axios.put(`${ API_URL }/${ id }`, { text: newText })
         .then(() => {
           fetchTodos(filter)
           toast.success('Задача отредактирована')
         })
         .catch(err => toast.error('Ошибка редактирования: ', err.response?.data?.detail || 'Неизвестная ошибка'))
  }

  const toggleThemeMode = () => setMode(prev => ( prev === 'light' ? 'dark' : 'light' ))

  const handlePremiumClick = async() => {
    try {
      const { data } = await axios.post(STRIPE_API_URL)
      window.location.href = data.url
    } catch( err ) {
      const message = err.response?.data?.detail || 'Ошибка перехода к Stripe'
      toast.error(message)
    }
  }

  // =========================================================
  // ИЗМЕНЕНИЕ: connectWallet сразу получает статус NFT
  // =========================================================
  const connectWallet = async() => {
    if(window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setWalletAddress(accounts[ 0 ])
        toast.success('Кошелек MetaMask успешно подключен!')
        // fetchNftStatus(accounts[0]); // Вызывается через useEffect при изменении walletAddress
      } catch( error ) {
        console.error('Ошибка при подключении кошелька:', error)
        toast.error('Не удалось подключить кошелек MetaMask. Разрешите доступ.')
      }
    } else {
      toast.warn('MetaMask не обнаружен. Пожалуйста, установите его для использования Web3 функций.')
      setTimeout(() => {
        window.open('https://metamask.io/download/', '_blank')
      }, 3000)
    }
  }

  // =========================================================
  // ИЗМЕНЕНИЕ: claimNft теперь использует данные из nftStatus и обновляет его после клейма
  // =========================================================
  const claimNft = async() => {
    if(!walletAddress) {
      toast.error('Пожалуйста, сначала подключите ваш кошелек MetaMask.')
      return
    }

    if(!nftStatus.is_claim_available) {
      // Улучшенное сообщение, сколько осталось до следующего NFT
      const tasksRemaining = nftStatus.tasks_per_nft - ( nftStatus.completed_tasks_on_chain % nftStatus.tasks_per_nft )
      toast.warn(`Выполните еще ${ tasksRemaining } задач, чтобы получить следующий NFT!`)
      return
    }

    setIsClaimingNft(true)
    try {
      const response = await axios.post(`${ CLAIM_NFT_API_URL }/${ walletAddress }`)
      toast.success(`Поздравляем! Ваш NFT успешно заклеймлено! Хэш транзакции: ${ response.data.transaction_hash ? response.data.transaction_hash.substring(0, 6) + '...' + response.data.transaction_hash.slice(-4) : 'нет хэша' }`)
      console.log('Хеш транзакции:', response.data.transaction_hash)

      // После успешного клейма, сразу же обновляем NFT статус
      await fetchNftStatus(walletAddress)
      // fetchTodos(filter); // Не обязательно, если клейм не меняет список задач
    } catch( error ) {
      console.error('Ошибка при клейме NFT через бэкенд:', error)
      if(error.response && error.response.data?.detail) {
        toast.error(error.response.data.detail)
      } else if(error.code === 'ECONNABORTED') {
        toast.error('Превышено время ожидания ответа от сервера.')
      } else {
        toast.error('Не удалось клеймить NFT. Проверьте консоль для деталей.')
      }
    } finally {
      setIsClaimingNft(false)
    }
  }

  const pathname = window.location.pathname

  if(pathname === '/success') {
    return (
        <Container maxWidth="sm" sx={ { mt: 4, textAlign: 'center' } }>
          <Typography variant="h5" color="primary" gutterBottom>
            ✅ Оплата успешно завершена!
          </Typography>
          <Typography variant="body1">
            Спасибо за вашу поддержку! Теперь вы можете наслаждаться премиум-функциями.
          </Typography>
          <Button variant="contained" sx={ { mt: 3 } } onClick={ () => window.location.href = '/' }>
            Вернуться к задачам
          </Button>
        </Container>
    )
  }

  if(pathname === '/cancel') {
    return (
        <Container maxWidth="sm" sx={ { mt: 4, textAlign: 'center' } }>
          <Typography variant="h5" color="error" gutterBottom>
            ❌ Оплата отменена.
          </Typography>
          <Typography variant="body1">
            Ваша платежная сессия была отменена. Вы всегда можете попробовать снова.
          </Typography>
          <Button variant="contained" sx={ { mt: 3 } } onClick={ () => window.location.href = '/' }>
            Вернуться к задачам
          </Button>
        </Container>
    )
  }

  // Расчет значений для прогресс-бара и кнопки
  const progressToNextNft = nftStatus.tasks_per_nft > 0
      ? ( nftStatus.completed_tasks_on_chain % nftStatus.tasks_per_nft / nftStatus.tasks_per_nft ) * 100
      : 0

  // Рассчитываем, сколько задач нужно до следующего NFT
  const tasksUntilNextNft = nftStatus.tasks_per_nft - ( nftStatus.completed_tasks_on_chain % nftStatus.tasks_per_nft )
  // Определяем порог для отображения на кнопке
  const nextMilestoneDisplay = nftStatus.completed_tasks_on_chain + tasksUntilNextNft


  return (
      <ThemeProvider theme={ theme }>
        <CssBaseline/>
        <Container maxWidth="sm" sx={ { mt: 4 } }>
          <Box sx={ {
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            gap: { xs: 1, sm: 2 }
          } }>
            <Button
                variant="contained"
                color="secondary"
                startIcon={ <DiamondIcon/> }
                onClick={ handlePremiumClick }
                sx={ { flexShrink: 0, width: { xs: '100%', sm: 'auto' } } }
            >
              Unlock Premium
            </Button>
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                align="center"
                sx={ { flexGrow: 1, mr: { xs: 0, sm: 2 } } }
            >
              My To-Do
            </Typography>
            <IconButton sx={ { ml: { xs: 'auto', sm: 0 } } } onClick={ toggleThemeMode } color="inherit">
              { mode === 'dark' ? <Brightness7Icon/> : <Brightness4Icon/> }
            </IconButton>
          </Box>
          <Box sx={ { display: 'flex', justifyContent: 'center', gap: 2, mb: 2, flexWrap: 'wrap' } }>
            { !walletAddress ? (
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={ <WalletIcon/> }
                    onClick={ connectWallet }
                >
                  Подключить кошелек
                </Button>
            ) : (
                <Typography variant="body2" sx={ { alignSelf: 'center' } }>
                  Кошелек: { walletAddress.substring(0, 6) }...{ walletAddress.substring(walletAddress.length - 4) }
                </Typography>
            ) }
            <Box sx={ {
              width: '100%',
              maxWidth: '300px',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              alignItems: 'center'
            } }>
              <Button
                  variant="contained"
                  color="success"
                  startIcon={ <CardGiftcardIcon/> }
                  onClick={ claimNft }
                  disabled={ !walletAddress || isClaimingNft || !nftStatus.is_claim_available }
                  sx={ { width: '100%' } }
              >
                { isClaimingNft ? 'Клейминг...' : `Клеймить NFT (${ nftStatus.completed_tasks_on_chain }/${ nextMilestoneDisplay })` }
              </Button>
              <LinearProgress
                  variant="determinate"
                  value={ progressToNextNft }
                  sx={ { width: '100%', height: 8, borderRadius: 4 } }
              />
            </Box>
          </Box>
          <Box sx={ { borderBottom: 1, borderColor: 'divider', mb: 2 } }>
            <Tabs
                value={ filter }
                onChange={ handleFilterChange }
                aria-label="todo filters"
                variant="fullWidth"
                indicatorColor="primary"
                textColor="inherit"
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
            position="bottom-right"
            autoClose={ 3000 }
            hideProgressBar={ false }
            newestOnTop={ false }
            closeOnClick
            rtl={ false }
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={ mode === 'dark' ? 'dark' : 'light' }
        />
      </ThemeProvider>
  )
}

export default App