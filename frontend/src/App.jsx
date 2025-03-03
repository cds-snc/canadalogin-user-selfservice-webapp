import {Routes, Route, Navigate} from 'react-router';
import HomePage from "./views/Home/HomePage";


function App() {
      return (
          <Routes>
              <Route path="/" element={ <HomePage />} />
              <Route path="/:language" element={ <HomePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      );
}



export default App;
