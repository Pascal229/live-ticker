import React from 'react'
import ReactPlayer from 'react-player'

function Livestream() {
  return (
    <div className='bg-red-700 aspect-video'>
        <ReactPlayer url="https://www.youtube.com/watch?v=ysz5S6PUM-U" height="100%" width="100%"/>

    </div>
  )
}

export default Livestream