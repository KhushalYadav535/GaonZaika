const axios = require('axios');

async function checkReceipt() {
  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/getReceipts', {
      ids: ['019f3b31-e070-74ff-8553-92d6616b2eba']
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}

checkReceipt();
