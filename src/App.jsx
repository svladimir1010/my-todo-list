// Основные импорты React, MUI и другие библиотеки
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Box, Container, IconButton, Typography, Tabs, Tab, Button, ThemeProvider, CssBaseline } from '@mui/material'
import AddTodo from './components/AddTodo.jsx'
import TodoList from './components/TodoList.jsx'
import axios from 'axios'

// Иконки для UI
import Brightness4Icon from '@mui/icons-material/Brightness4' // Иконка для тёмной темы (луна)
import Brightness7Icon from '@mui/icons-material/Brightness7' // Иконка для светлой темы (солнце)
import DiamondIcon from '@mui/icons-material/Diamond' // Иконка для кнопки Premium
import WalletIcon from '@mui/icons-material/AccountBalanceWallet' // Иконка MetaMask
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard' // Иконка для NFT клейма

// Уведомления Toastify
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Web3: библиотека для взаимодействия с MetaMask и Ethereum
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './constants/contractConfig.js' // Константы для адреса и ABI контракта
import { lightTheme, darkTheme } from './theme' // Определение светлой и тёмной темы

// URL API и Stripe, получаем из .env
const API_URL = import.meta.env.VITE_API_URL // Базовый URL вашего FastAPI бэкенда
// URL для эндпоинта Stripe Checkout, используем базовый API_URL и добавляем специфичный путь
const STRIPE_API_URL = `${ API_URL.replace('/todos', '') }/create-checkout-session`

const App = () => {
  // Состояния UI и задач
  const [ todos, setTodos ] = useState([]) // Состояние для списка задач (todos)
  // Состояние для текущего режима темы, инициализируется из localStorage или по умолчанию 'light'
  const [ mode, setMode ] = useState(() => localStorage.getItem('themeMode') || 'light')
  const [ filter, setFilter ] = useState('all')  // Состояние фильтра вкладок: 'all', 'active', 'completed'

  // Состояния для взаимодействия с блокчейном (Web3)
  const [ walletAddress, setWalletAddress ] = useState(null)  // Адрес подключенного кошелька MetaMask
  const [ contract, setContract ] = useState(null) // Экземпляр контракта ethers.js для вызова функций
  const [ signer, setSigner ] = useState(null)   // Объект Signer ethers.js (аккаунт, подписывающий транзакции)
  const [ totalCompletedTasks, setTotalCompletedTasks ] = useState(0) // Счетчик выполненных задач (для активации NFT)
  const [ isClaimingNft, setIsClaimingNft ] = useState(false) // Состояние для индикации загрузки/транзакции NFT

  // Создание объекта темы на основе текущего режима (light/dark)
  // useMemo предотвращает пересоздание объекта темы при каждом рендере, если режим не изменился
  const theme = useMemo(() => ( mode === 'light' ? lightTheme : darkTheme ), [ mode ])

  // Эффект для сохранения режима темы в localStorage при каждом изменении `mode`
  useEffect(() => {
    localStorage.setItem('themeMode', mode)
  }, [ mode ]) // Зависимость от mode: эффект будет выполняться при изменении mode

  // Функция для получения списка задач с бэкенда, с возможностью фильтрации
  // useCallback мемоизирует эту функцию, предотвращая её пересоздание при каждом рендере
  const fetchTodos = useCallback((currentFilter) => {
    let apiUrl = API_URL
    // Добавляем параметры фильтрации к URL, если выбраны "Активные" или "Выполненные"
    if(currentFilter === 'active') apiUrl += '?completed=false'
    else if(currentFilter === 'completed') apiUrl += '?completed=true'

    axios.get(apiUrl) // Выполняем GET-запрос к API
         .then(res => {
           setTodos(res.data) // Обновляем состояние списка задач
           // Подсчитываем количество выполненных задач и обновляем состояние
           setTotalCompletedTasks(res.data.filter(todo => todo.completed).length)
         })
         .catch(err => {
           console.error('Ошибка загрузки задач:', err)
           toast.error('Не удалось загрузить задачи') // Уведомление об ошибке
         })
  }, [ API_URL ]) // Зависимость от API_URL

  // Эффект для загрузки задач при первом рендере и при изменении фильтра
  useEffect(() => {
    fetchTodos(filter)
  }, [ filter, fetchTodos ]) // Зависимости: fetchTodos (мемоизированная) и filter

  // Обработчик изменения активной вкладки фильтра
  const handleFilterChange = (e, newValue) => setFilter(newValue)

  // Добавляем новую задачу
  const addTodo = (text) => {
    axios.post(API_URL, { text }) // Отправляем новый todo на сервер
         .then(() => {
           fetchTodos(filter) // Перезагружаем задачи с учетом текущего фильтра (важно для фильтров)
           toast.success('Задача успешно добавлена!') // Уведомление об успехе
         })
         .catch(err => {
           const message = err.response?.data?.detail || 'Ошибка добавления задачи'
           toast.error(message) // Уведомление об ошибке
         })
  }

  // Удаление задачи по ID
  const deleteTodo = (id) => {
    axios.delete(`${ API_URL }/${ id }`) // Отправляем DELETE-запрос на сервер
         .then(() => {
           fetchTodos(filter) // Перезагружаем задачи
           toast.success('Задача успешно удалена!') // Уведомление об успехе
         })
         .catch(err => toast.error(err.response?.data?.detail || 'Ошибка удаления'))
  }

  // Переключение статуса выполнения задачи (выполнена/не выполнена)
  const toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id) // Находим задачу по ID
    if(!todo) return // Если задача не найдена, ничего не делаем
    axios.patch(`${ API_URL }/${ id }`, { completed: !todo.completed }) // Отправляем PATCH-запрос для обновления статуса
         .then(() => {
           fetchTodos(filter); // Перезагружаем задачи, чтобы обновить счетчик выполненных задач и фильтры
           toast.info('Статус задачи обновлен!'); // Информационное уведомление
         })
         .catch(err => toast.error('Ошибка редактирования: ', err.response?.data?.detail || 'Неизвестная ошибка'))
  }

  // Редактирование текста задачи
  const editTodo = (id, newText) => {
    axios.put(`${ API_URL }/${ id }`, { text: newText }) // Отправляем PUT-запрос для обновления текста задачи
         .then(() => {
           fetchTodos(filter)  // Перезагружаем задачи
           toast.success('Задача отредактирована') // Уведомление об успехе
         })
         .catch(err => toast.error('Ошибка редактирования: ', err.response?.data?.detail || 'Неизвестная ошибка'))
  }

  // Переключение темы интерфейса (светлая/тёмная)
  const toggleThemeMode = () => setMode(prev => ( prev === 'light' ? 'dark' : 'light' ))

  // ФУНКЦИЯ: Обработчик для кнопки Premium, инициализация Stripe Premium Checkout
  const handlePremiumClick = async() => {
    try {
      // Отправляем запрос на наш бэкенд для создания платежной сессии Stripe
      const { data } = await axios.post(STRIPE_API_URL)
      window.location.href = data.url // Перенаправляем пользователя на страницу Stripe Checkout
    } catch( err ) {
      const message = err.response?.data?.detail || 'Ошибка перехода к Stripe'
      toast.error(message) // Уведомление об ошибке
    }
  }

  // ФУНКЦИЯ: Подключение MetaMask, создание провайдера и экземпляра контракта
  const connectWallet = async() => {
    // Проверяем, установлено ли расширение MetaMask в браузере
    if(window.ethereum) {
      try {
        // Запрашиваем у пользователя разрешение на подключение аккаунтов MetaMask
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setWalletAddress(accounts[ 0 ]) // Сохраняем первый подключенный адрес

        // Создаем провайдер ethers.js для взаимодействия с блокчейном через MetaMask
        const provider = new ethers.BrowserProvider(window.ethereum)
        // Получаем объект Signer для подписи транзакций (представляет подключенный аккаунт)
        const signerInstance = await provider.getSigner()
        setSigner(signerInstance)

        // Создаем экземпляр смарт-контракта для вызова его функций
        const nftContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerInstance)
        setContract(nftContract)

        // Слушаем событие смены аккаунта в MetaMask
        window.ethereum.on('accountsChanged', (newAccounts) => {
          if(newAccounts.length > 0) {
            setWalletAddress(newAccounts[ 0 ])
            // При смене аккаунта, пересоздаем signer и contract с новым аккаунтом
            const newProvider = new ethers.BrowserProvider(window.ethereum)
            newProvider.getSigner().then(s => {
              setSigner(s)
              setContract(new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s))
            })
          } else {
            // Если все аккаунты отключены
            setWalletAddress(null)
            setSigner(null)
            setContract(null)
          }
        })

        // Слушаем событие смены сети в MetaMask
        window.ethereum.on('chainChanged', async (chainIdHex) => { // chainIdHex приходит в HEX-формате (например, "0xaa36a7")
          const chainIdDecimal = parseInt(chainIdHex, 16) // Преобразуем HEX в десятичное число
          // Проверяем, соответствует ли новая сеть Sepolia (Chain ID 11155111)
          if(chainIdDecimal !== 11155111) {
            toast.warn('Вы подключены к другой сети. Пожалуйста, переключитесь на Sepolia.')
            setWalletAddress(null) // Очищаем адрес, так как сеть не та
            setSigner(null)
            setContract(null)
          } else {
            // Если вернулись на Sepolia, обновляем провайдер/подписанта/контракт
            const newProvider = new ethers.BrowserProvider(window.ethereum)
            const newSigner = await newProvider.getSigner()
            setSigner(newSigner)
            setContract(new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, newSigner))
            toast.info('Сеть изменена на Sepolia.')
          }
        })

        toast.success('Кошелек MetaMask успешно подключен!') // Уведомление об успехе
      } catch( error ) {
        console.error('Ошибка при подключении кошелька:', error)
        toast.error('Не удалось подключить кошелек MetaMask. Разрешите доступ.')
      }
    } else {
      // Если MetaMask не обнаружен, предлагаем его установить
      toast.warn('MetaMask не обнаружен. Пожалуйста, установите его для использования Web3 функций.')
      setTimeout(() => {
        window.open('https://metamask.io/download/', '_blank') // Открываем ссылку для установки
      }, 3000)
    }
  }

  // ФУНКЦИЯ: Клейм NFT за выполнение 10 задач
  const claimNft = async() => {
    // Предварительные проверки: подключен ли кошелек, есть ли объекты контракта и подписанта
    if(!walletAddress || !contract || !signer) {
      toast.error('Пожалуйста, сначала подключите ваш кошелек MetaMask.')
      return
    }

    // Проверяем условие для клейма NFT (выполнено 10 задач)
    if(totalCompletedTasks < 10) {
      toast.warn(`Выполните еще ${ 10 - totalCompletedTasks } задач, чтобы получить NFT!`)
      return
    }

    setIsClaimingNft(true) // Включаем состояние загрузки/транзакции
    try {
      // ИСПРАВЛЕНИЕ ОШИБКИ CHAIN ID: Получаем Chain ID через провайдера, связанного с Signer
      const currentNetwork = await signer.provider.getNetwork() // Получаем объект Network
      const currentChainId = currentNetwork.chainId // Из него получаем chainId (это будет объект BigInt в ethers v6)

      // Добавляем логирование для отладки
      console.log('Текущий Chain ID (BigInt):', currentChainId);
      console.log('Тип Chain ID:', typeof currentChainId);
      console.log('Sepolia Chain ID (Decimal):', 11155111);
      console.log('Сравнение Number(currentChainId) === 11155111:', Number(currentChainId) === 11155111);


      // Преобразуем BigInt Chain ID в обычное число (Number) для корректного сравнения
      if(Number(currentChainId) !== 11155111) { // 11155111 - десятичный Chain ID для Sepolia
        toast.error('Пожалуйста, переключитесь на сеть Sepolia в MetaMask.')
        setIsClaimingNft(false)
        return
      }

      const recipientAddress = walletAddress // NFT будет выпущен на подключенный адрес кошелька
      // URI метаданных NFT. Для простоты пока используем заглушку из GitHub.
      // В реальном приложении это была бы уникальная ссылка на IPFS или другой децентрализованный хранилище.
      const tokenURI = 'https://raw.githubusercontent.com/Anand-M-A/NFT-Metadata/main/basic-nft-metadata.json'

      // Вызываем функцию mintNft на смарт-контракте
      // Эта транзакция будет инициирована MetaMask'ом и потребует подтверждения пользователя
      const tx = await contract.mintNft(recipientAddress, tokenURI)
      toast.info('Транзакция отправлена! Ожидаем подтверждения...')

      // Ждем, пока транзакция будет подтверждена в блокчейне (включена в блок)
      await tx.wait()

      toast.success('Поздравляем! Ваш NFT успешно выдан!')
      // Здесь в реальном приложении можно было бы добавить логику для пометки на бэкенде,
      // что пользователь уже получил NFT, чтобы предотвратить повторный клейм.

    } catch( error ) {
      console.error('Ошибка при клейме NFT:', error)
      // Обработка различных типов ошибок транзакции
      if(error.code === 'ACTION_REJECTED') {
        toast.warn('Транзакция отклонена MetaMask.')
      } else if(error.message && error.message.includes('Ownable: caller is not the owner')) {
        // Эта ошибка означает, что контракт был развернут одним адресом,
        // а функцию onlyOwner пытается вызвать другой. Для этой задачи,
        // убедитесь, что вы клеймите с кошелька, который развернул контракт.
        toast.error('Вызов NFT не разрешен. Только владелец контракта может клеймить.')
      } else {
        toast.error('Не удалось получить NFT. Проверьте консоль для деталей.')
      }
    } finally {
      setIsClaimingNft(false) // Отключаем состояние загрузки независимо от результата
    }
  }


  // Определяем текущий путь для условного рендеринга страниц успеха/отмены платежа
  const pathname = window.location.pathname

  // Условный рендеринг страницы успешной оплаты
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

  // Условный рендеринг страницы отмены оплаты
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

  // Основной рендеринг приложения
  return (
      // Оборачиваем все приложение в ThemeProvider для применения темы Material-UI
      <ThemeProvider theme={ theme }>
        {/* CssBaseline сбрасывает базовые стили браузера и применяет стили темы к body */ }
        <CssBaseline/>

        <Container maxWidth={ 'sm' } sx={ { mt: 4 } }>
          {/* Верхняя часть: Кнопка Premium, Заголовок, Кнопка переключения темы */ }
          <Box sx={ {
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' }, // Адаптивное расположение: колонка на моб., строка на десктопе
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            gap: { xs: 1, sm: 2 } // Отступы между элементами
          } }>
            {/* Кнопка Premium */ }
            <Button
                variant="contained"
                color="secondary"
                startIcon={ <DiamondIcon/> }
                onClick={ handlePremiumClick }
                sx={ { flexShrink: 0, width: { xs: '100%', sm: 'auto' } } } // На моб. - полная ширина, на десктопе - авто
            >
              Premium
            </Button>
            <Typography
                variant="h4" // Стиль заголовка
                component="h1" // Семантический элемент для SEO
                gutterBottom // Отступ снизу
                align="center" // Выравнивание текста по центру
                sx={ { flexGrow: 1, mr: { xs: 0, sm: 2 } } } // Заголовок занимает доступное пространство, отступ справа на десктопе
            >
              My To-Do List
            </Typography>

            {/* Кнопка переключения темы */ }
            <IconButton sx={ { ml: { xs: 'auto', sm: 0 } } } onClick={ toggleThemeMode } color="inherit">
              { mode === 'dark' ? <Brightness7Icon/> : <Brightness4Icon/> } {/* Иконка меняется в зависимости от темы */}
            </IconButton>
          </Box>

          {/* Блок для Web3 функций: Подключение кошелька и Клейм NFT */ }
          <Box sx={ { display: 'flex', justifyContent: 'center', gap: 2, mb: 2, flexWrap: 'wrap' } }>
            { !walletAddress ? ( // Если кошелек не подключен, показываем кнопку "Подключить кошелек"
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={ <WalletIcon/> }
                    onClick={ connectWallet } // Обработчик подключения
                >
                  Подключить кошелек
                </Button>
            ) : ( // Если кошелек подключен, показываем сокращенный адрес
                <Typography variant="body2" sx={ { alignSelf: 'center' } }>
                  Кошелек: { walletAddress.substring(0, 6) }...{ walletAddress.substring(walletAddress.length - 4) }
                </Typography>
            ) }

            {/* Кнопка Claim NFT */ }
            <Button
                variant="contained"
                color="success"
                startIcon={ <CardGiftcardIcon/> }
                onClick={ claimNft } // Обработчик клейма NFT
                // Кнопка отключена, если идёт клейм или выполнено менее 10 задач
                disabled={ isClaimingNft || totalCompletedTasks < 10 }
            >
              { isClaimingNft ? 'Клейминг...' : `Клеймить NFT (${ totalCompletedTasks }/10)` } {/* Текст кнопки меняется */}
            </Button>
          </Box>

          {/* Вкладки фильтрации задач */ }
          <Box sx={ { borderBottom: 1, borderColor: 'divider', mb: 2 } }>
            <Tabs
                value={ filter } // Текущий активный фильтр
                onChange={ handleFilterChange } // Обработчик смены вкладки
                aria-label="todo filters"
                variant="fullWidth" // Вкладки занимают всю доступную ширину
                indicatorColor="primary" // Цвет индикатора активной вкладки
                textColor="inherit" // Цвет текста вкладок
            >
              <Tab label="Все" value="all"/>
              <Tab label="Активные" value="active"/>
              <Tab label="Выполненные" value="completed"/>
            </Tabs>
          </Box>

          {/* Компоненты добавления и списка задач */ }
          <AddTodo onAddTodo={ addTodo } todos={ todos }/>
          <TodoList
              todos={ todos }
              onDeleteTodo={ deleteTodo }
              onToggleTodo={ toggleTodo }
              onEditTodo={ editTodo }
          />
        </Container>
        {/* Контейнер для уведомлений Toastify */ }
        <ToastContainer
            position="bottom-right" // Позиция уведомлений на экране
            autoClose={ 3000 }        // Автоматическое закрытие через 3 секунды
            hideProgressBar={ false } // Показывать полосу прогресса
            newestOnTop={ false }     // Новые уведомления не сверху
            closeOnClick            // Закрытие по клику
            rtl={ false }             // Справа налево (для языков с письмом справа налево)
            pauseOnFocusLoss        // Пауза уведомлений при потере фокуса окна браузера
            draggable               // Уведомления можно перетаскивать
            pauseOnHover            // Пауза при наведении курсора
            theme={ mode === 'dark' ? 'dark' : 'light' } // Тема Toastify соответствует текущей теме MUI
        />

      </ThemeProvider>
  )
}

export default App
