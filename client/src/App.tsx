import { api } from './client'

function App() {
  const data = await api.test()

  return (
    <div className="text-red-500">
     Hello {data.message}
    </div>
  )
}

export default App
