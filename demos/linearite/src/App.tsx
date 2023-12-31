import "animate.css/animate.min.css";
import Board from "./pages/Board";
import { useState, createContext } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { cssTransition, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import List from "./pages/List";
import LeftMenu from "./components/LeftMenu";
import { FPSMeter } from "@schickling/fps-meter";

interface MenuContextInterface {
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
}

export const MenuContext = createContext(null as MenuContextInterface | null);

const slideUp = cssTransition({
  enter: "animate__animated animate__slideInUp",
  exit: "animate__animated animate__slideOutDown",
});

const App = () => {
  const [showMenu, setShowMenu] = useState(false);

  const router = (
    <Routes>
      <Route path="/*" element={<List />} />
      <Route path="/board" element={<Board />} />
    </Routes>
  );

  return (
    <MenuContext.Provider value={{ showMenu, setShowMenu }}>
      <FPSMeter
        className="absolute right-0 top-0 z-50 bg-gray-800"
        height={40}
      />
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
  );
};

export default App;
