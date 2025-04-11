import logo from './logo.svg';
import { Route, Routes } from 'react-router-dom'
import './App.css';
import Main from './components/Main';
import './css/main.css';

function App() {
  return (
    <div>
        <Route path='/' element={<Main></Main>}></Route>
    </div>
  );
}

export default App;
