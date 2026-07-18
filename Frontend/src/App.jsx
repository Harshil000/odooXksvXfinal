import { RouterProvider } from 'react-router';
import router from './app.route.jsx';
import AuthContextProvider from './features/auth/auth.context.jsx';
import { CartProvider } from './features/cart/context/cart.context.jsx';

function App() {
  return (
    <AuthContextProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthContextProvider>
  );
}

export default App;
