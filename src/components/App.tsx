import ExpenseTracker from "./ExpenseTracker";
import { useAuth } from "../utils/useAuth";
import Register from "../auth/Register";
function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  return (
    <>
      {user ? (
        <div className="bg-gradient-to-br from-gray-900 to-black min-h-dvh w-full text-white">
          <header className="py-8">
            <h1 className="text-4xl font-bold text-center">Expense Tracker</h1>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ExpenseTracker />
          </main>
        </div>
      ) : (
        <Register />
      )}
    </>
  );
}

export default App;
