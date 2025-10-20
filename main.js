const fs = require('fs');
const http = require('http');
const { Command } = require('commander');
const { XMLBuilder } = require('fast-xml-parser');

const program = new Command();
program
  .requiredOption('-i, --input <file>', 'input JSON file')
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port');
program.parse();
const options = program.opts();

if (!fs.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

const xmlBuilder = new XMLBuilder({ format: true });

const server = http.createServer(function(req, res) { // сервер з колбеком для обробки запитів
  fs.readFile(options.input, 'utf-8', function(err, data) { // Читаємо файл асинхронно
    if (err) {
      console.error(err);
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.end('Server error: Cannot read file');
      return;
    }

    try {
      const passengers = data
        .split('\n')
        .filter(line => line.trim()) // Видаляємо порожні рядки
        .map(line => JSON.parse(line));

      const url = new URL(req.url, `http://${req.headers.host}`);
      const survived = url.searchParams.get('survived');
      const showAge = url.searchParams.get('age') === 'true';

      let filteredPassengers = passengers;
      
      if (survived === 'true') {
        filteredPassengers = passengers.filter(p => p.Survived == 1);
      } else if (survived === 'false') {
        filteredPassengers = passengers.filter(p => p.Survived == 0);
      }

      const xmlPassengers = filteredPassengers.map(passenger => {
        const passengerData = {
          name: passenger.Name,     
          ticket: passenger.Ticket  
        };
        
        if (showAge && passenger.Age) {
          passengerData.age = passenger.Age;
        }
        
        return passengerData;
      });

      const xmlData = { passengers: { passenger: xmlPassengers } };
      const xml = xmlBuilder.build(xmlData);

      // Запис файлу з колбеком
      fs.writeFile('titanic_result.xml', xml, 'utf-8', function(error) {
        if (error) {
          console.error(error);
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end('Server error: Cannot write file');
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/xml' });
        res.end(xml);
      });

    } catch (parseErr) {
      console.error(parseErr);
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.end('Server error: Invalid JSON data');
    }
  });
});

server.listen(options.port, options.host, function() {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});