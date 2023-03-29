import React from 'react'
import { trpc } from './client'
import Livestream from './components/Livestream'
import Comments from './components/Comments'
import Ticker from './components/Ticker'

interface Event {

}

interface Team {
  name: string;
  score: number;
  events: Event[]
}

interface Game {
  id: number;
  teams: [Team, Team]
}

const Liveticker = () => {
  const [game, setGame] = React.useState(null)

  return (
    <div className='flex flex-col h-screen lg:flex-row'>
      <div className='flex flex-col flex-1'>
        <Livestream/>
        <Ticker/>
      </div>
      <div className='w-full h-full lg:max-w-sm'>
      <Comments/>
      </div>
    </div>
  )
}

export default Liveticker