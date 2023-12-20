import { createRoot } from 'react-dom/client'
import './style.css'

import Root from './Root'

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<Root />)
