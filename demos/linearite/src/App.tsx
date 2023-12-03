import 'animate.css/animate.min.css'
import Board from './pages/Board'
import { useState, createContext } from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom'
import { cssTransition, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import List from './pages/List'
import Issue from './pages/Issue'
import LeftMenu from './components/LeftMenu'
import SyncWorker from "./sync-worker.js?worker";
import { DBName } from './domain/Schema'
import { useSync } from '@vlcn.io/react'

interface MenuContextInterface {
  showMenu: boolean
  setShowMenu: (show: boolean) => void
}

export const MenuContext = createContext(null as MenuContextInterface | null)

const slideUp = cssTransition({
  enter: 'animate__animated animate__slideInUp',
  exit: 'animate__animated animate__slideOutDown',
})

function getEndpoint() {
  let proto = "ws:";
  const host = window.location.host;
  if (window.location.protocol === "https:") {
    proto = "wss:";
  }

  return `${proto}//${host}/sync`;
}

const worker = new SyncWorker();
const App = () => {
  const [showMenu, setShowMenu] = useState(false)
  useSync({
    // Name of the local database to sync
    dbname: DBName,
    endpoint: getEndpoint(),
    // Name of the remote database to sync
    room: DBName,
    // Worker process that carries out the sync
    worker,
  })

  const router = (
    <Routes>
      <Route path="/" element={<List />} />
      <Route path="/search" element={<List showSearch={true} />} />
      <Route path="/board" element={<Board />} />
      <Route path="/issue/:id" element={<Issue />} />
    </Routes>
  )

  return (
    <MenuContext.Provider value={{ showMenu, setShowMenu }}>
      <BrowserRouter>
        <div className="flex w-full h-screen overflow-y-hidden">
          <LeftMenu />
          {router}
        </div>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          transition={slideUp}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </BrowserRouter>
    </MenuContext.Provider>
  )
}

export default App
