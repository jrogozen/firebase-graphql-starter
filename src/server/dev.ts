import createServer from './server';

const server = createServer();

server.listen(process.env.PORT || 3000, () => {
    console.log('express server started!');
});
