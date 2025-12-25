import axios from 'axios';

async function testAxios() {
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/todos/1');
    console.log('Axios funcionando! Dados:', response.data);
  } catch (err) {
    console.error('Erro no axios:', err);
  }
}

testAxios();
