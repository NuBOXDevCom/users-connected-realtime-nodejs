require('dotenv').config()
let io = require('socket.io')(3001)
let jwt = require('jsonwebtoken')

let users = []

io.on('connection', socket => {
    let currentUser = null
    socket.on('identify', ({token}) => {
        try {
            let decoded = jwt.verify(token, process.env.APP_TOKEN, {
                algorithms: ['HS256']
            })
            currentUser = {
                id: decoded.user_id,
                name: decoded.user_name,
                count: 1
            }
            let user = users.find(u => u.id === currentUser.id)
            if (user) {
                user.count++
            } else {
                users.push(currentUser)
                socket.broadcast.emit('user.new', {user: currentUser})
            }
            socket.emit('users', {users})
        }
        catch (e) {
            console.error(e.message)
        }
    })

    socket.on('disconnect', () => {
        if (currentUser) {
            let user = users.find(u => u.id === currentUser.id)
            if (user) {
                user.count--
                if (user <= 0) {
                    users = users.filter(u => u.id !== currentUser.id)
                    socket.broadcast.emit('leave', {user: currentUser})
                }
            }

        }
    })
})
