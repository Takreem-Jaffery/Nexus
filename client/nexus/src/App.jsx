import {BrowserRouter, Route, Routes} from 'react-router-dom'
import './App.css'
import CreateRoom from './routes/CreateRoom'
import Room from './routes/Room';

function App() {

  return (
    <>
      <div className='App'>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<CreateRoom/>}/>
            <Route path='/room/:roomID' element={<Room/>}/>
          </Routes>
        </BrowserRouter>
      </div>
    </>
  )
}

export default App
