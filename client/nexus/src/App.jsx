import {BrowserRouter, Route, Routes} from 'react-router-dom'
import './App.css'
import HomePage from './components/HomePage'
import Room from './components/Room';

function App() {

  return (
    <>
      <div className='App'>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<HomePage/>}/>
            <Route path='/room/:roomID' element={<Room/>}/>
          </Routes>
        </BrowserRouter>
      </div>
    </>
  )
}

export default App
