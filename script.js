const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Включаем CORS middleware для кросс-доменных запросов
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Основной маршрут для получения данных
app.get('/api/pmi-data', async (req, res) => {
  try {
    const url = 'https://cpk.msu.ru/rating/dep_02';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Извлекаем дату
    const date = $('p').eq(15).text().trim();

    // Парсим таблицу
    const table = $('table').eq(8);
    const tableText = table.text().split('\n')
      .map(item => item.trim())
      .filter(item => item !== '');

    // Подготавливаем структуру данных
    const result = {
      date: date,
      columns: [
        { key: 'num', header: 'номер' },
        { key: 'sogl', header: 'согласие' },
        { key: 'prior', header: 'приоритет' },
        { key: 'marks', header: 'баллы' },
        { key: 'flag', header: 'статус' }
      ],
      rows: []
    };

    // Обрабатываем данные таблицы
    for (let i = 16; i < tableText.length - 19; i += 19) {
      const block = tableText.slice(i, i + 19);
      result.rows.push({
        num: block[1],
        sogl: block[2],
        prior: block[3],
        marks: block[7],
        flag: block[16]
      });
    }

    // Отправляем результат
    res.json({
      success: true,
      data: result,
      excelConfig: {
        filename: 'PMI.xlsx',
        worksheet: 'Data',
        columnsOrder: ['num', 'sogl', 'prior', 'marks', 'flag']
      }
    });

  } catch (error) {
    console.error('Ошибка парсинга:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении данных',
      details: error.message
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Доступ к данным: http://localhost:${PORT}/api/pmi-data`);
});