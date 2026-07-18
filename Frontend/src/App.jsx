import { RouterProvider } from 'react-router';
import router from './app.route.jsx';
import AuthContextProvider from './features/auth/auth.context.jsx';

function App() {
  return (
    <AuthContextProvider>
      <RouterProvider router={router} />
    </AuthContextProvider>
  );
}

export default App;
