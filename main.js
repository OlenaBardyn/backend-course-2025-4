const { Command } = require('commander');
const http = require('http');
const fs = require('fs');

const program = new Command();

program
  .requiredOption('-i, --input <path>', 'input file path')
  .requiredOption('-h, --host <address>', 'server host address')
  .requiredOption('-p, --port <number>', 'server port number');

program.parse();
const options = program.opts();

// Перевірка наявності файлу
if (!fs.existsSync(options.input)) {
  console.error('Cannot find input file');
  process.exit(1);
}

// Створення HTTP сервера
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is running! Lab4 titanic.json\n');
});

// Запуск сервера
server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
  console.log(`Input file: ${options.input}`);
});

// Обробка помилок сервера
server.on('error', (err) => {
  console.error('Server error:', err.message);
});